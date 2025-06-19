/**
 * 🚫 DEPRECATED - File này đã được thay thế bởi notificationScheduler.ts
 * 
 * Wrapper để tương thích với code cũ - tất cả calls được chuyển hướng sang notificationScheduler
 */

import { Platform, Alert } from 'react-native';
import { AlarmData, Shift, Note } from '../types';
import { notificationScheduler } from './notificationScheduler';

interface NotificationStatus {
  isSupported: boolean;
  isExpoGo: boolean;
  hasPermission: boolean;
  platform: string;
  message: string;
  canSchedule: boolean;
}

// Deprecated notification service - chuyển hướng tất cả calls sang notificationScheduler
class DeprecatedNotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.initialize() - sử dụng notificationScheduler.initialize()');
    return await notificationScheduler.initialize();
  }

  async scheduleShiftReminders(shift: Shift): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleShiftReminders() - sử dụng notificationScheduler.scheduleShiftNotifications()');
    return await notificationScheduler.scheduleShiftNotifications(shift);
  }

  async cancelShiftReminders(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelShiftReminders() - sử dụng notificationScheduler.cleanupAllNotifications()');
    return await notificationScheduler.cleanupAllNotifications();
  }

  async cancelAllNotifications(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelAllNotifications() - sử dụng notificationScheduler.cleanupAllNotifications()');
    return await notificationScheduler.cleanupAllNotifications();
  }

  async cancelAllShiftReminders(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelAllShiftReminders() - sử dụng notificationScheduler.cleanupAllNotifications()');
    return await notificationScheduler.cleanupAllNotifications();
  }

  async forceCleanupAllNotifications(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.forceCleanupAllNotifications() - sử dụng notificationScheduler.cleanupAllNotifications()');
    return await notificationScheduler.cleanupAllNotifications();
  }

  async cancelReminderAfterAction(action: 'go_work' | 'check_in' | 'check_out', shiftId: string, date: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelReminderAfterAction() - logic đã được tích hợp vào notificationScheduler');
    return await notificationScheduler.cancelReminderAfterAction(action, shiftId, date);
  }

  // Các methods khác để tương thích
  async scheduleNoteReminder(note: Note): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleNoteReminder() - chưa implement trong notificationScheduler');
    return;
  }

  async cancelNoteReminder(noteId: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelNoteReminder() - chưa implement trong notificationScheduler');
    return;
  }

  async scheduleWeatherWarning(message: string, location: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleWeatherWarning() - sử dụng notificationScheduler.scheduleImmediateWeatherWarning()');
    return await notificationScheduler.scheduleImmediateWeatherWarning(message, location);
  }

  async scheduleShiftRotationNotification(oldShiftName: string, newShiftName: string): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleShiftRotationNotification() - sử dụng notificationScheduler.scheduleShiftRotationNotification()');
    return await notificationScheduler.scheduleShiftRotationNotification(oldShiftName, newShiftName);
  }

  async scheduleWeeklyShiftReminder(reminderDate: Date): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.scheduleWeeklyShiftReminder() - sử dụng notificationScheduler.scheduleWeeklyShiftReminder()');
    return await notificationScheduler.scheduleWeeklyShiftReminder(reminderDate);
  }

  async cancelWeeklyReminders(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.cancelWeeklyReminders() - sử dụng notificationScheduler.cancelWeeklyReminders()');
    return await notificationScheduler.cancelWeeklyReminders();
  }

  async getScheduledWeeklyReminders(): Promise<any[]> {
    console.warn('🚫 DEPRECATED: notificationService.getScheduledWeeklyReminders() - sử dụng notificationScheduler.getAllScheduledNotifications()');
    const all = await notificationScheduler.getAllScheduledNotifications();
    return all.filter((n: any) => n.identifier.startsWith('weekly_reminder_'));
  }

  async showAlarmNotification(alarmData: AlarmData): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.showAlarmNotification() - chưa implement trong notificationScheduler');
    return;
  }

  async getAllScheduledNotifications(): Promise<any[]> {
    console.warn('🚫 DEPRECATED: notificationService.getAllScheduledNotifications() - sử dụng notificationScheduler.getAllScheduledNotifications()');
    return await notificationScheduler.getAllScheduledNotifications();
  }

  async testNotification(): Promise<void> {
    console.warn('🚫 DEPRECATED: notificationService.testNotification() - sử dụng notificationScheduler.testNotification()');
    return await notificationScheduler.testNotification();
  }

  canScheduleNotifications(): boolean {
    console.warn('🚫 DEPRECATED: notificationService.canScheduleNotifications() - sử dụng notificationScheduler.canScheduleNotifications()');
    return notificationScheduler.canScheduleNotifications();
  }

  getNotificationStatus(): NotificationStatus | null {
    console.warn('🚫 DEPRECATED: notificationService.getNotificationStatus() - sử dụng notificationScheduler.getNotificationStatus()');
    return notificationScheduler.getNotificationStatus();
  }

  async getDetailedStatus(): Promise<{
    status: NotificationStatus;
    scheduledCount: number;
    environment: string;
    recommendations: string[];
  }> {
    console.warn('🚫 DEPRECATED: notificationService.getDetailedStatus() - sử dụng notificationScheduler');
    
    const status = notificationScheduler.getNotificationStatus();
    const scheduledNotifications = await notificationScheduler.getAllScheduledNotifications();
    
    return {
      status: status || {
        isSupported: false,
        isExpoGo: false,
        hasPermission: false,
        platform: Platform.OS,
        message: 'Chưa khởi tạo',
        canSchedule: false
      },
      scheduledCount: scheduledNotifications.length,
      environment: status?.isExpoGo ? 'Expo Go' : 'Development/Production Build',
      recommendations: status?.isExpoGo 
        ? ['Sử dụng development build để có đầy đủ tính năng notifications']
        : !status?.hasPermission 
          ? ['Cấp quyền notifications trong Settings của thiết bị']
          : []
    };
  }

  async checkNotificationSupport(): Promise<NotificationStatus> {
    console.warn('🚫 DEPRECATED: notificationService.checkNotificationSupport() - sử dụng notificationScheduler.getNotificationStatus()');
    return notificationScheduler.getNotificationStatus() || {
      isSupported: false,
      isExpoGo: false,
      hasPermission: false,
      platform: Platform.OS,
      message: 'Chưa khởi tạo',
      canSchedule: false
    };
  }

  // Listener methods
  addNotificationResponseListener(listener: (response: any) => void): any {
    console.warn('🚫 DEPRECATED: notificationService.addNotificationResponseListener() - implement trong notificationScheduler nếu cần');
    return { remove: () => {} };
  }

  addNotificationReceivedListener(listener: (notification: any) => void): any {
    console.warn('🚫 DEPRECATED: notificationService.addNotificationReceivedListener() - implement trong notificationScheduler nếu cần');
    return { remove: () => {} };
  }
}

// Export singleton instance
export const notificationService = new DeprecatedNotificationService();
