import { Platform, Alert } from 'react-native';
import { AlarmData, Shift, Note } from '../types';
import { NOTIFICATION_CATEGORIES } from '../constants';
import { storageService } from './storage';

// Import notifications với error handling cho Expo SDK 53+
let Notifications: any = null;
let Constants: any = null;

// Safe import để tránh crash trong Expo Go
try {
  Notifications = require('expo-notifications');
  Constants = require('expo-constants');
} catch (error) {
  console.warn('⚠️ Workly: expo-notifications không khả dụng trong môi trường này');
}

// Check if running in Expo Go
const isRunningInExpoGo = () => {
  try {
    return Constants?.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
};

// Check if notifications are available (considering SDK 53+ limitations)
const isNotificationsFullySupported = () => {
  // Trong Expo Go SDK 53+, push notifications không được hỗ trợ
  if (isRunningInExpoGo()) {
    console.log('📱 Workly: Đang chạy trong Expo Go - Push notifications bị hạn chế');
    return false;
  }
  return Notifications !== null;
};

// Check if notifications are available
const isNotificationsAvailable = () => {
  return Notifications !== null && typeof Notifications.setNotificationHandler === 'function';
};

// Configure notification behavior với safe check
if (isNotificationsAvailable()) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('⚠️ Workly: Không thể cấu hình notification handler:', error);
  }
}

interface NotificationStatus {
  isSupported: boolean;
  isExpoGo: boolean;
  hasPermission: boolean;
  platform: string;
  message: string;
  canSchedule: boolean;
}

class NotificationService {
  private isInitialized = false;
  private isAvailable = false;
  private status: NotificationStatus | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Kiểm tra xem notifications có đầy đủ hỗ trợ không (bao gồm cả Expo Go limitations)
      if (!isNotificationsFullySupported()) {
        this.isAvailable = false;
        this.status = {
          isSupported: false,
          isExpoGo: isRunningInExpoGo(),
          hasPermission: false,
          platform: Platform.OS,
          message: isRunningInExpoGo()
            ? 'Push notifications không khả dụng trong Expo Go (SDK 53+). Sử dụng development build để có đầy đủ tính năng.'
            : 'expo-notifications không khả dụng trong môi trường này.',
          canSchedule: false
        };
        console.warn('⚠️ Workly: Notifications không đầy đủ hỗ trợ - sử dụng AlarmService thay thế');
        this.isInitialized = true;
        return;
      }

      const isExpoGo = isRunningInExpoGo();

