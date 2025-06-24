/**
 * 🚫 DEPRECATED - File này đã được thay thế bởi notificationScheduler.ts
 * 
 * Wrapper đơn giản để tương thích với code cũ - tất cả calls được chuyển hướng sang notificationScheduler
 */

import { Platform, Alert } from 'react-native';
import { AlarmData, Shift, Note } from '../types';
import { alarmService } from './alarmService';

interface NotificationStatus {
  isSupported: boolean;
  isExpoGo: boolean;
  hasPermission: boolean;
  platform: string;
  message: string;
  canSchedule: boolean;
}

// Deprecated notification service - chuyển hướng tất cả calls sang alarmService
class DeprecatedNotificationService {
  async initialize(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.initialize() - sử dụng alarmService.initialize()');
    return await alarmService.initialize();
  }

  async scheduleShiftReminders(shift: Shift): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleShiftReminders() - sử dụng alarmService.scheduleShiftReminder()');
    return await alarmService.scheduleShiftReminder(shift);
  }

  async cancelShiftReminders(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelShiftReminders() - sử dụng alarmService.cancelShiftReminders()');
    return await alarmService.cancelShiftReminders();
  }

  async cancelAllNotifications(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelAllNotifications() - sử dụng alarmService.clearAllAlarms()');
    return await alarmService.clearAllAlarms();
  }

  async cancelAllShiftReminders(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelAllShiftReminders() - sử dụng alarmService.cancelShiftReminders()');
    return await alarmService.cancelShiftReminders();
  }

  async forceCleanupAllNotifications(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.forceCleanupAllNotifications() - sử dụng alarmService.clearAllAlarms()');
    return await alarmService.clearAllAlarms();
  }

  async cancelReminderAfterAction(action: 'go_work' | 'check_in' | 'check_out', shiftId: string, date: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelReminderAfterAction() - logic đã được tích hợp vào alarmService');
    // Không có method tương ứng trong alarmService, chỉ log
    return;
  }

  async scheduleNoteReminder(note: Note): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleNoteReminder() - sử dụng alarmService.scheduleNoteReminder()');
    return await alarmService.scheduleNoteReminder(note);
  }

  async cancelNoteReminder(noteId: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelNoteReminder() - sử dụng alarmService.cancelNoteReminder()');
    return await alarmService.cancelNoteReminder(noteId);
  }

  async scheduleWeatherWarning(_message: string, _location: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleWeatherWarning() - không còn hỗ trợ');
    return;
  }

  async scheduleShiftRotationNotification(_oldShiftName: string, _newShiftName: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleShiftRotationNotification() - không còn hỗ trợ');
    return;
  }

  async scheduleWeeklyShiftReminder(_reminderDate: Date): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleWeeklyShiftReminder() - không còn hỗ trợ');
    return;
  }

  async cancelWeeklyReminders(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelWeeklyReminders() - không còn hỗ trợ');
    return;
  }

  async getScheduledWeeklyReminders(): Promise<any[]> {
    console.warn('🚫 DEPRECATED: notificationService.getScheduledWeeklyReminders() - không còn hỗ trợ');
    return [];
  }

  async showAlarmNotification(_alarmData: AlarmData): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.showAlarmNotification() - không còn hỗ trợ');
    return;
  }

  async getAllScheduledNotifications(): Promise<any[]> {
    console.warn('🚫 DEPRECATED: notificationService.getAllScheduledNotifications() - không còn hỗ trợ');
    return [];
  }

  async testNotification(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.testNotification() - không còn hỗ trợ');
    return;
  }

  canScheduleNotifications(): boolean {
    console.warn('🚫 DEPRECATED: notificationService.canScheduleNotifications() - luôn trả về false');
    return false;
  }

  getNotificationStatus(): NotificationStatus | null {
    console.warn('🚫 DEPRECATED: notificationService.getNotificationStatus() - không còn hỗ trợ');
    return {
      isSupported: false,
      isExpoGo: true,
      hasPermission: false,
      platform: Platform.OS,
      message: 'Deprecated - sử dụng alarmService',
      canSchedule: false
    };
  }

  async getDetailedStatus(): Promise<{
    status: NotificationStatus;
    scheduledCount: number;
    environment: string;
    recommendations: string[];
  }> {
    console.warn('🚫 DEPRECATED: notificationService.getDetailedStatus() - sử dụng alarmService');

    const alarmStatus = await alarmService.getAlarmStatus();

    return {
      status: {
        isSupported: false,
        isExpoGo: true,
        hasPermission: false,
        platform: Platform.OS,
        message: 'Deprecated - sử dụng alarmService',
        canSchedule: false
      },
      scheduledCount: alarmStatus.scheduledCount,
      environment: Platform.OS,
      recommendations: ['Sử dụng alarmService thay vì notificationService']
    };
  }

  // Các methods bổ sung mà code khác đang sử dụng
  markAsUserInitiated(_actionId: string): void {
    console.warn('🚫 DEPRECATED: notificationService.markAsUserInitiated() - không còn cần thiết');
  }

  async cancelNotificationsByPattern(_patterns: string[]): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelNotificationsByPattern() - sử dụng alarmService.cancelAlarmsByPattern()');
    return;
  }

  async scheduleReminderWithId(_identifier: string, _type: string, _shift: Shift, _triggerTime: Date, _date: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleReminderWithId() - không còn hỗ trợ');
    return;
  }

  async scheduleSpecificReminder(_type: string, _shift: Shift, _triggerTime: Date, _date: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleSpecificReminder() - không còn hỗ trợ');
    return;
  }

  async cancelNotificationById(_identifier: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelNotificationById() - sử dụng alarmService.cancelAlarmById()');
    return;
  }
}

// Export instance để tương thích với code cũ
export const notificationService = new DeprecatedNotificationService();
