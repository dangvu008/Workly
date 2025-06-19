/**
 * 🌪️ Extreme Weather Service
 * Quản lý chức năng Cảnh báo Thời tiết Cực đoan
 * 
 * Logic hoạt động:
 * - Kích hoạt ~1 giờ trước departureTime
 * - Phân tích thời tiết cho cả 2 chặng: Nhà -> Công ty và Công ty -> Nhà
 * - Tạo cảnh báo thông minh theo ngữ cảnh
 * - Gửi notification và cập nhật UI
 */

import { format, addHours, differenceInMinutes } from 'date-fns';
import { weatherService } from './weather';
import { storageService } from './storage';
import { notificationScheduler } from './notificationScheduler';
import { Shift } from '../types';

interface ExtremeWeatherWarning {
  id: string;
  shiftId: string;
  date: string;
  warningMessage: string;
  createdAt: string;
  dismissed: boolean;
  departureWarning?: string;
  returnWarning?: string;
}

class ExtremeWeatherService {
  private readonly STORAGE_KEY = 'extreme_weather_warnings';
  private readonly CHECK_BEFORE_DEPARTURE_HOURS = 1; // 1 giờ trước departure

  /**
   * ✅ Lên lịch kiểm tra thời tiết cực đoan cho một ca làm việc
   * DISABLED: Tạm thời vô hiệu hóa để tránh duplicate với weather warning system
   */
  async scheduleExtremeWeatherCheck(shift: Shift, date: Date): Promise<void> {
    try {
      console.log('🌪️ Extreme weather check DISABLED to prevent spam - using standard weather warning instead');
      return;

      // ❌ DISABLED CODE - Tạm thời comment để tránh duplicate notifications
      /*
      const settings = await storageService.getUserSettings();

      if (!settings.weatherWarningEnabled || !settings.weatherLocation) {
        console.log('🌪️ Extreme weather check skipped: weather warning disabled or no location');
        return;
      }

      // Tính thời gian check (1 giờ trước departure)
      const [depHour, depMinute] = shift.departureTime.split(':').map(Number);
      const departureTime = new Date(date);
      departureTime.setHours(depHour, depMinute, 0, 0);

      const checkTime = new Date(departureTime.getTime() - (this.CHECK_BEFORE_DEPARTURE_HOURS * 60 * 60 * 1000));

      // Chỉ schedule nếu thời gian check là trong tương lai
      const now = new Date();
      if (checkTime <= now) {
        console.log('🌪️ Extreme weather check time has passed, skipping schedule');
        return;
      }

      // Tạo unique identifier (consistent, không dùng Date.now())
      const checkId = `extreme_weather_${shift.id}_${format(date, 'yyyy-MM-dd')}`;

      console.log(`🌪️ Scheduling extreme weather check for ${format(checkTime, 'yyyy-MM-dd HH:mm')}`);

      // ❌ ISSUE: scheduleNotification method không tồn tại
      // Cần sử dụng scheduleNotificationAsync thay vì scheduleNotification
      */

    } catch (error) {
      console.error('Error scheduling extreme weather check:', error);
    }
  }

  /**
   * ✅ Thực hiện kiểm tra thời tiết cực đoan (được gọi khi notification trigger)
   */
  async performExtremeWeatherCheck(shiftId: string, dateStr: string): Promise<void> {
    try {
      console.log(`🌪️ Performing extreme weather check for shift ${shiftId} on ${dateStr}`);
      
      // Lấy thông tin shift
      const shifts = await storageService.getShiftList();
      const shift = shifts.find((s: Shift) => s.id === shiftId);
      
      if (!shift) {
        console.error('Shift not found for extreme weather check');
        return;
      }

      const date = new Date(dateStr);
      
      // Phân tích thời tiết cực đoan
      const analysis = await weatherService.analyzeExtremeWeatherForShift(shift, date);
      
      if (analysis.hasWarning) {
        console.log(`🌪️ Extreme weather warning detected: ${analysis.warningMessage}`);
        
        // Lưu warning với consistent ID (không dùng Date.now())
        await this.saveExtremeWeatherWarning({
          id: `warning_${shiftId}_${dateStr}`,
          shiftId,
          date: dateStr,
          warningMessage: analysis.warningMessage,
          createdAt: new Date().toISOString(),
          dismissed: false,
          departureWarning: analysis.departureWarning,
          returnWarning: analysis.returnWarning
        });

        // Gửi notification với độ ưu tiên cao
        await this.sendExtremeWeatherNotification(analysis.warningMessage, shift, date);
        
        // Trigger UI update (có thể emit event hoặc update state)
        await this.triggerUIUpdate(analysis);
        
      } else {
        console.log('🌪️ No extreme weather conditions detected');
      }

    } catch (error) {
      console.error('Error performing extreme weather check:', error);
    }
  }

