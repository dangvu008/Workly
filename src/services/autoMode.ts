import { Shift, AttendanceLog } from '../types';
import { storageService } from './storage';

/**
 * 🤖 AutoModeService - Tự động tính công và quản lý attendance
 * 
 * Tính năng:
 * - Tự động check-in/check-out dựa trên lịch ca
 * - Tắt notifications khi ở auto mode
 * - Tự động tính toán attendance logs
 * - Phát hiện pattern sử dụng để suggest auto mode
 */
class AutoModeService {
  private isAutoModeActive = false;
  private autoCheckInterval: NodeJS.Timeout | null = null;
  private consecutiveRapidPresses = 0;
  private lastRapidPressDate: string | null = null;
  private rapidPressDates: string[] = []; // Track dates with rapid press

  /**
   * 🚀 Khởi tạo auto mode
   */
  async initialize(): Promise<void> {
    try {
      console.log('🤖 AutoModeService: Initializing...');

      const settings = await storageService.getUserSettings();
      this.isAutoModeActive = settings.multiButtonMode === 'auto';

      // Load tracking data từ storage
      await this.loadTrackingData();

      if (this.isAutoModeActive) {
        await this.startAutoMode();
      }

      console.log(`✅ AutoModeService: Initialized (Auto mode: ${this.isAutoModeActive})`);
    } catch (error) {
      console.error('❌ AutoModeService: Error initializing:', error);
    }
  }

  /**
   * 🎯 Bắt đầu auto mode
   */
  async startAutoMode(): Promise<void> {
    try {
      console.log('🤖 AutoModeService: Starting auto mode...');
      
      this.isAutoModeActive = true;
      
      // Tắt tất cả notifications/reminders
      await this.disableNotifications();
      
      // Bắt đầu auto check cycle
      await this.startAutoCheckCycle();
      
      console.log('✅ AutoModeService: Auto mode started');
    } catch (error) {
      console.error('❌ AutoModeService: Error starting auto mode:', error);
    }
  }

  /**
   * 🛑 Dừng auto mode
   */
  async stopAutoMode(): Promise<void> {
    try {
      console.log('🤖 AutoModeService: Stopping auto mode...');
      
      this.isAutoModeActive = false;
      
      // Bật lại notifications
      await this.enableNotifications();
      
      // Dừng auto check cycle
      this.stopAutoCheckCycle();
      
      console.log('✅ AutoModeService: Auto mode stopped');
    } catch (error) {
      console.error('❌ AutoModeService: Error stopping auto mode:', error);
    }
  }

  /**
   * 🔄 Bắt đầu chu kỳ tự động check
   */
  private async startAutoCheckCycle(): Promise<void> {
    // Check mỗi 5 phút
    this.autoCheckInterval = setInterval(async () => {
      await this.performAutoCheck();
    }, 5 * 60 * 1000);

    // Thực hiện check ngay lập tức
    await this.performAutoCheck();
  }