      // Kiểm tra môi trường Expo Go
      if (isExpoGo && Platform.OS === 'android') {
        this.isAvailable = false;
        this.status = {
          isSupported: false,
          isExpoGo: true,
          hasPermission: false,
          platform: Platform.OS,
          message: 'Push notifications không được hỗ trợ trong Expo Go trên Android. Sử dụng development build để có đầy đủ tính năng.',
          canSchedule: false
        };
        console.warn('⚠️ Workly: Push notifications không hoạt động trong Expo Go trên Android');
        this.isInitialized = true;
        return;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const hasPermission = finalStatus === 'granted';

      if (!hasPermission) {
        console.warn('⚠️ Workly: Notification permission not granted. Nhắc nhở sẽ không hoạt động.');
      }

      // Configure notification categories for Android
      if (Platform.OS === 'android' && hasPermission) {
        await this.setupNotificationChannels();
      }

      this.isAvailable = hasPermission;
      this.status = {
        isSupported: hasPermission,
        isExpoGo,
        hasPermission,
        platform: Platform.OS,
        message: hasPermission
          ? 'Notifications hoạt động bình thường'
          : 'Cần cấp quyền notification để sử dụng tính năng nhắc nhở',
        canSchedule: hasPermission
      };

      this.isInitialized = true;

      if (hasPermission) {
        console.log('✅ Workly: Notifications đã được khởi tạo thành công');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.isAvailable = false;
      this.status = {
        isSupported: false,
        isExpoGo: isRunningInExpoGo(),
        hasPermission: false,
        platform: Platform.OS,
        message: `Lỗi khởi tạo notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canSchedule: false
      };
      this.isInitialized = true;
    }
  }

  private async setupNotificationChannels(): Promise<void> {
    if (!isNotificationsAvailable()) return;

    try {
      await Notifications.setNotificationChannelAsync('shift_reminders', {
        name: 'Nhắc nhở ca làm việc',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('note_reminders', {
        name: 'Nhắc nhở ghi chú',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('weather_warnings', {
        name: 'Cảnh báo thời tiết',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('shift_rotation', {
        name: 'Xoay ca làm việc',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  }

  // Getter cho notification status
  getNotificationStatus(): NotificationStatus | null {
    return this.status;
  }

  // Kiểm tra xem có thể lập lịch notifications không
  canScheduleNotifications(): boolean {
    return this.isAvailable && this.status?.canSchedule === true;
  }

  // Lấy thông tin chi tiết về trạng thái notifications
  async getDetailedStatus(): Promise<{
    status: NotificationStatus;
    scheduledCount: number;
    environment: string;
    recommendations: string[];
  }> {
    await this.initialize();

    let scheduledCount = 0;
    try {
      if (this.canScheduleNotifications()) {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        scheduledCount = scheduled.length;
      }
    } catch (error) {
      console.warn('Could not get scheduled notifications count:', error);
    }

    const environment = this.status?.isExpoGo ? 'Expo Go' : 'Development/Production Build';

    const recommendations: string[] = [];
    if (this.status?.isExpoGo) {
      recommendations.push('Sử dụng development build để có đầy đủ tính năng notifications');
      recommendations.push('Chạy lệnh: eas build --profile development --platform android');
    } else if (!this.status?.hasPermission) {
      recommendations.push('Cấp quyền notifications trong Settings của thiết bị');
      recommendations.push('Khởi động lại app sau khi cấp quyền');
    }

    return {
      status: this.status || {
        isSupported: false,
        isExpoGo: false,
        hasPermission: false,
        platform: Platform.OS,
        message: 'Chưa khởi tạo',
        canSchedule: false
      },
      scheduledCount,
      environment,
      recommendations
    };
  }

  // Test notification để kiểm tra hoạt động
  async testNotification(): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        this.showFallbackAlert(
          'Test Notification',
          'Không thể gửi test notification trong môi trường hiện tại.'
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: `test_${Date.now()}`,
        content: {
          title: '🧪 Test Notification',
          body: 'Notifications đang hoạt động bình thường!',
          data: { type: 'test' },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Test notification failed:', error);
      throw error;
    }
  }

  // Hiển thị thông báo fallback khi notifications không khả dụng
  private showFallbackAlert(title: string, message: string): void {
    Alert.alert(
      `📱 ${title}`,
      `${message}\n\n💡 Để sử dụng đầy đủ tính năng nhắc nhở, hãy tạo development build hoặc build production.`,
      [{ text: 'Đã hiểu', style: 'default' }]
    );
  }

  async scheduleShiftReminders(shift: Shift): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        console.log('📱 Workly: Notifications không khả dụng, bỏ qua lập lịch nhắc nhở ca làm việc');
        // Hiển thị thông báo fallback cho người dùng
        if (this.status?.isExpoGo) {
          this.showFallbackAlert(
            'Nhắc nhở ca làm việc',
            'Tính năng nhắc nhở ca làm việc sẽ được kích hoạt khi bạn sử dụng development build.'
          );
        }
        return;
      }

      // ✅ BƯỚC 1: Hủy tất cả thông báo cũ trước khi lên lịch mới
      await this.cancelAllShiftReminders();

      const settings = await storageService.getUserSettings();
      if (!settings.alarmSoundEnabled && !settings.alarmVibrationEnabled) {
        console.log('🔕 NotificationService: Cả âm thanh và rung đều bị tắt, bỏ qua lập lịch');
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      console.log(`📅 NotificationService: Lên lịch thông báo cho ca ${shift.name} - 7 ngày tới`);

      // ✅ BƯỚC 2: Lên lịch thông báo thông minh cho 7 ngày tới
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dayOfWeek = targetDate.getDay();
        const dateString = this.formatDateString(targetDate);

        // Kiểm tra ca có áp dụng cho ngày này không
        if (!shift.workDays.includes(dayOfWeek)) {
          continue;
        }

        // ✅ Lấy attendance logs cho ngày cụ thể này
        const dayLogs = await storageService.getAttendanceLogsForDate(dateString);
        const hasGoWork = dayLogs.some(log => log.type === 'go_work');
        const hasCheckIn = dayLogs.some(log => log.type === 'check_in');
        const hasCheckOut = dayLogs.some(log => log.type === 'check_out');

        // ✅ DEPARTURE REMINDER: Chỉ lên lịch nếu chưa có go_work
        if (!hasGoWork) {
          const departureTime = this.parseTime(shift.departureTime);
          const departureDateTime = new Date(targetDate);
          departureDateTime.setHours(departureTime.hours, departureTime.minutes - 30, 0, 0);

          // Xử lý ca đêm (departure time có thể ở ngày trước)
          if (shift.isNightShift && departureTime.hours >= 20) {
            departureDateTime.setDate(departureDateTime.getDate() - 1);
          }

          if (departureDateTime > now) {
            await Notifications.scheduleNotificationAsync({
              identifier: `departure_${shift.id}_${dateString}`,
              content: {
                title: '🚶‍♂️ Chuẩn bị đi làm',
                body: `Còn 30 phút nữa là giờ khởi hành (${shift.departureTime}) cho ca ${shift.name}`,
                categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_REMINDER,
                data: {
                  type: 'departure',
                  shiftId: shift.id,
                  shiftName: shift.name,
                  date: dateString,
                },
              },
              trigger: {
                date: departureDateTime,
              },
            });
            console.log(`📅 Lên lịch departure reminder: ${dateString} ${departureDateTime.toLocaleTimeString()}`);
          }
        }

        // ✅ CHECK-IN REMINDER: Chỉ lên lịch nếu chưa có check_in
        if (!hasCheckIn) {
          const startTime = this.parseTime(shift.startTime);
          const startDateTime = new Date(targetDate);
          startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);

          // Xử lý ca đêm
          if (shift.isNightShift && startTime.hours < 12) {
            startDateTime.setDate(startDateTime.getDate() + 1);
          }

          if (startDateTime > now) {
            await Notifications.scheduleNotificationAsync({
              identifier: `checkin_${shift.id}_${dateString}`,
              content: {
                title: '📥 Giờ chấm công vào',
                body: `Đã đến giờ chấm công vào cho ca ${shift.name}`,
                categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_REMINDER,
                data: {
                  type: 'checkin',
                  shiftId: shift.id,
                  shiftName: shift.name,
                  date: dateString,
                },
              },
              trigger: {
                date: startDateTime,
              },
            });
            console.log(`📅 Lên lịch check-in reminder: ${dateString} ${startDateTime.toLocaleTimeString()}`);
          }
        }

        // ✅ CHECK-OUT REMINDER: Chỉ lên lịch nếu chưa có check_out
        if (!hasCheckOut) {
          const endTime = this.parseTime(shift.officeEndTime);
          const endDateTime = new Date(targetDate);
          endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);

          // Xử lý ca đêm
          if (shift.isNightShift && endTime.hours < 12) {
            endDateTime.setDate(endDateTime.getDate() + 1);
          }

          if (endDateTime > now) {
            await Notifications.scheduleNotificationAsync({
              identifier: `checkout_${shift.id}_${dateString}`,
              content: {
                title: '📤 Giờ chấm công ra',
                body: `Đã đến giờ chấm công ra cho ca ${shift.name}`,
                categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_REMINDER,
                data: {
                  type: 'checkout',
                  shiftId: shift.id,
                  shiftName: shift.name,
                  date: dateString,
                },
              },
              trigger: {
                date: endDateTime,
              },
            });
            console.log(`📅 Lên lịch check-out reminder: ${dateString} ${endDateTime.toLocaleTimeString()}`);
          }
        }
      }

      console.log(`✅ NotificationService: Hoàn thành lên lịch thông báo cho ca ${shift.name}`);
    } catch (error) {
      console.error('❌ NotificationService: Lỗi lên lịch shift reminders:', error);
      throw error;
    }
  }

  async cancelShiftReminders(): Promise<void> {
    // ✅ Sử dụng hàm mới để hủy tất cả shift reminders
    await this.cancelAllShiftReminders();
  }

  // Hủy notification cụ thể theo loại và shift ID
  async cancelSpecificReminder(type: 'departure' | 'checkin' | 'checkout', shiftId: string): Promise<void> {
    try {
      if (!this.canScheduleNotifications()) return;

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const specificNotifications = scheduledNotifications.filter(
        notification => notification.identifier.startsWith(`${type}_${shiftId}_`)
      );

      for (const notification of specificNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`🔕 Đã hủy nhắc nhở ${type} cho ca ${shiftId}`);
      }
    } catch (error) {
      console.error(`Error canceling ${type} reminders:`, error);
    }
  }

  async scheduleNoteReminder(note: Note): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        console.log('📱 Workly: Notifications không khả dụng, bỏ qua lập lịch nhắc nhở ghi chú');
        // Hiển thị thông báo fallback cho người dùng
        if (this.status?.isExpoGo) {
          this.showFallbackAlert(
            'Nhắc nhở ghi chú',
            'Tính năng nhắc nhở ghi chú sẽ được kích hoạt khi bạn sử dụng development build.'
          );
        }
        return;
      }

      // Cancel existing reminders for this note
      await this.cancelNoteReminder(note.id);

      // Handle specific datetime reminders
      if (note.reminderDateTime) {
        const reminderTime = new Date(note.reminderDateTime);
        const now = new Date();

        if (reminderTime <= now) return;

        await Notifications.scheduleNotificationAsync({
          identifier: `note_${note.id}`,
          content: {
            title: `📝 ${note.title}`,
            body: note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content,
            categoryIdentifier: NOTIFICATION_CATEGORIES.NOTE_REMINDER,
            data: {
              type: 'note',
              noteId: note.id,
              noteTitle: note.title,
            },
          },
          trigger: {
            date: reminderTime,
          },
        });
        return;
      }

      // Handle shift-based reminders
      if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
        await this.scheduleShiftBasedNoteReminders(note);
      }
    } catch (error) {
      console.error('Error scheduling note reminder:', error);
      throw error;
    }
  }

  /**
   * Lập lịch nhắc nhở cho note dựa trên shift (5 phút trước departure time)
   */
  private async scheduleShiftBasedNoteReminders(note: Note): Promise<void> {
    if (!note.associatedShiftIds || note.associatedShiftIds.length === 0) return;

    const { timeSyncService } = await import('./timeSync');
    const shifts = await storageService.getShiftList();

    for (const shiftId of note.associatedShiftIds) {
      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) continue;

      // Tính toán thời gian nhắc nhở cho 7 ngày tới
      const reminderTimes = timeSyncService.calculateShiftBasedReminderTimes(shift);

      // Lập lịch cho từng thời gian
      for (let i = 0; i < reminderTimes.length; i++) {
        const reminderTime = reminderTimes[i];

        await Notifications.scheduleNotificationAsync({
          identifier: `note_shift_${note.id}_${shiftId}_${i}`,
          content: {
            title: `📝 ${note.title}`,
            body: `${note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content} (Ca: ${shift.name})`,
            categoryIdentifier: NOTIFICATION_CATEGORIES.NOTE_REMINDER,
            data: {
              type: 'note_shift',
              noteId: note.id,
              noteTitle: note.title,
              shiftId: shift.id,
              shiftName: shift.name,
            },
          },
          trigger: {
            date: reminderTime,
          },
        });
      }
    }
  }

  async cancelNoteReminder(noteId: string): Promise<void> {
    try {
      if (!this.canScheduleNotifications()) return;

      // Cancel specific datetime reminder
      await Notifications.cancelScheduledNotificationAsync(`note_${noteId}`);

      // Cancel all shift-based reminders for this note
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const noteShiftReminders = scheduledNotifications.filter(
        notification => notification.identifier.startsWith(`note_shift_${noteId}_`)
      );

      for (const notification of noteShiftReminders) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling note reminder:', error);
    }
  }

  async scheduleWeatherWarning(message: string, location: string): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        console.log('📱 Workly: Notifications không khả dụng, bỏ qua cảnh báo thời tiết');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: `weather_${Date.now()}`,
        content: {
          title: '🌤️ Cảnh báo thời tiết',
          body: message,
          categoryIdentifier: NOTIFICATION_CATEGORIES.WEATHER_WARNING,
          data: {
            type: 'weather',
            location,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling weather warning:', error);
    }
  }

  async scheduleShiftRotationNotification(oldShiftName: string, newShiftName: string): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        console.log('📱 Workly: Notifications không khả dụng, bỏ qua thông báo xoay ca');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: `rotation_${Date.now()}`,
        content: {
          title: '🔄 Ca làm việc đã được thay đổi',
          body: `Ca làm việc đã chuyển từ "${oldShiftName}" sang "${newShiftName}"`,
          categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_ROTATION,
          data: {
            type: 'rotation',
            oldShift: oldShiftName,
            newShift: newShiftName,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling shift rotation notification:', error);
    }
  }

  async scheduleWeeklyShiftReminder(reminderDate: Date): Promise<void> {
    try {
      await this.initialize();

      const now = new Date();
      const timeDiff = reminderDate.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      console.log(`📅 NotificationService: Scheduling weekly reminder for ${reminderDate.toISOString()}`);
      console.log(`📅 NotificationService: Current time: ${now.toISOString()}`);
      console.log(`📅 NotificationService: Time difference: ${daysDiff.toFixed(2)} days`);
      console.log(`📅 NotificationService: Can schedule notifications: ${this.canScheduleNotifications()}`);
      console.log(`📅 NotificationService: Is Expo Go: ${this.status?.isExpoGo}`);

      // Kiểm tra thời gian hợp lý - không lập lịch nếu quá gần hoặc quá xa
      if (daysDiff < 0.1 || daysDiff > 7) {
        console.log(`📅 NotificationService: Invalid reminder time (${daysDiff.toFixed(2)} days), skipping`);
        return;
      }

      if (!this.canScheduleNotifications()) {
        console.log('📱 Workly: Notifications không khả dụng, bỏ qua nhắc nhở hàng tuần');
        // Trong Expo Go, KHÔNG BAO GIỜ hiển thị fallback alert cho weekly reminder
        // vì nó chỉ nên hiển thị đúng thời điểm (Saturday 10 PM) thông qua scheduled notification
        // hoặc alarm service, không phải khi lập lịch
        if (this.status?.isExpoGo) {
          console.log('📱 NotificationService: Expo Go detected - weekly reminder fallback alert disabled to prevent inappropriate timing');
        }
        return;
      }

      // ✅ LUÔN LUÔN cancel existing weekly reminders trước để tránh trùng lặp
      await this.cancelWeeklyReminders();
      console.log('📅 NotificationService: Cancelled all existing weekly reminders');

      // ✅ Kiểm tra lại sau khi cancel để đảm bảo không còn reminder nào
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const remainingWeeklyReminders = scheduledNotifications.filter(
        notification => notification.identifier.startsWith('weekly_reminder_')
      );

      if (remainingWeeklyReminders.length > 0) {
        console.log(`⚠️ NotificationService: Still found ${remainingWeeklyReminders.length} weekly reminders after cancellation, force cancelling`);
        for (const notification of remainingWeeklyReminders) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      const identifier = `weekly_reminder_${Date.now()}`;
      console.log(`📅 NotificationService: Creating notification with identifier: ${identifier}`);

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '📅 Kết thúc tuần làm việc',
          body: 'Tuần làm việc đã kết thúc. Bạn có muốn xem lại và chuẩn bị ca làm việc cho tuần tới không?',
          categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_REMINDER,
          data: {
            type: 'weekly_reminder',
            action: 'check_shifts',
          },
        },
        trigger: {
          date: reminderDate,
        },
      });

      console.log(`✅ NotificationService: Weekly reminder scheduled successfully`);
    } catch (error) {
      console.error('❌ NotificationService: Error scheduling weekly shift reminder:', error);
    }
  }

  async cancelWeeklyReminders(): Promise<void> {
    try {
      if (!this.canScheduleNotifications()) return;

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const weeklyReminders = scheduledNotifications.filter(
        notification => notification.identifier.startsWith('weekly_reminder_')
      );

      for (const notification of weeklyReminders) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling weekly reminders:', error);
    }
  }

  async showAlarmNotification(alarmData: AlarmData): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        console.log('📱 Workly: Notifications không khả dụng, bỏ qua alarm notification');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: `alarm_${alarmData.id}`,
        content: {
          title: alarmData.title,
          body: alarmData.message,
          categoryIdentifier: alarmData.type === 'shift_reminder'
            ? NOTIFICATION_CATEGORIES.SHIFT_REMINDER
            : NOTIFICATION_CATEGORIES.NOTE_REMINDER,
          data: {
            type: 'alarm',
            alarmId: alarmData.id,
            relatedId: alarmData.relatedId,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing alarm notification:', error);
    }
  }

  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * ✅ Format date string để tạo ID duy nhất cho thông báo
   */
  private formatDateString(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * ✅ Hủy tất cả thông báo shift reminders (bao gồm cả những thông báo cũ)
   */
  async cancelAllShiftReminders(): Promise<void> {
    try {
      if (!this.canScheduleNotifications()) return;

      console.log('🧹 NotificationService: Bắt đầu hủy tất cả shift reminders...');

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const shiftNotifications = scheduledNotifications.filter(
        notification =>
          notification.identifier.startsWith('departure_') ||
          notification.identifier.startsWith('checkin_') ||
          notification.identifier.startsWith('checkout_')
      );

      console.log(`🧹 NotificationService: Tìm thấy ${shiftNotifications.length} shift notifications cần hủy`);

      for (const notification of shiftNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`🔕 Đã hủy: ${notification.identifier}`);
      }

      console.log('✅ NotificationService: Hoàn thành hủy tất cả shift reminders');
    } catch (error) {
      console.error('❌ NotificationService: Lỗi hủy shift reminders:', error);
    }
  }

  /**
   * ✅ Hủy thông báo cụ thể khi người dùng thực hiện hành động
   */
  async cancelReminderAfterAction(action: 'go_work' | 'check_in' | 'check_out', shiftId: string, date: string): Promise<void> {
    try {
      if (!this.canScheduleNotifications()) return;

      // Map action to notification identifier prefix
      let notificationType: string;
      switch (action) {
        case 'go_work':
          notificationType = 'departure'; // departure_[shiftId]_[date]
          break;
        case 'check_in':
          notificationType = 'checkin'; // checkin_[shiftId]_[date]
          break;
        case 'check_out':
          notificationType = 'checkout'; // checkout_[shiftId]_[date]
          break;
        default:
          return;
      }

      const identifier = `${notificationType}_${shiftId}_${date}`;

      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        console.log(`🔕 Đã hủy thông báo ${notificationType} sau khi thực hiện ${action}: ${identifier}`);
      } catch (cancelError) {
        // Không log error nếu notification không tồn tại (đã bị hủy hoặc chưa được lên lịch)
        console.log(`ℹ️ Thông báo ${identifier} không tồn tại hoặc đã bị hủy`);
      }
    } catch (error) {
      console.error(`❌ NotificationService: Lỗi hủy thông báo sau ${action}:`, error);
    }
  }

  async getAllScheduledNotifications(): Promise<any[]> {
    try {
      if (!this.canScheduleNotifications()) return [];
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }



  async cancelAllNotifications(): Promise<void> {
    try {
      if (!this.canScheduleNotifications()) return;
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Add notification response listener với safe check
  addNotificationResponseListener(listener: (response: any) => void): any {
    if (!isNotificationsAvailable()) {
      console.warn('⚠️ Workly: Không thể thêm notification response listener - notifications không khả dụng');
      return { remove: () => {} }; // Return dummy subscription
    }

    try {
      return Notifications.addNotificationResponseReceivedListener(listener);
    } catch (error) {
      console.error('Error adding notification response listener:', error);
      return { remove: () => {} };
    }
  }

  // Add notification received listener với safe check
  addNotificationReceivedListener(listener: (notification: any) => void): any {
    if (!isNotificationsAvailable()) {
      console.warn('⚠️ Workly: Không thể thêm notification received listener - notifications không khả dụng');
      return { remove: () => {} }; // Return dummy subscription
    }

    try {
      return Notifications.addNotificationReceivedListener(listener);
    } catch (error) {
      console.error('Error adding notification received listener:', error);
      return { remove: () => {} };
    }
  }

  // Check if notifications are fully supported - Cập nhật để sử dụng status đã có
  async checkNotificationSupport(): Promise<NotificationStatus> {
    await this.initialize();

    return this.status || {
      isSupported: false,
      isExpoGo: isRunningInExpoGo(),
      hasPermission: false,
      platform: Platform.OS,
      message: 'Chưa khởi tạo notification service',
      canSchedule: false
    };
  }


}

export const notificationService = new NotificationService();
