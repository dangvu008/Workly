import { format, startOfWeek, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { storageService } from './storage';
import { DailyWorkStatus } from '../types';

/**
 * ✅ Service quản lý ngày nghỉ thông thường
 * Tự động đặt tất cả ngày Chủ Nhật là ngày nghỉ thông thường
 */
export class DayOffService {
  
  /**
   * ✅ Kiểm tra xem một ngày có phải là Chủ Nhật không
   */
  private isSunday(date: Date): boolean {
    return date.getDay() === 0;
  }

  /**
   * ✅ Tạo DailyWorkStatus cho ngày nghỉ thông thường
   */
  private createDayOffStatus(): DailyWorkStatus {
    return {
      status: 'day_off',
      appliedShiftIdForDay: undefined,
      vaoLogTime: undefined,
      raLogTime: undefined,
      standardHoursScheduled: 0,
      otHoursScheduled: 0,
      sundayHoursScheduled: 0,
      nightHoursScheduled: 0,
      totalHoursScheduled: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      isHolidayWork: false,
      isManualOverride: false, // Đây là tự động, không phải thủ công
    };
  }

  /**
   * ✅ Đặt ngày nghỉ thông thường cho một ngày cụ thể
   */
  async setDayOff(date: string): Promise<void> {
    try {
      const dayOffStatus = this.createDayOffStatus();
      await storageService.setDailyWorkStatusForDate(date, dayOffStatus);
      console.log(`✅ DayOffService: Set day off for ${date}`);
    } catch (error) {
      console.error('❌ DayOffService: Error setting day off:', error);
    }
  }

  /**
   * ✅ Đặt tất cả ngày Chủ Nhật trong tuần hiện tại là ngày nghỉ thông thường
   */
  async setCurrentWeekSundaysAsDayOff(): Promise<void> {
    try {
      const today = new Date();
      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Thứ Hai
      
      // Tìm ngày Chủ Nhật trong tuần (index 6)
      const sunday = addDays(startOfCurrentWeek, 6);
      const sundayString = format(sunday, 'yyyy-MM-dd');
      
      // Kiểm tra xem đã có status cho ngày này chưa
      const existingStatus = await storageService.getDailyWorkStatusForDate(sundayString);
      
      // Chỉ đặt làm ngày nghỉ nếu chưa có status hoặc status hiện tại là pending
      if (!existingStatus || existingStatus.status === 'pending') {
        await this.setDayOff(sundayString);
        console.log(`✅ DayOffService: Set Sunday ${sundayString} as day off`);
      } else {
        console.log(`ℹ️ DayOffService: Sunday ${sundayString} already has status: ${existingStatus.status}`);
      }
    } catch (error) {
      console.error('❌ DayOffService: Error setting current week Sundays:', error);
    }
  }

  /**
   * ✅ Đặt tất cả ngày Chủ Nhật trong khoảng thời gian là ngày nghỉ thông thường
   */
  async setSundaysAsDayOffInRange(startDate: Date, endDate: Date): Promise<void> {
    try {
      const current = new Date(startDate);
      const sundaysSet: string[] = [];
      
      while (current <= endDate) {
        if (this.isSunday(current)) {
          const dateString = format(current, 'yyyy-MM-dd');
          
          // Kiểm tra xem đã có status cho ngày này chưa
          const existingStatus = await storageService.getDailyWorkStatusForDate(dateString);
          
          // Chỉ đặt làm ngày nghỉ nếu chưa có status hoặc status hiện tại là pending
          if (!existingStatus || existingStatus.status === 'pending') {
            await this.setDayOff(dateString);
            sundaysSet.push(dateString);
          }
        }
        
        current.setDate(current.getDate() + 1);
      }
      
      console.log(`✅ DayOffService: Set ${sundaysSet.length} Sundays as day off:`, sundaysSet);
    } catch (error) {
      console.error('❌ DayOffService: Error setting Sundays in range:', error);
    }
  }

  /**
   * ✅ Đặt tất cả ngày Chủ Nhật trong tháng hiện tại là ngày nghỉ thông thường
   */
  async setCurrentMonthSundaysAsDayOff(): Promise<void> {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      await this.setSundaysAsDayOffInRange(startOfMonth, endOfMonth);
    } catch (error) {
      console.error('❌ DayOffService: Error setting current month Sundays:', error);
    }
  }

  /**
   * ✅ Kiểm tra xem một ngày có phải là ngày nghỉ thông thường không
   */
  async isDayOff(date: string): Promise<boolean> {
    try {
      const status = await storageService.getDailyWorkStatusForDate(date);
      return status?.status === 'day_off';
    } catch (error) {
      console.error('❌ DayOffService: Error checking day off:', error);
      return false;
    }
  }

  /**
   * ✅ Xóa trạng thái ngày nghỉ thông thường (chuyển về pending)
   */
  async removeDayOff(date: string): Promise<void> {
    try {
      await storageService.removeDailyWorkStatusForDate(date);
      console.log(`✅ DayOffService: Removed day off status for ${date}`);
    } catch (error) {
      console.error('❌ DayOffService: Error removing day off:', error);
    }
  }

  /**
   * ✅ Khởi tạo ngày nghỉ thông thường cho ứng dụng
   * Gọi khi ứng dụng khởi động để đảm bảo tất cả Chủ Nhật được đặt làm ngày nghỉ
   */
  async initializeDayOffs(): Promise<void> {
    try {
      console.log('🔄 DayOffService: Initializing day offs...');
      
      // Đặt Chủ Nhật tuần hiện tại
      await this.setCurrentWeekSundaysAsDayOff();
      
      // Đặt tất cả Chủ Nhật trong tháng hiện tại
      await this.setCurrentMonthSundaysAsDayOff();
      
      console.log('✅ DayOffService: Day offs initialization completed');
    } catch (error) {
      console.error('❌ DayOffService: Error initializing day offs:', error);
    }
  }
}

/**
 * ✅ Instance singleton của DayOffService
 */
export const dayOffService = new DayOffService();
