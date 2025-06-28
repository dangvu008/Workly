/**
 * Auto Check-in Service - Tự động chấm công dựa trên vị trí
 */

import { Alert } from 'react-native';
import { locationService } from './locationService';
import { workManager } from './workManager';
import { storageService } from './storage';
import { notificationService } from './notifications';
import { alarmService } from './alarmService';
import { format } from 'date-fns';
import { t } from '../i18n';
import { isExpoGo } from '../utils/expoGoCompat';

interface AutoCheckInState {
  isEnabled: boolean;
  lastCheckInDate: string | null;
  lastCheckInTime: string | null;
  pendingCheckIn: boolean;
}

class AutoCheckInService {
  private state: AutoCheckInState = {
    isEnabled: false,
    lastCheckInDate: null,
    lastCheckInTime: null,
    pendingCheckIn: false,
  };

  private locationUnsubscribe: (() => void) | null = null;
  private isInitialized = false;

  /**
   * ✅ Khởi tạo service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      console.log('🎯 AutoCheckInService: Initializing...');

      const settings = await storageService.getUserSettings();
      this.state.isEnabled = settings.autoCheckInEnabled && settings.locationTrackingEnabled;

      if (!this.state.isEnabled) {
        console.log('⚠️ Auto check-in disabled in settings');
        return;
      }

      if (!settings.workLocation) {
        console.log('⚠️ Work location not configured');
        return;
      }

      // Đăng ký lắng nghe thay đổi vị trí
      this.locationUnsubscribe = locationService.onLocationUpdate(async (status) => {
        await this.handleLocationUpdate(status);
      });

      // Bắt đầu tracking location
      await locationService.startLocationTracking();

      this.isInitialized = true;
      console.log('✅ AutoCheckInService: Initialized successfully');
    } catch (error) {
      console.error('❌ AutoCheckInService: Error initializing:', error);
    }
  }

  /**
   * ✅ Xử lý khi có cập nhật vị trí
   */
  private async handleLocationUpdate(status: any): Promise<void> {
    try {
      if (!this.state.isEnabled || this.state.pendingCheckIn) {
        return;
      }

      const settings = await storageService.getUserSettings();
      if (!settings.autoCheckInEnabled || !settings.workLocation) {
        return;
      }

      // Kiểm tra xem có ở gần công ty không
      if (!status.isNearWork) {
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const currentTime = format(new Date(), 'HH:mm');

      // Kiểm tra đã check-in hôm nay chưa
      if (this.state.lastCheckInDate === today) {
        console.log('🎯 Already checked in today');
        return;
      }

      // Kiểm tra có ca làm việc hôm nay không
      const activeShift = await this.getActiveShiftForToday();
      if (!activeShift) {
        console.log('🎯 No active shift for today');
        return;
      }

      // Kiểm tra có trong thời gian làm việc không
      const isWorkingHours = this.isWithinWorkingHours(currentTime, activeShift);
      if (!isWorkingHours) {
        console.log('🎯 Not within working hours');
        return;
      }

      // Thực hiện auto check-in
      await this.performAutoCheckIn(activeShift, status);

    } catch (error) {
      console.error('❌ AutoCheckInService: Error handling location update:', error);
    }
  }

  /**
   * ✅ Lấy ca làm việc hiện tại cho hôm nay
   */
  private async getActiveShiftForToday(): Promise<any> {
    try {
      const activeShiftId = await storageService.getActiveShiftId();
      if (!activeShiftId) return null;

      const shifts = await storageService.getShiftList();
      return shifts.find(s => s.id === activeShiftId) || null;
    } catch (error) {
      console.error('Error getting active shift:', error);
      return null;
    }
  }

  /**
   * ✅ Kiểm tra có trong thời gian làm việc không
   */
  private isWithinWorkingHours(currentTime: string, shift: any): boolean {
    try {
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      const currentMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;

      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      const endMinutes = endHour * 60 + endMinute;

      // Cho phép check-in từ 30 phút trước giờ bắt đầu đến 2 giờ sau giờ bắt đầu
      const checkInWindowStart = startMinutes - 30;
      const checkInWindowEnd = startMinutes + 120;

      return currentMinutes >= checkInWindowStart && currentMinutes <= checkInWindowEnd;
    } catch (error) {
      console.error('Error checking working hours:', error);
      return false;
    }
  }

  /**
   * ✅ Thực hiện auto check-in
   */
  private async performAutoCheckIn(shift: any, locationStatus: any): Promise<void> {
    try {
      this.state.pendingCheckIn = true;

      const today = format(new Date(), 'yyyy-MM-dd');
      const currentTime = format(new Date(), 'HH:mm');
      const settings = await storageService.getUserSettings();
      const currentLanguage = settings.language || 'vi';

      // Kiểm tra trạng thái hiện tại
      const currentButtonState = await workManager.getCurrentButtonState(today);
      
      // Chỉ auto check-in nếu chưa bắt đầu làm việc
      if (currentButtonState.currentAction !== 'goWork') {
        console.log('🎯 Not in correct state for auto check-in');
        this.state.pendingCheckIn = false;
        return;
      }

      // Hiển thị thông báo xác nhận
      const distance = Math.round(locationStatus.distanceToWork || 0);
      const confirmMessage = t(currentLanguage, 'location.auto_checkin_confirm')
        .replace('{distance}', distance.toString())
        .replace('{location}', settings.workLocation?.name || 'Công ty');

      Alert.alert(
        t(currentLanguage, 'location.auto_checkin'),
        confirmMessage,
        [
          {
            text: t(currentLanguage, 'common.cancel'),
            style: 'cancel',
            onPress: () => {
              this.state.pendingCheckIn = false;
            }
          },
          {
            text: t(currentLanguage, 'common.confirm'),
            onPress: async () => {
              try {
                // Thực hiện check-in
                await workManager.handleButtonPress(today);
                
                // Cập nhật state
                this.state.lastCheckInDate = today;
                this.state.lastCheckInTime = currentTime;

                // Hiển thị thông báo thành công
                const successMessage = t(currentLanguage, 'location.auto_checkin_success')
                  .replace('{time}', currentTime)
                  .replace('{location}', settings.workLocation?.name || 'Công ty');

                // Gửi notification hoặc alarm
                if (isExpoGo()) {
                  await alarmService.scheduleAlarm({
                    id: `auto-checkin-${Date.now()}`,
                    title: t(currentLanguage, 'location.auto_checkin'),
                    message: successMessage,
                    scheduledTime: new Date(Date.now() + 1000), // 1 giây sau
                    type: 'shift_reminder',
                    soundEnabled: true,
                    vibrationEnabled: true,
                  });
                } else {
                  await notificationService.scheduleNotification({
                    id: `auto-checkin-${Date.now()}`,
                    title: t(currentLanguage, 'location.auto_checkin'),
                    body: successMessage,
                    trigger: { seconds: 1 },
                  });
                }

                console.log('✅ Auto check-in completed successfully');
              } catch (error) {
                console.error('❌ Error performing auto check-in:', error);
                Alert.alert(
                  t(currentLanguage, 'common.error'),
                  t(currentLanguage, 'location.auto_checkin_error')
                );
              } finally {
                this.state.pendingCheckIn = false;
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error in performAutoCheckIn:', error);
      this.state.pendingCheckIn = false;
    }
  }

  /**
   * ✅ Cập nhật settings
   */
  async updateSettings(enabled: boolean): Promise<void> {
    this.state.isEnabled = enabled;
    
    if (enabled) {
      await this.initialize();
    } else {
      this.cleanup();
    }
  }

  /**
   * ✅ Lấy trạng thái hiện tại
   */
  getState(): AutoCheckInState {
    return { ...this.state };
  }

  /**
   * ✅ Cleanup
   */
  cleanup(): void {
    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
      this.locationUnsubscribe = null;
    }
    
    this.state.pendingCheckIn = false;
    this.isInitialized = false;
    
    console.log('✅ AutoCheckInService: Cleaned up');
  }
}

export const autoCheckInService = new AutoCheckInService();
