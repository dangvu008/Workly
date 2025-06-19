/**
 * 🔔 Notification Scheduler - Hệ thống thông báo cho Cảnh báo Thời tiết & Nhắc nhở Đổi ca
 *
 * ⚠️ LƯU Ý: Hệ thống nhắc nhở được chia làm 3 loại:
 * 1. 🚨 Báo thức (Alarm) - Độ ưu tiên cao nhất → AlarmService xử lý
 * 2. 🌤️ Cảnh báo Thời tiết - Thông báo ưu tiên cao → NotificationScheduler xử lý
 * 3. 📅 Nhắc nhở Đổi ca - Thông báo tiêu chuẩn → NotificationScheduler xử lý
 *
 * ✅ Tính năng của NotificationScheduler:
 * - Cảnh báo thời tiết 1 giờ trước departureTime
 * - Nhắc nhở đổi ca tuần tới (cuối tuần)
 * - Thông báo xoay ca (shift rotation)
 * - Test notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import {
  addDays,
  addMinutes,
  format,
  isFuture,
  set,
  startOfDay,
  isAfter,
  isBefore
} from 'date-fns';
import { Shift, AttendanceLog, Note, AlarmData } from '../types';
import { storageService } from './storage';
import { ShiftDebugLogger } from '../utils/shiftDebugLogger';
import { NOTIFICATION_CATEGORIES } from '../constants';

// Safe import để tránh crash trong Expo Go
let Constants: any = null;
try {
  Constants = require('expo-constants');
} catch (error) {
  console.warn('⚠️ expo-constants không khả dụng trong môi trường này');
}

// Check if running in Expo Go
const isRunningInExpoGo = () => {
  try {
    return Constants?.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
};

// Check if notifications are fully supported
const isNotificationsFullySupported = () => {
  if (isRunningInExpoGo()) {
    console.log('📱 Đang chạy trong Expo Go - Push notifications bị hạn chế');
    return false;
  }
  return true;
};

interface NotificationTiming {
  id: string;
  type: 'departure' | 'checkin' | 'checkout';
  shiftId: string;
  shiftName: string;
  scheduledTime: Date;
  title: string;
  body: string;
  isValid: boolean;
  reason?: string;
}

interface NotificationStatus {
  isSupported: boolean;
  isExpoGo: boolean;
  hasPermission: boolean;
  platform: string;
  message: string;
  canSchedule: boolean;
}

export class NotificationScheduler {
  private isInitialized = false;
  private canSchedule = false;
  private status: NotificationStatus | null = null;

  /**
   * ✅ Khởi tạo notification service với validation đầy đủ
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      ShiftDebugLogger.info('notification', '=== INITIALIZING NOTIFICATION SCHEDULER ===');

      // Kiểm tra platform support
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        this.status = {
          isSupported: false,
          isExpoGo: false,
          hasPermission: false,
          platform: Platform.OS,
          message: 'Platform không hỗ trợ notifications',
          canSchedule: false
        };
        this.canSchedule = false;
        this.isInitialized = true;
        ShiftDebugLogger.warning('notification', 'Platform không hỗ trợ notifications');
        return;
      }

      // Kiểm tra Expo Go limitations
      const isExpoGo = isRunningInExpoGo();
      if (!isNotificationsFullySupported()) {
        this.status = {
          isSupported: false,
          isExpoGo,
          hasPermission: false,
          platform: Platform.OS,
          message: isExpoGo
            ? 'Push notifications không khả dụng trong Expo Go (SDK 53+). Sử dụng development build để có đầy đủ tính năng.'
            : 'expo-notifications không khả dụng trong môi trường này.',
          canSchedule: false
        };
        this.canSchedule = false;
        this.isInitialized = true;
        ShiftDebugLogger.warning('notification', 'Notifications không đầy đủ hỗ trợ - sử dụng AlarmService thay thế');
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
      this.canSchedule = hasPermission;

      // Set status
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

      if (this.canSchedule) {
        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        // Setup notification categories for Android
        if (Platform.OS === 'android') {
          await this.setupNotificationChannels();
        }

        ShiftDebugLogger.success('notification', 'NotificationScheduler khởi tạo thành công');
      } else {
        ShiftDebugLogger.warning('notification', 'Không có quyền notification');
      }

      this.isInitialized = true;
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Lỗi khởi tạo NotificationScheduler', error);
      this.canSchedule = false;
      this.status = {
        isSupported: false,
        isExpoGo: isRunningInExpoGo(),
        hasPermission: false,
        platform: Platform.OS,
        message: `Lỗi khởi tạo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canSchedule: false
      };
      this.isInitialized = true;
    }
  }

  /**
   * ✅ Setup notification channels cho Android với đầy đủ categories
   */
  private async setupNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

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

      ShiftDebugLogger.success('notification', 'Setup notification channels thành công');
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Lỗi setup notification channels', error);
    }
  }

  /**
   * ✅ Build correct timestamp for shift times, handling overnight shifts properly
   */
  private buildTimestamp(baseDate: Date, timeString: string, isOvernightShift: boolean): Date {
    const [hour, minute] = timeString.split(':').map(Number);
    const dateToUse = isOvernightShift ? addDays(baseDate, 1) : baseDate;
    return set(dateToUse, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
  }

  /**
   * ✅ Calculate notification timings using date-fns with proper overnight shift handling
   */
  private calculateNotificationTimingsForWorkday(shift: Shift, workdayDate: Date): NotificationTiming[] {
    const timings: NotificationTiming[] = [];
    const workdayDateString = format(workdayDate, 'yyyy-MM-dd');

    // ✅ Get current time as reference point for comparison
    const now = new Date();

    ShiftDebugLogger.info('timing', `=== CALCULATING TIMINGS for ${shift.name} on ${workdayDateString} ===`);
    ShiftDebugLogger.info('timing', `Current time: ${now.toLocaleString()}`);
    ShiftDebugLogger.info('timing', `Shift times: ${shift.startTime} - ${shift.endTime}, departure: ${shift.departureTime}`);

    // ✅ Detect overnight shift: compare time values properly
    const parseTimeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = parseTimeToMinutes(shift.startTime);
    const endMinutes = parseTimeToMinutes(shift.endTime);
    const isOvernightShift = endMinutes < startMinutes; // End time is earlier in the day than start time

    ShiftDebugLogger.info('timing', `Time comparison: start=${startMinutes}min, end=${endMinutes}min, isOvernight=${isOvernightShift}`);

    // ✅ Build correct timestamps for all shift times
    const scheduledStartTime = this.buildTimestamp(workdayDate, shift.startTime, false); // Start is always on workday
    const scheduledEndTime = this.buildTimestamp(workdayDate, shift.endTime, isOvernightShift); // End may be next day
    const scheduledDepartureTime = this.buildTimestamp(workdayDate, shift.departureTime, false); // Departure is always on workday

    ShiftDebugLogger.info('timing', 'Built timestamps:', {
      start: scheduledStartTime.toLocaleString(),
      end: scheduledEndTime.toLocaleString(),
      departure: scheduledDepartureTime.toLocaleString()
    });

    // ✅ 1. DEPARTURE REMINDER - Compare with current time
    const departureReminderTime = scheduledDepartureTime;
    const departureIsFuture = isAfter(departureReminderTime, now);

    if (departureIsFuture) {
      timings.push({
        id: `departure-${workdayDateString}`,
        type: 'departure',
        shiftId: shift.id,
        shiftName: shift.name,
        scheduledTime: departureReminderTime,
        title: '🚶‍♂️ Đến giờ đi làm',
        body: `Đã đến giờ khởi hành (${shift.departureTime}) cho ca ${shift.name}`,
        isValid: true,
        reason: undefined
      });

      const hoursFromNow = (departureReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      ShiftDebugLogger.info('timing', `✅ DEPARTURE scheduled for ${departureReminderTime.toLocaleString()} (${hoursFromNow.toFixed(2)}h from now)`);
    } else {
      const hoursFromNow = (departureReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      ShiftDebugLogger.info('timing', `❌ DEPARTURE skipped - time is in the past: ${departureReminderTime.toLocaleString()} (${hoursFromNow.toFixed(2)}h from now)`);
    }

    // ✅ 2. CHECK-IN REMINDER (before start time) - Compare with current time
    const reminderMinutes = shift.remindBeforeStart || 15;
    const checkinReminderTime = addMinutes(scheduledStartTime, -reminderMinutes);
    const checkinIsFuture = isAfter(checkinReminderTime, now);

    if (checkinIsFuture) {
      timings.push({
        id: `checkin-${workdayDateString}`,
        type: 'checkin',
        shiftId: shift.id,
        shiftName: shift.name,
        scheduledTime: checkinReminderTime,
        title: '📥 Nhắc nhở chấm công vào',
        body: `Còn ${reminderMinutes} phút nữa đến giờ chấm công vào (${shift.startTime}) cho ca ${shift.name}`,
        isValid: true,
        reason: undefined
      });

      const hoursFromNow = (checkinReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      ShiftDebugLogger.info('timing', `✅ CHECK-IN scheduled for ${checkinReminderTime.toLocaleString()} (${hoursFromNow.toFixed(2)}h from now)`);
    } else {
      const hoursFromNow = (checkinReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      ShiftDebugLogger.info('timing', `❌ CHECK-IN skipped - time is in the past: ${checkinReminderTime.toLocaleString()} (${hoursFromNow.toFixed(2)}h from now)`);
    }

    // ✅ 3. CHECK-OUT REMINDER (after end time) - Compare with current time
    const checkoutReminderMinutes = shift.remindAfterEnd || 10;
    const checkoutReminderTime = addMinutes(scheduledEndTime, checkoutReminderMinutes);
    const checkoutIsFuture = isAfter(checkoutReminderTime, now);

    // For overnight shifts, use the actual end date for the ID
    const checkoutDateString = isOvernightShift ? format(scheduledEndTime, 'yyyy-MM-dd') : workdayDateString;

    if (checkoutIsFuture) {
      timings.push({
        id: `checkout-${checkoutDateString}`,
        type: 'checkout',
        shiftId: shift.id,
        shiftName: shift.name,
        scheduledTime: checkoutReminderTime,
        title: '📤 Nhắc nhở chấm công ra',
        body: `Đã ${checkoutReminderMinutes} phút sau giờ tan ca (${shift.endTime}). Nhớ chấm công ra cho ca ${shift.name}`,
        isValid: true,
        reason: undefined
      });

      const hoursFromNow = (checkoutReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      ShiftDebugLogger.info('timing', `✅ CHECK-OUT scheduled for ${checkoutReminderTime.toLocaleString()} (${hoursFromNow.toFixed(2)}h from now)`);
    } else {
      const hoursFromNow = (checkoutReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      ShiftDebugLogger.info('timing', `❌ CHECK-OUT skipped - time is in the past: ${checkoutReminderTime.toLocaleString()} (${hoursFromNow.toFixed(2)}h from now)`);
    }

    ShiftDebugLogger.info('timing', `=== TIMING CALCULATION COMPLETED for ${workdayDateString} ===`);
    return timings;
  }

  /**
   * ✅ Cleanup all notifications (comprehensive cleanup including non-shift notifications)
   */
  async cleanupAllNotifications(): Promise<void> {
    if (!this.canSchedule) {
      ShiftDebugLogger.info('cleanup', 'Cannot cleanup - notifications not available');
      return;
    }

    try {
      ShiftDebugLogger.info('cleanup', '=== STARTING COMPREHENSIVE CLEANUP ===');

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      ShiftDebugLogger.info('cleanup', `Found ${scheduled.length} total scheduled notifications`);

      // ✅ Cancel ALL notifications (including shift, note, weekly, rotation, weather, extreme weather, etc.)
      const allNotifications = scheduled.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.startsWith('departure-') ||
          id.startsWith('checkin-') ||
          id.startsWith('checkout-') ||
          id.startsWith('weather_check_') ||
          id.startsWith('weather_') ||
          id.startsWith('extreme_weather_') ||
          id.includes('departure_') ||
          id.includes('checkin_') ||
          id.includes('checkout_') ||
          id.includes('shift_') ||
          id.includes('note_shift_') ||
          id.includes('weekly_reminder_') ||
          id.includes('rotation_') ||
          id.includes('weather_') ||
          id.includes('extreme_weather_')
        );
      });

      ShiftDebugLogger.info('cleanup', `Found ${allNotifications.length} notifications to cancel`);

      // ✅ Cancel each notification with error handling
      let cancelledCount = 0;
      let errorCount = 0;

      for (const notification of allNotifications) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          ShiftDebugLogger.info('cleanup', `✅ Cancelled: ${notification.identifier}`);
          cancelledCount++;
        } catch (error) {
          ShiftDebugLogger.warning('cleanup', `⚠️ Failed to cancel: ${notification.identifier}`, error);
          errorCount++;
        }
      }

      // ✅ Double-check: Verify cleanup success
      const remainingScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const remainingNotifications = remainingScheduled.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.startsWith('departure-') ||
          id.startsWith('checkin-') ||
          id.startsWith('checkout-') ||
          id.startsWith('weather_check_') ||
          id.startsWith('weather_') ||
          id.startsWith('extreme_weather_') ||
          id.includes('departure_') ||
          id.includes('checkin_') ||
          id.includes('checkout_') ||
          id.includes('shift_') ||
          id.includes('weather_') ||
          id.includes('extreme_weather_')
        );
      });

      if (remainingNotifications.length > 0) {
        ShiftDebugLogger.warning('cleanup', `Still found ${remainingNotifications.length} notifications after cleanup`);

        // Force cleanup remaining notifications
        for (const notification of remainingNotifications) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            ShiftDebugLogger.info('cleanup', `🔧 Force cancelled: ${notification.identifier}`);
          } catch (error) {
            ShiftDebugLogger.error('cleanup', `❌ Force cancel failed: ${notification.identifier}`, error);
          }
        }
      }

      ShiftDebugLogger.success('cleanup', `Cleanup completed: ${cancelledCount} cancelled, ${errorCount} errors`);
      ShiftDebugLogger.info('cleanup', '=== CLEANUP COMPLETED ===');

      // ✅ Wait a bit to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      ShiftDebugLogger.error('cleanup', 'Critical error during cleanup', error);
      throw error;
    }
  }

  /**
   * ✅ Cancel all existing shift reminders (cleanup function)
   */
  async cancelAllExistingShiftReminders(): Promise<void> {
    if (!this.canSchedule) {
      ShiftDebugLogger.info('cleanup', 'Cannot cleanup - notifications not available');
      return;
    }

    try {
      ShiftDebugLogger.info('cleanup', '=== STARTING SHIFT REMINDERS CLEANUP ===');

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      ShiftDebugLogger.info('cleanup', `Found ${scheduled.length} total scheduled notifications`);

      // ✅ Filter shift-related notifications (including weather warnings)
      const shiftNotifications = scheduled.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.startsWith('departure-') ||
          id.startsWith('checkin-') ||
          id.startsWith('checkout-') ||
          id.startsWith('weather_check_') ||
          id.startsWith('weather_') ||
          id.includes('shift_') ||
          id.includes('departure_') ||
          id.includes('checkin_') ||
          id.includes('checkout_') ||
          id.includes('weather_')
        );
      });

      ShiftDebugLogger.info('cleanup', `Found ${shiftNotifications.length} shift notifications to cancel`);

      // ✅ Cancel each notification with error handling
      let cancelledCount = 0;
      for (const notification of shiftNotifications) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          ShiftDebugLogger.info('cleanup', `✅ Cancelled: ${notification.identifier}`);
          cancelledCount++;
        } catch (error) {
          ShiftDebugLogger.warning('cleanup', `⚠️ Failed to cancel: ${notification.identifier}`, error);
        }
      }

      ShiftDebugLogger.success('cleanup', `Cleanup completed: ${cancelledCount} notifications cancelled`);
      ShiftDebugLogger.info('cleanup', '=== CLEANUP COMPLETED ===');

      // ✅ Wait a bit to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      ShiftDebugLogger.error('cleanup', 'Critical error during cleanup', error);
      throw error;
    }
  }

  /**
   * ⚠️ DEPRECATED: Shift reminders are now handled by AlarmService
   * This method redirects to AlarmService for backward compatibility
   */
  async scheduleRemindersForShift(shift: Shift): Promise<void> {
    ShiftDebugLogger.warning('notification', '🚫 DEPRECATED: scheduleRemindersForShift() - Shift reminders are now handled by AlarmService');
    ShiftDebugLogger.info('notification', 'Redirecting to AlarmService.scheduleShiftReminder()');

    try {
      const { alarmService } = await import('./alarmService');
      await alarmService.scheduleShiftReminder(shift);
      ShiftDebugLogger.success('notification', 'Successfully redirected to AlarmService');
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Failed to redirect to AlarmService', error);
      throw error;
    }
  }

  /**
   * ✅ Cancel all weather warning notifications (including extreme weather)
   */
  async cancelAllWeatherWarnings(): Promise<void> {
    if (!this.canSchedule) {
      ShiftDebugLogger.info('cleanup', 'Cannot cleanup weather warnings - notifications not available');
      return;
    }

    try {
      ShiftDebugLogger.info('cleanup', '=== STARTING COMPREHENSIVE WEATHER CLEANUP ===');

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      ShiftDebugLogger.info('cleanup', `Found ${scheduled.length} total scheduled notifications`);

      // ✅ Find all weather-related notifications with comprehensive patterns
      const weatherNotifications = scheduled.filter((n: any) => {
        const id = n.identifier || '';
        return (
          // Standard weather notifications
          id.startsWith('weather_check_') ||
          id.startsWith('weather_') ||
          id.includes('weather_') ||
          // Extreme weather notifications
          id.startsWith('extreme_weather_') ||
          id.includes('extreme_weather_') ||
          id.includes('extreme_weather_warning_') ||
          // Weather current notifications
          id.startsWith('weather_current_') ||
          // Any notification with weather in data type
          (n.content?.data?.type && (
            n.content.data.type === 'weather_check' ||
            n.content.data.type === 'weather' ||
            n.content.data.type === 'weather_current' ||
            n.content.data.type === 'extreme_weather_check' ||
            n.content.data.type === 'extreme_weather_warning'
          ))
        );
      });

      ShiftDebugLogger.info('cleanup', `Found ${weatherNotifications.length} weather notifications to cancel`);

      // ✅ Log details of what we're cancelling
      weatherNotifications.forEach(n => {
        ShiftDebugLogger.info('cleanup', `Will cancel: ${n.identifier} (type: ${n.content?.data?.type || 'unknown'})`);
      });

      // ✅ Cancel each weather notification with error handling
      let cancelledCount = 0;
      let errorCount = 0;

      for (const notification of weatherNotifications) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          ShiftDebugLogger.info('cleanup', `✅ Cancelled weather: ${notification.identifier}`);
          cancelledCount++;
        } catch (error) {
          ShiftDebugLogger.warning('cleanup', `⚠️ Failed to cancel weather: ${notification.identifier}`, error);
          errorCount++;
        }
      }

      // ✅ Double-check for any remaining weather notifications
      const remainingScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const remainingWeather = remainingScheduled.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.startsWith('weather_') ||
          id.includes('weather_') ||
          id.startsWith('extreme_weather_') ||
          id.includes('extreme_weather_')
        );
      });

      if (remainingWeather.length > 0) {
        ShiftDebugLogger.warning('cleanup', `Still found ${remainingWeather.length} weather notifications after cleanup`);

        // Force cleanup remaining weather notifications
        for (const notification of remainingWeather) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            ShiftDebugLogger.info('cleanup', `🔧 Force cancelled weather: ${notification.identifier}`);
            cancelledCount++;
          } catch (error) {
            ShiftDebugLogger.error('cleanup', `❌ Force cancel weather failed: ${notification.identifier}`, error);
          }
        }
      }

      ShiftDebugLogger.success('cleanup', `Weather cleanup completed: ${cancelledCount} notifications cancelled, ${errorCount} errors`);
      ShiftDebugLogger.info('cleanup', '=== COMPREHENSIVE WEATHER CLEANUP COMPLETED ===');

      // ✅ Wait a bit to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      ShiftDebugLogger.error('cleanup', 'Critical error during weather cleanup', error);
      throw error;
    }
  }

  /**
   * ✅ Schedule weather warning notification (1 hour before departure)
   */
  async scheduleWeatherWarning(shift: Shift, workdayDate: Date): Promise<void> {
    await this.initialize();

    if (!this.canSchedule) {
      ShiftDebugLogger.warning('weather', 'Cannot schedule weather warning - notifications not available');
      return;
    }

    try {
      const now = new Date();
      const workdayDateString = format(workdayDate, 'yyyy-MM-dd');

      // ✅ Tính toán thời gian cảnh báo thời tiết chính xác hơn
      const departureTime = this.buildTimestamp(workdayDate, shift.departureTime, false);
      const weatherCheckTime = addMinutes(departureTime, -60); // 1 hour before departure

      // ✅ Validation: Đảm bảo thời gian cảnh báo hợp lý
      const minNotificationTime = addMinutes(now, 30); // Ít nhất 30 phút từ bây giờ
      const maxNotificationTime = addDays(now, 2); // Không quá 2 ngày

      const isValidTime = isAfter(weatherCheckTime, minNotificationTime) &&
                         isAfter(maxNotificationTime, weatherCheckTime);

      if (isValidTime) {
        const identifier = `weather_check_${shift.id}_${workdayDateString}`;

        // ✅ Tạo thông báo thời tiết chi tiết hơn
        let weatherMessage = `Kiểm tra điều kiện thời tiết trước khi đi làm ca ${shift.name}`;
        let notificationTitle = '🌤️ Thông báo thời tiết';

        try {
          const { weatherService } = await import('./weather');
          const weatherData = await weatherService.getWeatherData(true); // Force refresh

          if (weatherData?.warnings && weatherData.warnings.length > 0) {
            // Nếu có cảnh báo thời tiết, ưu tiên hiển thị
            notificationTitle = '⚠️ Cảnh báo thời tiết';
            const warningMessages = weatherData.warnings
              .slice(0, 2) // Chỉ lấy 2 cảnh báo đầu tiên để tránh quá dài
              .map(w => w.message)
              .join('. ');
            weatherMessage = `${warningMessages}. Chuẩn bị kỹ trước khi đi làm ca ${shift.name} lúc ${shift.departureTime}`;
          } else if (weatherData?.current) {
            // Nếu không có cảnh báo, hiển thị thông tin thời tiết chi tiết
            const temp = weatherData.current.temperature;
            const desc = weatherData.current.description;
            const location = weatherData.current.location;

            // Thêm lời khuyên dựa trên nhiệt độ
            let advice = '';
            if (temp >= 35) {
              advice = 'Thời tiết rất nóng, nhớ mang nước và tránh nắng';
            } else if (temp >= 30) {
              advice = 'Thời tiết nóng, nên mang nước và ô che nắng';
            } else if (temp <= 15) {
              advice = 'Thời tiết lạnh, nhớ mang áo ấm';
            } else if (temp <= 20) {
              advice = 'Thời tiết mát, có thể cần áo khoác nhẹ';
            } else {
              advice = 'Thời tiết dễ chịu';
            }

            weatherMessage = `${temp}°C, ${desc} tại ${location}. ${advice}. Đi làm ca ${shift.name} lúc ${shift.departureTime}`;
          }
        } catch (weatherError) {
          ShiftDebugLogger.warning('weather', 'Could not fetch weather data for notification', weatherError);
          // Giữ thông báo mặc định nếu không lấy được dữ liệu thời tiết
          weatherMessage = `Nhớ kiểm tra thời tiết trước khi đi làm ca ${shift.name} lúc ${shift.departureTime}`;
        }

        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: notificationTitle,
            body: weatherMessage,
            categoryIdentifier: NOTIFICATION_CATEGORIES.WEATHER_WARNING,
            data: {
              type: 'weather_check',
              shiftId: shift.id,
              shiftName: shift.name,
              date: workdayDateString,
              departureTime: shift.departureTime,
              officeEndTime: shift.officeEndTime,
              scheduledFor: weatherCheckTime.toISOString(),
            },
          },
          trigger: {
            date: weatherCheckTime,
          },
        });

        const hoursFromNow = (weatherCheckTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        ShiftDebugLogger.success('weather', `✅ Scheduled weather notification for ${shift.name}`, {
          scheduledTime: weatherCheckTime.toLocaleString(),
          hoursFromNow: hoursFromNow.toFixed(2),
          departureTime: shift.departureTime,
          date: workdayDateString
        });
      } else {
        const hoursFromNow = (weatherCheckTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        ShiftDebugLogger.info('weather', `❌ Skipped weather notification - invalid time`, {
          scheduledTime: weatherCheckTime.toLocaleString(),
          hoursFromNow: hoursFromNow.toFixed(2),
          reason: hoursFromNow < 0.5 ? 'too soon' : 'too far in future',
          departureTime: shift.departureTime,
          date: workdayDateString
        });
      }
    } catch (error) {
      ShiftDebugLogger.error('weather', 'Error scheduling weather warning', error);
      throw error;
    }
  }

  /**
   * ✅ Alias for backward compatibility
   */
  async scheduleShiftNotifications(shift: Shift): Promise<void> {
    return await this.scheduleRemindersForShift(shift);
  }

  /**
   * ✅ Debug: Hiển thị tất cả notifications đã lập lịch với format đẹp
   */
  async debugScheduledNotifications(): Promise<void> {
    if (!this.canSchedule) {
      ShiftDebugLogger.warning('notification', 'Cannot debug - notifications not available');
      return;
    }

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();

      ShiftDebugLogger.info('notification', '=== SCHEDULED NOTIFICATIONS DEBUG ===');
      ShiftDebugLogger.info('notification', `Total notifications: ${scheduled.length}`);

      const shiftNotifications = scheduled.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.includes('departure_') ||
          id.includes('checkin_') ||
          id.includes('checkout_') ||
          id.includes('weather_check_') ||
          id.includes('weather_')
        );
      });

      ShiftDebugLogger.info('notification', `Shift-related notifications (including weather): ${shiftNotifications.length}`);

      if (shiftNotifications.length === 0) {
        ShiftDebugLogger.info('notification', 'No shift notifications found');
      } else {
        shiftNotifications.forEach((notification: any) => {
          const trigger = notification.trigger;
          const triggerDate = trigger?.date ? new Date(trigger.date * 1000) : null;
          const now = new Date();

          if (triggerDate) {
            const diffHours = (triggerDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            const status = triggerDate > now ? '✅ FUTURE' : '❌ PAST';

            ShiftDebugLogger.info('notification', `${notification.identifier}`, {
              title: notification.content.title,
              triggerTime: triggerDate.toLocaleString(),
              status,
              hoursFromNow: diffHours.toFixed(2)
            });
          } else {
            ShiftDebugLogger.info('notification', `${notification.identifier}`, {
              title: notification.content.title,
              trigger: 'Immediate',
              status: '⚡ IMMEDIATE'
            });
          }
        });
      }

      ShiftDebugLogger.info('notification', '=== END DEBUG ===');
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error debugging notifications', error);
    }
  }

  /**
   * ✅ Hiển thị fallback alert khi notifications không khả dụng
   */
  private showFallbackAlert(title: string, message: string): void {
    Alert.alert(
      `📱 ${title}`,
      `${message}\n\n💡 Để sử dụng đầy đủ tính năng nhắc nhở, hãy tạo development build hoặc build production.`,
      [{ text: 'Đã hiểu', style: 'default' }]
    );
  }

  /**
   * ✅ Lấy trạng thái notification service
   */
  getNotificationStatus(): NotificationStatus | null {
    return this.status;
  }

  /**
   * ✅ Kiểm tra có thể lập lịch notifications không
   */
  canScheduleNotifications(): boolean {
    return this.canSchedule && this.status?.canSchedule === true;
  }

  /**
   * ✅ Test notification để kiểm tra hoạt động
   */
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
          body: 'NotificationScheduler đang hoạt động bình thường!',
          data: { type: 'test' },
        },
        trigger: null, // Show immediately
      });

      ShiftDebugLogger.success('notification', 'Test notification sent successfully');
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Test notification failed', error);
      throw error;
    }
  }
  /**
   * ✅ Lập lịch thông báo xoay ca
   */
  async scheduleShiftRotationNotification(oldShiftName: string, newShiftName: string): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        ShiftDebugLogger.info('notification', 'Cannot schedule rotation notification - notifications not available');
        return;
      }

      const identifier = `rotation_${oldShiftName}_${newShiftName}_${Date.now()}`;

      await Notifications.scheduleNotificationAsync({
        identifier,
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

      ShiftDebugLogger.success('notification', `Sent rotation notification: ${oldShiftName} → ${newShiftName}`);
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error scheduling rotation notification', error);
    }
  }

  /**
   * ✅ Gửi thông báo thời tiết với weather data thực tế
   */
  async sendWeatherNotificationWithCurrentData(shift: Shift, date: string): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        ShiftDebugLogger.info('notification', 'Cannot send weather notification - notifications not available');
        return;
      }

      // Get current weather data
      const { weatherService } = await import('./weather');
      const weatherData = await weatherService.getWeatherData(true); // Force refresh

      let title = '🌤️ Thông báo thời tiết';
      let message = `Kiểm tra điều kiện thời tiết trước khi đi làm ca ${shift.name}`;

      if (weatherData?.warnings && weatherData.warnings.length > 0) {
        // If there are weather warnings, prioritize them
        title = '⚠️ Cảnh báo thời tiết';
        const warningMessages = weatherData.warnings.map(w => w.message).join(', ');
        message = `${warningMessages}. Chuẩn bị kỹ trước khi đi làm ca ${shift.name}`;
      } else if (weatherData?.current) {
        // If no warnings, show current weather
        message = `Thời tiết hiện tại: ${weatherData.current.temperature}°C, ${weatherData.current.description}. Đi làm ca ${shift.name} an toàn!`;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: `weather_current_${shift.id}_${date}_${Date.now()}`,
        content: {
          title,
          body: message,
          categoryIdentifier: NOTIFICATION_CATEGORIES.WEATHER_WARNING,
          data: {
            type: 'weather_current',
            shiftId: shift.id,
            shiftName: shift.name,
            date,
            hasWarnings: weatherData?.warnings && weatherData.warnings.length > 0,
          },
        },
        trigger: null, // Show immediately
      });

      ShiftDebugLogger.success('weather', `Sent weather notification with current data for shift ${shift.name}`);
    } catch (error) {
      ShiftDebugLogger.error('weather', 'Error sending weather notification with current data', error);
    }
  }

  /**
   * ✅ Lập lịch cảnh báo thời tiết ngay lập tức
   */
  async scheduleImmediateWeatherWarning(message: string, location: string): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        ShiftDebugLogger.info('notification', 'Cannot schedule weather warning - notifications not available');
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

      ShiftDebugLogger.success('notification', 'Sent weather warning notification');
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error scheduling weather warning', error);
    }
  }

  /**
   * ✅ Lập lịch nhắc nhở hàng tuần
   */
  async scheduleWeeklyShiftReminder(reminderDate: Date): Promise<void> {
    try {
      await this.initialize();

      if (!this.canScheduleNotifications()) {
        ShiftDebugLogger.info('notification', 'Cannot schedule weekly reminder - notifications not available');
        return;
      }

      const now = new Date();
      const timeDiff = reminderDate.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      // Validation
      if (daysDiff < 0.1 || daysDiff > 7) {
        ShiftDebugLogger.warning('notification', `Invalid weekly reminder time (${daysDiff.toFixed(2)} days)`);
        return;
      }

      // Cancel existing weekly reminders
      await this.cancelWeeklyReminders();

      const identifier = `weekly_reminder_${Date.now()}`;

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

      ShiftDebugLogger.success('notification', `Scheduled weekly reminder for ${reminderDate.toLocaleString()}`);
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error scheduling weekly reminder', error);
    }
  }

  /**
   * ✅ Hủy nhắc nhở hàng tuần
   */
  async cancelWeeklyReminders(): Promise<void> {
    try {
      if (!this.canScheduleNotifications()) return;

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const weeklyReminders = scheduled.filter(
        (notification: any) => notification.identifier.startsWith('weekly_reminder_')
      );

      for (const notification of weeklyReminders) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      ShiftDebugLogger.info('notification', `Cancelled ${weeklyReminders.length} weekly reminders`);
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error cancelling weekly reminders', error);
    }
  }

  /**
   * ✅ Lấy tất cả notifications đã lập lịch
   */
  async getAllScheduledNotifications(): Promise<any[]> {
    try {
      if (!this.canScheduleNotifications()) return [];
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error getting scheduled notifications', error);
      return [];
    }
  }

  /**
   * ✅ Hủy notification sau khi thực hiện action (tích hợp sẵn trong logic)
   */
  async cancelReminderAfterAction(action: 'go_work' | 'check_in' | 'check_out', shiftId: string, date: string): Promise<void> {
    try {
      if (!this.canScheduleNotifications()) return;

      // Map action to notification type
      let notificationType: string;
      switch (action) {
        case 'go_work':
          notificationType = 'departure';
          break;
        case 'check_in':
          notificationType = 'checkin';
          break;
        case 'check_out':
          notificationType = 'checkout';
          break;
        default:
          return;
      }

      const identifier = `${notificationType}_${shiftId}_${date}`;

      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        ShiftDebugLogger.info('notification', `Cancelled ${notificationType} notification after ${action}: ${identifier}`);
      } catch (cancelError) {
        // Không log error nếu notification không tồn tại
        ShiftDebugLogger.info('notification', `Notification ${identifier} not found or already cancelled`);
      }
    } catch (error) {
      ShiftDebugLogger.error('notification', `Error cancelling notification after ${action}`, error);
    }
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler();
