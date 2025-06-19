/**
 * 🔔 Notification Handler - Xử lý responses và actions từ notifications
 */

import * as Notifications from 'expo-notifications';
import { notificationScheduler } from './notificationScheduler';
import { extremeWeatherService } from './extremeWeatherService';
import { ShiftDebugLogger } from '../utils/shiftDebugLogger';

class NotificationHandler {
  private responseListener: any = null;
  private receivedListener: any = null;

  /**
   * ✅ Khởi tạo notification handlers
   */
  async initialize(): Promise<void> {
    try {
      // Handle notification responses (when user taps notification)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        this.handleNotificationResponse.bind(this)
      );

      // Handle notifications received while app is in foreground
      this.receivedListener = Notifications.addNotificationReceivedListener(
        this.handleNotificationReceived.bind(this)
      );

      ShiftDebugLogger.success('notification', 'Notification handlers initialized');
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error initializing notification handlers', error);
    }
  }

  /**
   * ✅ Cleanup notification handlers
   */
  cleanup(): void {
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }

    if (this.receivedListener) {
      this.receivedListener.remove();
      this.receivedListener = null;
    }

    ShiftDebugLogger.info('notification', 'Notification handlers cleaned up');
  }

  /**
   * ✅ Handle notification response (when user taps notification)
   */
  private async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    try {
      const { notification } = response;
      const { data } = notification.request.content;

      ShiftDebugLogger.info('notification', 'Notification response received', {
        identifier: notification.request.identifier,
        type: data?.type,
        actionIdentifier: response.actionIdentifier,
      });

      // Handle different notification types
      switch (data?.type) {
        case 'weather_check':
          await this.handleWeatherCheckResponse(data);
          break;

        case 'weather_current':
          await this.handleWeatherCurrentResponse(data);
          break;

        case 'extreme_weather_check':
          await this.handleExtremeWeatherCheckResponse(data);
          break;

        case 'extreme_weather_warning':
          await this.handleExtremeWeatherWarningResponse(data);
          break;

        case 'shift_reminder':
          await this.handleShiftReminderResponse(data);
          break;

        case 'weekly_reminder':
          await this.handleWeeklyReminderResponse(data);
          break;

        default:
          ShiftDebugLogger.info('notification', `Unhandled notification type: ${data?.type}`);
      }
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error handling notification response', error);
    }
  }

  /**
   * ✅ Handle notification received in foreground
   */
  private async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    try {
      const { data } = notification.request.content;

      ShiftDebugLogger.info('notification', 'Notification received in foreground', {
        identifier: notification.request.identifier,
        type: data?.type,
        title: notification.request.content.title,
      });

      // Auto-handle certain notification types
      switch (data?.type) {
        case 'weather_check':
          // Automatically send current weather data when weather check notification is received
          if (data.shiftId && data.date) {
            await this.autoSendCurrentWeatherData(data);
          }
          break;

        case 'extreme_weather_check':
          // Automatically perform extreme weather check when notification is received
          if (data.shiftId && data.date) {
            await this.autoPerformExtremeWeatherCheck(data);
          }
          break;
      }
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error handling received notification', error);
    }
  }

  /**
   * ✅ Handle weather check notification response
   */
  private async handleWeatherCheckResponse(data: any): Promise<void> {
    try {
      ShiftDebugLogger.info('notification', 'Handling weather check response', data);

      // Send current weather data
      if (data.shiftId && data.date) {
        await this.autoSendCurrentWeatherData(data);
      }
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error handling weather check response', error);
    }
  }

  /**
   * ✅ Handle weather current notification response
   */
  private async handleWeatherCurrentResponse(data: any): Promise<void> {
    try {
      ShiftDebugLogger.info('notification', 'Handling weather current response', data);
      
      // User has seen the weather notification, no further action needed
      // Could potentially open weather screen or app here
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error handling weather current response', error);
    }
  }

  /**
   * ✅ Handle shift reminder notification response
   */
  private async handleShiftReminderResponse(data: any): Promise<void> {
    try {
      ShiftDebugLogger.info('notification', 'Handling shift reminder response', data);
      
      // Could open the app to the main screen or shift details
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error handling shift reminder response', error);
    }
  }

  /**
   * ✅ Handle weekly reminder notification response
   */
  private async handleWeeklyReminderResponse(data: any): Promise<void> {
    try {
      ShiftDebugLogger.info('notification', 'Handling weekly reminder response', data);
      
      // Could open shift management screen
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error handling weekly reminder response', error);
    }
  }

  /**
   * ✅ Handle extreme weather check notification response
   */
  private async handleExtremeWeatherCheckResponse(data: any): Promise<void> {
    try {
      ShiftDebugLogger.info('notification', 'Handling extreme weather check response', data);

      // This is a background check, no user action needed
      // The check will be performed automatically in handleNotificationReceived
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error handling extreme weather check response', error);
    }
  }

  /**
   * ✅ Handle extreme weather warning notification response
   */
  private async handleExtremeWeatherWarningResponse(data: any): Promise<void> {
    try {
      ShiftDebugLogger.info('notification', 'Handling extreme weather warning response', data);

      // User has seen the extreme weather warning
      // Could potentially open weather details or app here
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error handling extreme weather warning response', error);
    }
  }

  /**
   * ✅ Automatically perform extreme weather check
   */
  private async autoPerformExtremeWeatherCheck(data: any): Promise<void> {
    try {
      ShiftDebugLogger.info('notification', 'Auto-performing extreme weather check', data);

      // Perform the extreme weather check
      await extremeWeatherService.performExtremeWeatherCheck(data.shiftId, data.date);
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error auto-performing extreme weather check', error);
    }
  }

  /**
   * ✅ Automatically send current weather data
   */
  private async autoSendCurrentWeatherData(data: any): Promise<void> {
    try {
      ShiftDebugLogger.info('notification', 'Auto-sending current weather data', data);

      // Create a mock shift object from the data
      const shift = {
        id: data.shiftId,
        name: data.shiftName,
        departureTime: data.departureTime,
        officeStartTime: data.officeStartTime || '09:00',
        officeEndTime: data.officeEndTime,
        endTime: data.endTime || data.officeEndTime,
        workDays: [1, 2, 3, 4, 5], // Default to weekdays
        reminderBeforeStart: 60,
        reminderAfterEnd: 30,
      };

      // Send weather notification with current data
      await notificationScheduler.sendWeatherNotificationWithCurrentData(shift, data.date);
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Error auto-sending current weather data', error);
    }
  }
}

// Export singleton instance
export const notificationHandler = new NotificationHandler();