  /**
   * ✅ Gửi notification cảnh báo thời tiết cực đoan
   */
  private async sendExtremeWeatherNotification(
    warningMessage: string,
    shift: Shift,
    date: Date
  ): Promise<void> {
    try {
      // ✅ Sử dụng consistent ID (không dùng Date.now())
      const notificationId = `extreme_weather_warning_${shift.id}_${format(date, 'yyyy-MM-dd')}`;

      // ✅ Import Notifications để sử dụng method đúng
      const { Notifications } = await import('expo-notifications');

      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: '⚠️ Cảnh báo Thời tiết Cực đoan',
          body: warningMessage,
          categoryIdentifier: 'EXTREME_WEATHER',
          sound: 'default',
          badge: 1,
          data: {
            type: 'extreme_weather_warning',
            shiftId: shift.id,
            date: format(date, 'yyyy-MM-dd'),
            priority: 'high'
          }
        },
        trigger: null // Gửi ngay lập tức
      });

      console.log(`🌪️ Sent extreme weather notification: ${notificationId}`);

    } catch (error) {
      console.error('Error sending extreme weather notification:', error);
    }
  }

  /**
   * ✅ Trigger UI update để hiển thị warning trên HomeScreen
   */
  private async triggerUIUpdate(analysis: any): Promise<void> {
    try {
      // Lưu warning state để UI có thể đọc
      await storageService.setItem('current_extreme_weather_warning', JSON.stringify({
        hasWarning: analysis.hasWarning,
        warningMessage: analysis.warningMessage,
        timestamp: new Date().toISOString()
      }));
      
      console.log('🌪️ Triggered UI update for extreme weather warning');
      
    } catch (error) {
      console.error('Error triggering UI update:', error);
    }
  }

  /**
   * ✅ Lưu extreme weather warning
   */
  private async saveExtremeWeatherWarning(warning: ExtremeWeatherWarning): Promise<void> {
    try {
      const existingWarnings = await this.getExtremeWeatherWarnings();
      const updatedWarnings = [...existingWarnings, warning];
      
      // Chỉ giữ warnings của 7 ngày gần nhất
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const filteredWarnings = updatedWarnings.filter(w => 
        new Date(w.createdAt) > sevenDaysAgo
      );
      
      await storageService.setItem(this.STORAGE_KEY, JSON.stringify(filteredWarnings));
      
    } catch (error) {
      console.error('Error saving extreme weather warning:', error);
    }
  }

  /**
   * ✅ Lấy danh sách extreme weather warnings
   */
  async getExtremeWeatherWarnings(): Promise<ExtremeWeatherWarning[]> {
    try {
      const data = await storageService.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting extreme weather warnings:', error);
      return [];
    }
  }

  /**
   * ✅ Dismiss extreme weather warning
   */
  async dismissExtremeWeatherWarning(warningId: string): Promise<void> {
    try {
      const warnings = await this.getExtremeWeatherWarnings();
      const updatedWarnings = warnings.map(w => 
        w.id === warningId ? { ...w, dismissed: true } : w
      );
      
      await storageService.setItem(this.STORAGE_KEY, JSON.stringify(updatedWarnings));
      
      // Clear current warning state
      await storageService.removeItem('current_extreme_weather_warning');
      
      console.log(`🌪️ Dismissed extreme weather warning: ${warningId}`);
      
    } catch (error) {
      console.error('Error dismissing extreme weather warning:', error);
    }
  }

  /**
   * ✅ Lấy current extreme weather warning cho UI
   */
  async getCurrentExtremeWeatherWarning(): Promise<{
    hasWarning: boolean;
    warningMessage: string;
    timestamp: string;
  } | null> {
    try {
      const data = await storageService.getItem('current_extreme_weather_warning');
      if (!data) return null;
      
      const warning = JSON.parse(data);
      
      // Check if warning is still fresh (trong vòng 12 giờ)
      const warningTime = new Date(warning.timestamp);
      const now = new Date();
      const hoursDiff = differenceInMinutes(now, warningTime) / 60;
      
      if (hoursDiff > 12) {
        // Warning đã cũ, xóa đi
        await storageService.removeItem('current_extreme_weather_warning');
        return null;
      }
      
      return warning;
      
    } catch (error) {
      console.error('Error getting current extreme weather warning:', error);
      return null;
    }
  }

  /**
   * ✅ Cancel tất cả extreme weather checks
   */
  async cancelAllExtremeWeatherChecks(): Promise<void> {
    try {
      // ✅ Sử dụng method đúng từ notificationScheduler
      const allNotifications = await notificationScheduler.getAllScheduledNotifications();
      const extremeWeatherChecks = allNotifications.filter((n: any) =>
        n.identifier?.startsWith('extreme_weather_') ||
        n.identifier?.includes('extreme_weather_')
      );

      // ✅ Import Notifications để cancel trực tiếp
      const { Notifications } = await import('expo-notifications');

      for (const notification of extremeWeatherChecks) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log(`🌪️ Cancelled extreme weather: ${notification.identifier}`);
        } catch (cancelError) {
          console.log(`🌪️ Failed to cancel: ${notification.identifier}`, cancelError);
        }
      }

      console.log(`🌪️ Cancelled ${extremeWeatherChecks.length} extreme weather checks`);

    } catch (error) {
      console.error('Error cancelling extreme weather checks:', error);
    }
  }
}

export const extremeWeatherService = new ExtremeWeatherService();
