/**
 * Alarm Service - Hệ thống báo thức sử dụng âm thanh và rung
 * Thay thế notifications để hoạt động trong Expo Go
 */

import { Platform, Alert, Vibration, AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-audio';
import { AlarmData, Shift, Note, UserSettings } from '../types';
import { storageService } from './storage';
import { t } from '../i18n';

interface ScheduledAlarm {
  id: string;
  title: string;
  message: string;
  scheduledTime: Date;
  type: 'shift_reminder' | 'note_reminder' | 'weather_warning';
  relatedId?: string;
  isActive: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface AlarmStatus {
  isSupported: boolean;
  hasAudioPermission: boolean;
  isBackgroundEnabled: boolean;
  scheduledCount: number;
  message: string;
}

class AlarmService {
  private alarms: Map<string, ScheduledAlarm> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private sound: Audio.Sound | null = null;
  private isInitialized = false;
  private appState: AppStateStatus = 'active';
  private currentLanguage = 'vi';
  private lastScheduleTime: number = 0;
  private scheduleDebounceTime: number = 1000; // 1 giây debounce
  private appStateSubscription: any = null;

  // ✅ Track thời gian lên lịch để tránh trigger ngay lập tức
  private alarmScheduleTimes: Map<string, number> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Cấu hình audio với expo-audio
      try {
        if (Audio && Audio.setAudioModeAsync) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } else {
          console.warn('⚠️ AlarmService: Audio.setAudioModeAsync không khả dụng');
        }
      } catch (audioError) {
        console.warn('⚠️ AlarmService: Không thể cấu hình audio mode:', audioError);
      }

      // Load alarm sound
      await this.loadAlarmSound();

      // Lắng nghe app state changes
      const subscription = AppState.addEventListener('change', this.handleAppStateChange);
      // Lưu subscription để cleanup sau này
      this.appStateSubscription = subscription;

      // Bắt đầu kiểm tra alarms
      this.startAlarmChecker();

      // Load existing alarms from storage
      await this.loadAlarmsFromStorage();

      // Clear expired alarms ngay sau khi load
      await this.clearExpiredAlarms();

      this.isInitialized = true;
      console.log('✅ AlarmService: Đã khởi tạo thành công');
    } catch (error) {
      console.error('❌ AlarmService: Lỗi khởi tạo:', error);
      throw error;
    }
  }

  private async loadAlarmSound(): Promise<void> {
    try {
      // Sử dụng âm thanh hệ thống với expo-audio
      // Tạm thời disable để tránh lỗi network và tập trung vào vibration
      // const sound = await Audio.Sound.createAsync(
      //   { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
      //   { shouldPlay: false, isLooping: false }
      // );
      // this.sound = sound;

      // Tạm thời disable âm thanh, chỉ dùng vibration
      this.sound = null;
      console.log('🔇 AlarmService: Âm thanh tạm thời disabled, chỉ sử dụng vibration');
    } catch (error) {
      console.warn('⚠️ AlarmService: Không thể load âm thanh alarm, sử dụng vibration only');
      this.sound = null;
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    this.appState = nextAppState;

    if (nextAppState === 'active') {
      // App trở lại foreground, chỉ kiểm tra alarms nếu đã qua một khoảng thời gian
      // Tránh trigger ngay lập tức khi app mới khởi động
      setTimeout(() => {
        this.checkAlarms();
      }, 5000); // Tăng lên 5 giây để app ổn định hoàn toàn
    }
  };

  private startAlarmChecker(): void {
    // ✅ CRITICAL FIX: Delay initial check để tránh trigger alarms ngay khi app start
    console.log('⏰ AlarmService: Starting alarm checker with initial delay...');

    // Delay 10 giây trước khi bắt đầu check alarms để app ổn định
    setTimeout(() => {
      console.log('⏰ AlarmService: Starting regular alarm checks...');
      this.checkAlarms(); // Check lần đầu sau delay

      // Sau đó kiểm tra mỗi 30 giây
      this.checkInterval = setInterval(() => {
        this.checkAlarms();
      }, 30000);
    }, 10000); // 10 giây delay
  }

  private async checkAlarms(): Promise<void> {
    const now = new Date();
    const triggeredAlarms: ScheduledAlarm[] = [];

    // ✅ CRITICAL FIX: Tránh trigger alarms cũ khi app mới khởi động
    const appStartTime = Date.now() - 60000; // 1 phút trước

    // Tìm các alarm cần kích hoạt
    for (const [id, alarm] of this.alarms) {
      if (alarm.isActive && alarm.scheduledTime <= now) {
        // ✅ Kiểm tra xem alarm có phải từ trước khi app start không
        const scheduleTime = this.alarmScheduleTimes.get(id);
        if (scheduleTime && scheduleTime < appStartTime) {
          console.log(`⏭️ AlarmService: Skipping old alarm ${id} - scheduled before app start`);
          // Xóa alarm cũ thay vì trigger
          this.alarms.delete(id);
          this.alarmScheduleTimes.delete(id);
          continue;
        }

        triggeredAlarms.push(alarm);
        // Xóa alarm đã kích hoạt
        this.alarms.delete(id);
        // ✅ Xóa tracking time
        this.alarmScheduleTimes.delete(id);
      }
    }

    // Kích hoạt các alarms
    for (const alarm of triggeredAlarms) {
      await this.triggerAlarm(alarm);
    }

    // Lưu lại danh sách alarms
    await this.saveAlarmsToStorage();
  }

  private async triggerAlarm(alarm: ScheduledAlarm): Promise<void> {
    try {
      console.log(`🔔 AlarmService: Kích hoạt alarm - ${alarm.title}`);

      // Phát âm thanh nếu được bật (với expo-audio)
      if (alarm.soundEnabled && this.sound) {
        try {
          await this.sound.replayAsync();
        } catch (soundError) {
          console.warn('⚠️ AlarmService: Lỗi phát âm thanh:', soundError);
        }
      }

      // Rung nếu được bật
      if (alarm.vibrationEnabled) {
        // Rung pattern: 500ms on, 200ms off, repeat 3 times
        Vibration.vibrate([500, 200, 500, 200, 500]);
      }

      // Hiển thị alert
      await this.showAlarmAlert(alarm);

      // ✅ JUST-IN-TIME: Tự động re-sync sau khi alarm tự động trigger (báo thức reo)
      // CHỈ re-sync khi alarm tự động trigger, KHÔNG re-sync khi user thực hiện action
      if (alarm.type === 'shift_reminder') {
        console.log('🔄 AlarmService: Alarm auto-triggered, re-syncing to schedule next reminder');
        await this.triggerReminderResync();
      }

    } catch (error) {
      console.error('❌ AlarmService: Lỗi kích hoạt alarm:', error);
    }
  }

  /**
   * ✅ Kích hoạt re-sync reminders sau khi alarm được trigger
   */
  private async triggerReminderResync(): Promise<void> {
    try {
      // Import ReminderSyncService để tránh circular dependency
      const { reminderSyncService } = await import('./reminderSync');
      await reminderSyncService.onReminderTriggeredOrCancelled();
    } catch (error) {
      console.error('❌ AlarmService: Error triggering reminder re-sync:', error);
    }
  }

  private async showAlarmAlert(alarm: ScheduledAlarm): Promise<void> {
    // ✅ CRITICAL FIX: KIỂM TRA NGHIÊM NGẶT - CHỈ hiển thị khi đến ĐÚNG thời gian đã lên lịch
    const now = new Date();
    const scheduledTime = alarm.scheduledTime;

    // Kiểm tra xem có phải đúng thời gian trigger không (cho phép sai lệch 1 phút)
    const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
    const allowedDifference = 60000; // 1 phút

    if (timeDiff > allowedDifference) {
      console.log(`⏭️ AlarmService: SKIPPED alarm ${alarm.id} - not the right time`);
      console.log(`   📅 Scheduled: ${scheduledTime.toLocaleString('vi-VN')}`);
      console.log(`   ⏰ Now: ${now.toLocaleString('vi-VN')}`);
      console.log(`   📊 Difference: ${Math.round(timeDiff / 1000)} seconds (allowed: ${allowedDifference / 1000}s)`);
      return;
    }

    // ✅ NGĂN CHẶN THÔNG BÁO "NỔ RA": Kiểm tra thời gian lên lịch
    const scheduleTime = this.alarmScheduleTimes.get(alarm.id);
    if (scheduleTime) {
      const timeSinceScheduled = now.getTime() - scheduleTime;

      // Nếu alarm được lên lịch trong vòng 2 phút và trigger ngay, bỏ qua
      if (timeSinceScheduled < 120000) { // Tăng lên 2 phút
        console.log(`⏭️ AlarmService: SKIPPED alarm ${alarm.id} - scheduled too recently (${Math.round(timeSinceScheduled/1000)}s ago)`);
        return;
      }
    }

    // ✅ BÁOTHỨC THỰC SỰ: Kiểm tra thời gian phù hợp trước khi hiển thị bất kỳ alarm nào
    if (alarm.type === 'shift_reminder' && alarm.relatedId) {
      const reminderType = this.extractReminderTypeFromAlarmId(alarm.id);
      if (reminderType) {
        const isAppropriateTime = await this.isAppropriateTimeForSpecificReminder(
          reminderType,
          alarm.relatedId
        );

        if (!isAppropriateTime) {
          console.log(`⏭️ AlarmService: SKIPPED alarm - inappropriate time for ${reminderType} reminder`);
          return;
        }
      }
    }

    console.log(`✅ AlarmService: SHOWING alarm ${alarm.id} at correct time`);
    console.log(`   📅 Scheduled: ${scheduledTime.toLocaleString('vi-VN')}`);
    console.log(`   ⏰ Now: ${now.toLocaleString('vi-VN')}`);

    // ✅ Kiểm tra xem có đang chạy trong Expo Go không
    const isExpoGo = this.isRunningInExpoGo();

    if (isExpoGo) {
      // ✅ Trong Expo Go, hiển thị fallback alert (đã kiểm tra thời gian ở trên)
      await this.showExpoGoFallbackAlert(alarm);
      return;
    }

    const buttons = [
      {
        text: t(this.currentLanguage, 'common.ok'),
        onPress: () => {
          this.stopAlarmSound();
        }
      }
    ];

    // Thêm nút snooze cho note reminders
    if (alarm.type === 'note_reminder') {
      buttons.unshift({
        text: '⏰ Báo lại 5 phút',
        onPress: () => {
          this.snoozeAlarm(alarm, 5);
        }
      });
    }

    Alert.alert(
      `🔔 ${alarm.title}`,
      alarm.message,
      buttons,
      {
        cancelable: false,
        onDismiss: () => this.stopAlarmSound()
      }
    );
  }

  /**
   * ✅ BÁOTHỨC THỰC SỰ: Hiển thị fallback alert cho Expo Go
   * (Thời gian đã được kiểm tra ở showAlarmAlert)
   */
  private async showExpoGoFallbackAlert(alarm: ScheduledAlarm): Promise<void> {
    // Thời gian phù hợp đã được kiểm tra ở showAlarmAlert, không cần kiểm tra lại

    const title = alarm.type === 'shift_reminder' ? 'Nhắc nhở ca làm việc' : 'Nhắc nhở ghi chú';
    const message = `${alarm.message}\n\n📱 Bạn đang sử dụng Expo Go. Để có đầy đủ tính năng âm thanh và rung, hãy sử dụng development build.`;

    Alert.alert(
      `📱 ${title}`,
      message,
      [
        {
          text: 'Đã hiểu',
          style: 'default',
          onPress: () => this.stopAlarmSound()
        }
      ],
      {
        cancelable: false,
        onDismiss: () => this.stopAlarmSound()
      }
    );

    console.log(`📱 AlarmService: Showed Expo Go fallback alert for: ${alarm.title}`);
  }

  /**
   * ✅ Kiểm tra xem có phải thời gian phù hợp để hiển thị thông báo cho ca làm việc không
   */
  private async isAppropriateTimeForNotification(shiftId: string): Promise<boolean> {
    try {
      const shifts = await storageService.getShiftList();
      const shift = shifts.find((s: Shift) => s.id === shiftId);

      if (!shift) {
        console.log(`⚠️ AlarmService: Không tìm thấy ca làm việc ${shiftId}`);
        return false;
      }

      // Import timeSyncService để sử dụng logic kiểm tra thời gian
      const { timeSyncService } = await import('./timeSync');
      return timeSyncService.isAppropriateTimeForShiftNotifications(shift);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi kiểm tra thời gian phù hợp:', error);
      return true; // Fallback: cho phép hiển thị nếu có lỗi
    }
  }

  /**
   * ✅ Kiểm tra xem có đang chạy trong Expo Go không
   */
  private isRunningInExpoGo(): boolean {
    try {
      const Constants = require('expo-constants');
      return Constants?.executionEnvironment === 'storeClient';
    } catch {
      return false;
    }
  }

  /**
   * ✅ BÁOTHỨC THỰC SỰ: Trích xuất loại reminder từ alarm ID
   */
  private extractReminderTypeFromAlarmId(alarmId: string): 'departure' | 'checkin' | 'checkout' | null {
    if (alarmId.startsWith('departure_')) {
      return 'departure';
    } else if (alarmId.startsWith('checkin_')) {
      return 'checkin';
    } else if (alarmId.startsWith('checkout_')) {
      return 'checkout';
    }
    return null;
  }

  /**
   * ✅ BÁOTHỨC THỰC SỰ: Kiểm tra thời gian phù hợp cho reminder cụ thể
   */
  private async isAppropriateTimeForSpecificReminder(
    reminderType: 'departure' | 'checkin' | 'checkout',
    shiftId: string
  ): Promise<boolean> {
    try {
      // Import ReminderSyncService để sử dụng logic kiểm tra thời gian
      const { reminderSyncService } = await import('./reminderSync');
      return await reminderSyncService.isAppropriateTimeForSpecificReminder(
        reminderType,
        shiftId
      );
    } catch (error) {
      console.error('❌ AlarmService: Error checking appropriate time:', error);
      return false; // Không hiển thị nếu có lỗi để tránh spam
    }
  }

  private async stopAlarmSound(): Promise<void> {
    try {
      if (this.sound) {
        try {
          await this.sound.stopAsync();
        } catch (soundError) {
          console.warn('⚠️ AlarmService: Lỗi dừng âm thanh:', soundError);
        }
      }
      Vibration.cancel();
    } catch (error) {
      console.error('❌ AlarmService: Lỗi dừng âm thanh:', error);
    }
  }

  private async snoozeAlarm(alarm: ScheduledAlarm, minutes: number): Promise<void> {
    try {
      await this.stopAlarmSound();
      
      // Tạo alarm mới với thời gian snooze
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
      
      const snoozeAlarm: ScheduledAlarm = {
        ...alarm,
        id: `${alarm.id}_snooze_${Date.now()}`,
        scheduledTime: snoozeTime,
        title: `⏰ ${alarm.title} (Báo lại)`,
      };

      this.alarms.set(snoozeAlarm.id, snoozeAlarm);
      await this.saveAlarmsToStorage();
      
      console.log(`⏰ AlarmService: Đã snooze alarm ${minutes} phút`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi snooze alarm:', error);
    }
  }

  // Public methods
  async scheduleShiftReminder(shift: Shift): Promise<void> {
    try {
      await this.initialize();

      // ✅ Debounce để tránh gọi liên tục
      const now = Date.now();
      if (now - this.lastScheduleTime < this.scheduleDebounceTime) {
        console.log('⏭️ AlarmService: Skipping schedule due to debounce');
        return;
      }
      this.lastScheduleTime = now;

      const settings = await storageService.getUserSettings();
      this.currentLanguage = settings.language || 'vi';

      if (!settings.alarmSoundEnabled && !settings.alarmVibrationEnabled) {
        console.log('🔕 AlarmService: Cả âm thanh và rung đều bị tắt, bỏ qua lập lịch');
        return;
      }

      // ✅ SỬ DỤNG LOGIC JUST-IN-TIME: Chỉ lên lịch cho alarm tiếp theo
      console.log('🔔 AlarmService: Using just-in-time scheduling logic');

      // Logic cũ (lên lịch 7 ngày) đã được thay thế bằng ReminderSyncService
      // AlarmService giờ chỉ chịu trách nhiệm lên lịch từng alarm cụ thể
      // khi được gọi từ ReminderSyncService

      console.log('✅ AlarmService: Shift alarms will be managed by ReminderSyncService');
      return;
    } catch (error) {
      console.error('❌ AlarmService: Lỗi lập lịch shift reminders:', error);
      throw error;
    }
  }

  /**
   * ✅ JUST-IN-TIME: Lên lịch một alarm cụ thể
   * Được gọi từ ReminderSyncService
   */
  async scheduleSpecificAlarm(
    type: 'departure' | 'checkin' | 'checkout',
    shift: Shift,
    triggerTime: Date,
    dateString: string
  ): Promise<void> {
    try {
      await this.initialize();

      const settings = await storageService.getUserSettings();
      this.currentLanguage = settings.language || 'vi';

      if (!settings.alarmSoundEnabled && !settings.alarmVibrationEnabled) {
        console.log(`🔕 AlarmService: Cả âm thanh và rung đều bị tắt, bỏ qua lập lịch ${type} alarm`);
        return;
      }

      // ✅ CRITICAL FIX: Kiểm tra thời gian trigger - PHẢI LÀ TƯƠNG LAI
      const now = new Date();
      if (triggerTime <= now) {
        console.log(`⏭️ AlarmService: SKIPPED ${type} alarm - trigger time ${triggerTime.toLocaleString('vi-VN')} is in the past (now: ${now.toLocaleString('vi-VN')})`);
        return;
      }

      // ✅ Kiểm tra thời gian hợp lý - không quá xa trong tương lai
      const timeDiff = triggerTime.getTime() - now.getTime();
      const maxFutureTime = 7 * 24 * 60 * 60 * 1000; // 7 ngày
      if (timeDiff > maxFutureTime) {
        console.log(`⏭️ AlarmService: SKIPPED ${type} alarm - trigger time too far in future (${Math.round(timeDiff / 1000 / 60 / 60 / 24)} days)`);
        return;
      }

      const alarmId = `${type}_${dateString}`;
      let title: string;
      let message: string;

      switch (type) {
        case 'departure':
          title = t(this.currentLanguage, 'alarms.departureTitle');
          message = t(this.currentLanguage, 'alarms.departureMessage')
            .replace('{time}', shift.departureTime)
            .replace('{shift}', shift.name);
          break;
        case 'checkin':
          title = t(this.currentLanguage, 'alarms.checkinTitle');
          message = t(this.currentLanguage, 'alarms.checkinMessage')
            .replace('{shift}', shift.name);
          break;
        case 'checkout':
          title = t(this.currentLanguage, 'alarms.checkoutTitle');
          message = t(this.currentLanguage, 'alarms.checkoutMessage')
            .replace('{shift}', shift.name);
          break;
      }

      const alarm: ScheduledAlarm = {
        id: alarmId,
        title,
        message,
        scheduledTime: triggerTime,
        type: 'shift_reminder',
        relatedId: shift.id,
        isActive: true,
        soundEnabled: settings.alarmSoundEnabled,
        vibrationEnabled: settings.alarmVibrationEnabled,
      };

      this.alarms.set(alarmId, alarm);

      // ✅ Track thời gian lên lịch để tránh trigger ngay lập tức
      this.alarmScheduleTimes.set(alarmId, Date.now());

      await this.saveAlarmsToStorage();

      console.log(`🔔 AlarmService: Scheduled ${type} alarm for ${dateString} at ${triggerTime.toLocaleTimeString()}`);
    } catch (error) {
      console.error(`❌ AlarmService: Error scheduling ${type} alarm:`, error);
      throw error;
    }
  }

  /**
   * ✅ JUST-IN-TIME: Hủy alarm cụ thể theo type và date
   */
  async cancelSpecificAlarmByDate(type: 'departure' | 'checkin' | 'checkout', dateString: string): Promise<void> {
    try {
      const alarmId = `${type}_${dateString}`;
      this.alarms.delete(alarmId);

      // ✅ Xóa tracking time
      this.alarmScheduleTimes.delete(alarmId);

      await this.saveAlarmsToStorage();
      console.log(`🗑️ AlarmService: Cancelled ${type} alarm for ${dateString}`);
    } catch (error) {
      console.error(`❌ AlarmService: Error cancelling ${type} alarm:`, error);
    }
  }



  async scheduleNoteReminder(note: Note): Promise<void> {
    try {
      await this.initialize();

      // ✅ Kiểm tra tùy chọn thông báo của ghi chú
      if (note.enableNotifications === false) {
        console.log(`🔔 AlarmService: Ghi chú "${note.title}" đã tắt thông báo, bỏ qua lập lịch alarm`);
        return;
      }

      const settings = await storageService.getUserSettings();
      this.currentLanguage = settings.language || 'vi';

      // Xóa reminder cũ nếu có
      await this.cancelNoteReminder(note.id);

      // Handle specific datetime reminders
      if (note.reminderDateTime) {
        const reminderTime = new Date(note.reminderDateTime);
        const now = new Date();

        if (reminderTime <= now) return;

        const alarmId = `note_${note.id}`;
        const alarm: ScheduledAlarm = {
          id: alarmId,
          title: `📝 ${note.title}`,
          message: note.content.length > 100
            ? note.content.substring(0, 100) + '...'
            : note.content,
          scheduledTime: reminderTime,
          type: 'note_reminder',
          relatedId: note.id,
          isActive: true,
          soundEnabled: settings.alarmSoundEnabled,
          vibrationEnabled: settings.alarmVibrationEnabled,
        };

        this.alarms.set(alarmId, alarm);
        await this.saveAlarmsToStorage();

        console.log(`✅ AlarmService: Đã lập lịch alarm cho note ${note.title}`);
        return;
      }

      // Handle shift-based reminders
      if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
        await this.scheduleShiftBasedNoteReminders(note);
      }
    } catch (error) {
      console.error('❌ AlarmService: Lỗi lập lịch note reminder:', error);
      throw error;
    }
  }

  /**
   * Lập lịch alarm cho note dựa trên shift (5 phút trước departure time)
   */
  private async scheduleShiftBasedNoteReminders(note: Note): Promise<void> {
    if (!note.associatedShiftIds || note.associatedShiftIds.length === 0) return;

    const { timeSyncService } = await import('./timeSync');
    const shifts = await storageService.getShiftList();
    const settings = await storageService.getUserSettings();

    for (const shiftId of note.associatedShiftIds) {
      const shift = shifts.find((s: Shift) => s.id === shiftId);
      if (!shift) continue;

      // Tính toán thời gian nhắc nhở cho 7 ngày tới
      const reminderTimes = timeSyncService.calculateShiftBasedReminderTimes(shift);

      // Lập lịch cho từng thời gian
      for (let i = 0; i < reminderTimes.length; i++) {
        const reminderTime = reminderTimes[i];
        const alarmId = `note_shift_${note.id}_${shiftId}_${i}`;

        const alarm: ScheduledAlarm = {
          id: alarmId,
          title: `📝 ${note.title}`,
          message: `${note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content} (Ca: ${shift.name})`,
          scheduledTime: reminderTime,
          type: 'note_reminder',
          relatedId: note.id,
          isActive: true,
          soundEnabled: settings.alarmSoundEnabled,
          vibrationEnabled: settings.alarmVibrationEnabled,
        };

        this.alarms.set(alarmId, alarm);
      }
    }

    await this.saveAlarmsToStorage();
    console.log(`✅ AlarmService: Đã lập lịch shift-based alarms cho note ${note.title}`);
  }

  async cancelShiftReminders(shiftId?: string): Promise<void> {
    try {
      const toDelete: string[] = [];
      
      for (const [id, alarm] of this.alarms) {
        if (alarm.type === 'shift_reminder') {
          if (!shiftId || alarm.relatedId === shiftId) {
            toDelete.push(id);
          }
        }
      }

      toDelete.forEach(id => this.alarms.delete(id));
      await this.saveAlarmsToStorage();
      
      console.log(`🗑️ AlarmService: Đã xóa ${toDelete.length} shift alarms`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi xóa shift reminders:', error);
    }
  }

  async cancelNoteReminder(noteId: string): Promise<void> {
    try {
      // Cancel specific datetime reminder
      const alarmId = `note_${noteId}`;
      this.alarms.delete(alarmId);

      // Cancel all shift-based reminders for this note
      const toDelete: string[] = [];
      for (const [id, alarm] of this.alarms) {
        if (id.startsWith(`note_shift_${noteId}_`)) {
          toDelete.push(id);
        }
      }

      for (const id of toDelete) {
        this.alarms.delete(id);
      }

      await this.saveAlarmsToStorage();

      console.log(`🗑️ AlarmService: Đã xóa note alarm ${noteId} và ${toDelete.length} shift-based alarms`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi xóa note reminder:', error);
    }
  }

  // Utility methods
  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  private async saveAlarmsToStorage(): Promise<void> {
    try {
      const alarmsArray = Array.from(this.alarms.values());
      // Sử dụng saveData method đã được thêm vào StorageService
      await storageService.saveData('scheduled_alarms', alarmsArray);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi lưu alarms:', error);
    }
  }

  private async loadAlarmsFromStorage(): Promise<void> {
    try {
      // Sử dụng getData method đã được thêm vào StorageService
      const alarmsArray = await storageService.getData('scheduled_alarms', []);
      this.alarms.clear();

      const now = new Date();
      let validAlarmsCount = 0;
      let expiredAlarmsCount = 0;

      for (const alarmData of alarmsArray) {
        const alarm: ScheduledAlarm = {
          ...(alarmData as any),
          scheduledTime: new Date((alarmData as any).scheduledTime),
        };

        // Kiểm tra alarm có hợp lệ không (thời gian trong tương lai và không quá xa)
        const timeDiff = alarm.scheduledTime.getTime() - now.getTime();
        const maxFutureTime = 7 * 24 * 60 * 60 * 1000; // 7 ngày

        if (timeDiff > 0 && timeDiff <= maxFutureTime) {
          // Alarm hợp lệ - trong tương lai và không quá 7 ngày
          this.alarms.set(alarm.id, alarm);
          validAlarmsCount++;
        } else {
          // Alarm đã hết hạn hoặc quá xa - bỏ qua
          expiredAlarmsCount++;
        }
      }

      // Lưu lại danh sách đã được làm sạch
      if (expiredAlarmsCount > 0) {
        await this.saveAlarmsToStorage();
      }

      console.log(`📥 AlarmService: Đã load ${validAlarmsCount} alarms hợp lệ, bỏ qua ${expiredAlarmsCount} alarms hết hạn`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi load alarms:', error);
    }
  }

  async getAlarmStatus(): Promise<AlarmStatus> {
    await this.initialize();

    return {
      isSupported: true,
      hasAudioPermission: this.sound !== null,
      isBackgroundEnabled: this.checkInterval !== null,
      scheduledCount: this.alarms.size,
      message: `Hệ thống báo thức đang hoạt động với ${this.alarms.size} lịch nhắc nhở`,
    };
  }

  /**
   * ✅ FORCE CLEANUP: Xóa tất cả alarm và tạo lại từ đầu
   * Sử dụng khi có vấn đề với alarm cũ
   */
  async forceCleanupAndReset(): Promise<void> {
    try {
      console.log('🧹 AlarmService: Force cleanup - Xóa tất cả alarm cũ...');

      // Dừng tất cả âm thanh và rung
      await this.stopAlarmSound();

      // Xóa tất cả alarm trong memory
      this.alarms.clear();

      // Xóa tất cả alarm trong storage
      await storageService.saveData('scheduled_alarms', []);

      console.log('✅ AlarmService: Force cleanup hoàn tất - Tất cả alarm đã được xóa');

      // Trigger re-sync để tạo alarm mới
      const { reminderSyncService } = await import('./reminderSync');
      await reminderSyncService.syncNextReminders();

      console.log('🔄 AlarmService: Đã tạo lại alarm mới sau force cleanup');
    } catch (error) {
      console.error('❌ AlarmService: Lỗi force cleanup:', error);
      throw error;
    }
  }

  /**
   * ✅ DEBUG: Hiển thị tất cả alarm hiện tại
   */
  async debugListAllAlarms(): Promise<void> {
    await this.initialize();

    console.log('🔍 AlarmService: Danh sách tất cả alarm hiện tại:');
    console.log('='.repeat(60));

    if (this.alarms.size === 0) {
      console.log('📭 Không có alarm nào được lập lịch');
      return;
    }

    const now = new Date();
    let validCount = 0;
    let expiredCount = 0;

    for (const [id, alarm] of this.alarms) {
      const isExpired = alarm.scheduledTime <= now;
      const timeStatus = isExpired ? '❌ ĐÃ HẾT HẠN' : '✅ HỢP LỆ';

      console.log(`📋 ID: ${id}`);
      console.log(`   📝 Title: ${alarm.title}`);
      console.log(`   ⏰ Scheduled: ${alarm.scheduledTime.toLocaleString('vi-VN')}`);
      console.log(`   🔔 Type: ${alarm.type}`);
      console.log(`   📊 Status: ${timeStatus}`);
      console.log('   ' + '-'.repeat(50));

      if (isExpired) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    console.log(`📊 Tổng kết: ${validCount} alarm hợp lệ, ${expiredCount} alarm hết hạn`);

    if (expiredCount > 0) {
      console.log('⚠️ Có alarm hết hạn - nên chạy force cleanup');
    }
  }

  async testAlarm(): Promise<void> {
    try {
      await this.initialize();

      // Tạo test alarm với thời gian 5 giây sau để tránh trigger ngay lập tức
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 5);

      const testAlarm: ScheduledAlarm = {
        id: 'test_alarm',
        title: '🧪 Test Alarm',
        message: 'Hệ thống báo thức đang hoạt động bình thường!',
        scheduledTime: testTime,
        type: 'note_reminder',
        isActive: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };

      // Thêm vào danh sách alarms để được schedule đúng cách
      this.alarms.set(testAlarm.id, testAlarm);
      await this.saveAlarmsToStorage();

      console.log('🧪 AlarmService: Test alarm đã được lên lịch sau 5 giây');
    } catch (error) {
      console.error('❌ AlarmService: Lỗi test alarm:', error);
      throw error;
    }
  }

  // Method để clear tất cả alarms cũ/không hợp lệ
  async clearExpiredAlarms(): Promise<void> {
    try {
      const now = new Date();
      let clearedCount = 0;

      // ✅ CRITICAL FIX: Xóa tất cả alarms đã hết hạn và tracking times
      for (const [id, alarm] of this.alarms) {
        if (alarm.scheduledTime <= now) {
          this.alarms.delete(id);
          // ✅ Xóa tracking time tương ứng
          this.alarmScheduleTimes.delete(id);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        await this.saveAlarmsToStorage();
        console.log(`🧹 AlarmService: Đã xóa ${clearedCount} alarms hết hạn khi khởi động`);
      } else {
        console.log('✅ AlarmService: Không có alarms hết hạn cần xóa');
      }
    } catch (error) {
      console.error('❌ AlarmService: Lỗi clear expired alarms:', error);
    }
  }

  // Method để reset hoàn toàn tất cả alarms (dùng khi debug)
  async clearAllAlarms(): Promise<void> {
    try {
      this.alarms.clear();
      await storageService.removeData('scheduled_alarms');
      console.log('🗑️ AlarmService: Đã xóa tất cả alarms');
    } catch (error) {
      console.error('❌ AlarmService: Lỗi clear all alarms:', error);
    }
  }

  /**
   * ✅ HỦY ALARMS THEO PATTERN ID
   * Hủy bỏ các alarms có ID bắt đầu với pattern cụ thể
   */
  async cancelAlarmsByPattern(pattern: string): Promise<void> {
    try {
      console.log(`🧹 AlarmService: Cancelling alarms with pattern: ${pattern}`);

      const toDelete: string[] = [];

      for (const [id, alarm] of this.alarms) {
        if (id.startsWith(pattern)) {
          toDelete.push(id);
        }
      }

      toDelete.forEach(id => this.alarms.delete(id));
      await this.saveAlarmsToStorage();

      console.log(`✅ AlarmService: Cancelled ${toDelete.length} alarms with pattern: ${pattern}`);
    } catch (error) {
      console.error(`❌ AlarmService: Error cancelling alarms with pattern ${pattern}:`, error);
    }
  }

  /**
   * ✅ LÊN LỊCH ALARM VỚI ID CÓ QUY TẮC
   * Lên lịch alarm với ID được chỉ định trước
   */
  async scheduleAlarmWithId(
    identifier: string,
    type: 'departure' | 'checkin' | 'checkout',
    shift: Shift,
    triggerTime: Date,
    dateString: string
  ): Promise<void> {
    try {
      await this.initialize();

      const settings = await storageService.getUserSettings();
      this.currentLanguage = settings.language || 'vi';

      if (!settings.alarmSoundEnabled && !settings.alarmVibrationEnabled) {
        console.log(`🔕 AlarmService: Cả âm thanh và rung đều bị tắt, bỏ qua lập lịch ${type} alarm ${identifier}`);
        return;
      }

      // ✅ CRITICAL FIX: Kiểm tra thời gian trigger - PHẢI LÀ TƯƠNG LAI
      const now = new Date();
      if (triggerTime <= now) {
        console.log(`⏭️ AlarmService: SKIPPED ${type} alarm ${identifier} - trigger time ${triggerTime.toLocaleString('vi-VN')} is in the past (now: ${now.toLocaleString('vi-VN')})`);
        return;
      }

      // Kiểm tra thời gian hợp lý (không quá xa trong tương lai)
      const timeDiff = triggerTime.getTime() - now.getTime();
      const maxFutureTime = 7 * 24 * 60 * 60 * 1000; // 7 ngày

      if (timeDiff > maxFutureTime) {
        console.log(`⏭️ AlarmService: SKIPPED ${type} alarm ${identifier} - too far in future (${Math.round(timeDiff / 1000 / 60 / 60 / 24)} days)`);
        return;
      }

      let title: string;
      let message: string;

      switch (type) {
        case 'departure':
          title = '🚶‍♂️ Chuẩn bị đi làm';
          message = `Đã đến giờ khởi hành (${shift.departureTime}) cho ca ${shift.name}`;
          break;
        case 'checkin':
          title = '📥 Giờ chấm công vào';
          message = `Đã đến giờ chấm công vào cho ca ${shift.name}`;
          break;
        case 'checkout':
          title = '📤 Giờ chấm công ra';
          message = `Đã đến giờ chấm công ra cho ca ${shift.name}`;
          break;
      }

      const alarm: ScheduledAlarm = {
        id: identifier,
        title,
        message,
        scheduledTime: triggerTime,
        type: 'shift_reminder',
        relatedId: shift.id,
        isActive: true,
        soundEnabled: settings.alarmSoundEnabled,
        vibrationEnabled: settings.alarmVibrationEnabled,
      };

      // ✅ Track thời gian lên lịch để tránh trigger ngay lập tức
      this.alarmScheduleTimes.set(identifier, Date.now());

      this.alarms.set(identifier, alarm);
      await this.saveAlarmsToStorage();

      console.log(`🔔 AlarmService: Scheduled ${type} alarm ${identifier} for ${triggerTime.toLocaleString('vi-VN')}`);
    } catch (error) {
      console.error(`❌ AlarmService: Error scheduling ${type} alarm ${identifier}:`, error);
      throw error;
    }
  }

  /**
   * ✅ HỦY ALARM THEO ID CỤ THỂ
   * Hủy bỏ alarm với ID cụ thể
   */
  async cancelAlarmById(identifier: string): Promise<void> {
    try {
      if (this.alarms.has(identifier)) {
        this.alarms.delete(identifier);
        this.alarmScheduleTimes.delete(identifier);
        await this.saveAlarmsToStorage();
        console.log(`🔕 AlarmService: Cancelled alarm: ${identifier}`);
      }
    } catch (error) {
      console.error(`❌ AlarmService: Error cancelling alarm ${identifier}:`, error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.sound) {
      try {
        this.sound.unloadAsync();
      } catch (error) {
        console.warn('⚠️ AlarmService: Lỗi unload sound:', error);
      }
      this.sound = null;
    }

    // Cleanup AppState subscription
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.isInitialized = false;

    console.log('🧹 AlarmService: Đã cleanup');
  }
}

export const alarmService = new AlarmService();