  /**
   * 🛑 Dừng chu kỳ tự động check
   */
  private stopAutoCheckCycle(): void {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
    }
  }

  /**
   * ✅ Thực hiện auto check
   */
  private async performAutoCheck(): Promise<void> {
    try {
      const activeShift = await storageService.getActiveShift();
      if (!activeShift) {
        console.log('🤖 AutoModeService: No active shift, skipping auto check');
        return;
      }

      const now = new Date();
      const todayLogs = await this.getTodayLogs();
      
      // Kiểm tra xem có cần auto check-in không
      if (this.shouldAutoCheckIn(activeShift, now, todayLogs)) {
        await this.performAutoCheckIn(activeShift);
      }
      
      // Kiểm tra xem có cần auto check-out không
      if (this.shouldAutoCheckOut(activeShift, now, todayLogs)) {
        await this.performAutoCheckOut(activeShift);
      }

    } catch (error) {
      console.error('❌ AutoModeService: Error in auto check:', error);
    }
  }

  /**
   * 🔍 Kiểm tra có nên auto check-in không
   */
  private shouldAutoCheckIn(shift: Shift, now: Date, todayLogs: AttendanceLog[]): boolean {
    // Đã có check-in hôm nay rồi
    const hasCheckedIn = todayLogs.some(log => log.type === 'check_in');
    if (hasCheckedIn) return false;

    // Kiểm tra thời gian ca làm việc
    const shiftStart = new Date(now);
    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    shiftStart.setHours(startHour, startMinute, 0, 0);

    // Auto check-in khi đến giờ ca (hoặc muộn hơn 15 phút)
    const timeDiff = now.getTime() - shiftStart.getTime();
    return timeDiff >= 0 && timeDiff <= 15 * 60 * 1000; // 0-15 phút sau giờ bắt đầu ca
  }

  /**
   * 🔍 Kiểm tra có nên auto check-out không
   */
  private shouldAutoCheckOut(shift: Shift, now: Date, todayLogs: AttendanceLog[]): boolean {
    // Chưa check-in thì không check-out
    const hasCheckedIn = todayLogs.some(log => log.type === 'check_in');
    if (!hasCheckedIn) return false;

    // Đã check-out rồi
    const hasCheckedOut = todayLogs.some(log => log.type === 'check_out');
    if (hasCheckedOut) return false;

    // Kiểm tra thời gian kết thúc ca
    const shiftEnd = new Date(now);
    const [endHour, endMinute] = shift.endTime.split(':').map(Number);
    shiftEnd.setHours(endHour, endMinute, 0, 0);

    // Auto check-out khi hết giờ ca (hoặc muộn hơn 30 phút)
    const timeDiff = now.getTime() - shiftEnd.getTime();
    return timeDiff >= 0 && timeDiff <= 30 * 60 * 1000; // 0-30 phút sau giờ kết thúc ca
  }

  /**
   * ✅ Thực hiện auto check-in
   */
  private async performAutoCheckIn(shift: Shift): Promise<void> {
    try {
      console.log('🤖 AutoModeService: Performing auto check-in...');
      
      const now = new Date();
      const log: AttendanceLog = {
        id: `auto_checkin_${Date.now()}`,
        type: 'check_in',
        time: now.toISOString(),
        timestamp: now,
        shiftId: shift.id,
        location: 'Auto Mode',
        isAutoGenerated: true,
        note: '🤖 Tự động check-in'
      };

      const today = now.toISOString().split('T')[0];
      const todayLogs = await storageService.getAttendanceLogsForDate(today);
      todayLogs.push(log);
      await storageService.setAttendanceLogsForDate(today, todayLogs);
      
      console.log('✅ AutoModeService: Auto check-in completed');
    } catch (error) {
      console.error('❌ AutoModeService: Error in auto check-in:', error);
    }
  }

  /**
   * ✅ Thực hiện auto check-out
   */
  private async performAutoCheckOut(shift: Shift): Promise<void> {
    try {
      console.log('🤖 AutoModeService: Performing auto check-out...');
      
      const now = new Date();
      const log: AttendanceLog = {
        id: `auto_checkout_${Date.now()}`,
        type: 'check_out',
        time: now.toISOString(),
        timestamp: now,
        shiftId: shift.id,
        location: 'Auto Mode',
        isAutoGenerated: true,
        note: '🤖 Tự động check-out'
      };

      const today = now.toISOString().split('T')[0];
      const todayLogs = await storageService.getAttendanceLogsForDate(today);
      todayLogs.push(log);
      await storageService.setAttendanceLogsForDate(today, todayLogs);
      
      console.log('✅ AutoModeService: Auto check-out completed');
    } catch (error) {
      console.error('❌ AutoModeService: Error in auto check-out:', error);
    }
  }

  /**
   * 📊 Lấy logs hôm nay
   */
  private async getTodayLogs(): Promise<AttendanceLog[]> {
    const today = new Date().toISOString().split('T')[0];
    return await storageService.getAttendanceLogsForDate(today);
  }

  /**
   * 🔕 Tắt notifications
   */
  private async disableNotifications(): Promise<void> {
    try {
      // Import alarmService và tắt tất cả alarms
      const { alarmService } = await import('./alarmService');
      await alarmService.clearAllAlarms();
      
      console.log('🔕 AutoModeService: Notifications disabled');
    } catch (error) {
      console.error('❌ AutoModeService: Error disabling notifications:', error);
    }
  }

  /**
   * 🔔 Bật notifications
   */
  private async enableNotifications(): Promise<void> {
    try {
      // Import reminderSyncService và sync lại reminders
      const { reminderSyncService } = await import('./reminderSync');
      const activeShift = await storageService.getActiveShift();
      
      if (activeShift) {
        await reminderSyncService.syncNextReminders(activeShift);
      }
      
      console.log('🔔 AutoModeService: Notifications enabled');
    } catch (error) {
      console.error('❌ AutoModeService: Error enabling notifications:', error);
    }
  }

  /**
   * 📈 Theo dõi rapid press để suggest auto mode
   */
  async trackRapidPress(): Promise<void> {
    const today = new Date().toDateString();

    console.log(`📈 AutoModeService: Rapid press detected on ${today}`);

    // Nếu hôm nay chưa có rapid press thì thêm vào
    if (!this.rapidPressDates.includes(today)) {
      this.rapidPressDates.push(today);

      // Chỉ giữ lại 7 ngày gần nhất
      if (this.rapidPressDates.length > 7) {
        this.rapidPressDates = this.rapidPressDates.slice(-7);
      }

      console.log(`📈 AutoModeService: Added rapid press date. Total dates: ${this.rapidPressDates.length}`);

      // Save to storage
      await this.saveTrackingData();
    }

    this.lastRapidPressDate = today;
  }

  /**
   * 💡 Kiểm tra có nên suggest auto mode không
   * Chỉ suggest khi user bấm rapid press 2 ngày liên tục
   */
  shouldSuggestAutoMode(): boolean {
    if (this.rapidPressDates.length < 2) {
      return false;
    }

    // Kiểm tra 2 ngày gần nhất có liên tục không
    const sortedDates = this.rapidPressDates
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime()); // Sort descending (newest first)

    if (sortedDates.length < 2) {
      return false;
    }

    const today = sortedDates[0];
    const yesterday = sortedDates[1];

    // Kiểm tra có phải 2 ngày liên tục không
    const dayDiff = Math.abs(today.getTime() - yesterday.getTime()) / (1000 * 60 * 60 * 24);
    const isConsecutive = dayDiff <= 1.5; // Cho phép sai số nhỏ

    console.log(`💡 AutoModeService: Checking suggestion criteria:`, {
      rapidPressDatesCount: this.rapidPressDates.length,
      dayDiff,
      isConsecutive,
      shouldSuggest: isConsecutive
    });

    return isConsecutive;
  }

  /**
   * 🔄 Reset suggestion tracking (sau khi user đã được suggest)
   */
  async resetSuggestionTracking(): Promise<void> {
    this.rapidPressDates = [];
    this.lastRapidPressDate = null;
    await this.saveTrackingData();
    console.log('🔄 AutoModeService: Reset suggestion tracking');
  }

  /**
   * 💾 Load tracking data từ storage
   */
  private async loadTrackingData(): Promise<void> {
    try {
      const data = await storageService.getData('autoModeTracking', null);
      if (data) {
        this.rapidPressDates = (data as any).rapidPressDates || [];
        this.lastRapidPressDate = (data as any).lastRapidPressDate || null;

        // Cleanup old dates (chỉ giữ 7 ngày gần nhất)
        const now = new Date();
        this.rapidPressDates = this.rapidPressDates.filter(dateStr => {
          const date = new Date(dateStr);
          const dayDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
          return dayDiff <= 7;
        });

        console.log('📂 AutoModeService: Loaded tracking data:', {
          rapidPressDatesCount: this.rapidPressDates.length,
          lastRapidPressDate: this.lastRapidPressDate
        });
      }
    } catch (error) {
      console.error('❌ AutoModeService: Error loading tracking data:', error);
    }
  }

  /**
   * 💾 Save tracking data to storage
   */
  private async saveTrackingData(): Promise<void> {
    try {
      const data = {
        rapidPressDates: this.rapidPressDates,
        lastRapidPressDate: this.lastRapidPressDate
      };
      await storageService.saveData('autoModeTracking', data);
    } catch (error) {
      console.error('❌ AutoModeService: Error saving tracking data:', error);
    }
  }

  /**
   * 🔍 Kiểm tra auto mode có đang active không
   */
  isActive(): boolean {
    return this.isAutoModeActive;
  }

  /**
   * 🔄 Cập nhật mode
   */
  async updateMode(mode: 'full' | 'simple' | 'auto'): Promise<void> {
    if (mode === 'auto' && !this.isAutoModeActive) {
      await this.startAutoMode();
    } else if (mode !== 'auto' && this.isAutoModeActive) {
      await this.stopAutoMode();
    }
  }
}

export const autoModeService = new AutoModeService();
