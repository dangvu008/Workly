/**
 * ReminderSync Service - Quản lý logic "just-in-time" cho thông báo
 * 
 * Logic chuẩn:
 * - Chỉ lên lịch cho lần nhắc nhở tiếp theo của mỗi loại
 * - Tự động re-sync sau khi trigger hoặc user action
 * - Đảm bảo không có thông báo trùng lặp
 */

import { Shift } from '../types';
import { storageService } from './storage';
import { notificationService } from './notifications';
import { alarmService } from './alarmService';
import { timeSyncService } from './timeSync';
import { addMinutes, subMinutes, isAfter, isBefore, startOfDay, addDays, format } from 'date-fns';

interface NextReminder {
  type: 'departure' | 'checkin' | 'checkout';
  date: Date;
  triggerTime: Date;
  shiftId: string;
  shiftName: string;
}

class ReminderSyncService {
  private isInitialized = false;
  private currentActiveShift: Shift | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🔄 ReminderSync: Initializing...');
    this.isInitialized = true;
  }

  /**
   * ✅ HÀM TRUNG TÂM: Đồng bộ và lên lịch cho các nhắc nhở tiếp theo
   * Đây là hàm duy nhất chịu trách nhiệm quản lý tất cả logic lên lịch
   */
  async syncNextReminders(activeShift?: Shift): Promise<void> {
    try {
      await this.initialize();

      const now = new Date();
      console.log('🔄 ReminderSync: Starting sync next reminders...');
      console.log(`⏰ Current time: ${now.toLocaleString('vi-VN')}`);
      console.log(`📅 Current day: ${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][now.getDay()]}`);

      // Debug: Hiển thị thông tin về việc áp dụng ca mới
      if (activeShift) {
        console.log(`🏢 Applying new shift: ${activeShift.name}`);
        console.log(`📋 Shift schedule: ${activeShift.departureTime} → ${activeShift.startTime} → ${activeShift.officeEndTime}`);
        console.log(`📅 Work days: ${activeShift.workDays.map(d => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d]).join(', ')}`);
      }

      // Lấy active shift nếu không được truyền vào
      if (!activeShift) {
        const activeShiftId = await storageService.getActiveShiftId();
        if (!activeShiftId) {
          console.log('ℹ️ ReminderSync: No active shift, skipping sync');
          return;
        }
        
        const shifts = await storageService.getShiftList();
        activeShift = shifts.find(s => s.id === activeShiftId) || undefined;
        
        if (!activeShift) {
          console.log('⚠️ ReminderSync: Active shift not found, skipping sync');
          return;
        }
      }

      this.currentActiveShift = activeShift;
      console.log(`🔄 ReminderSync: Syncing reminders for shift: ${activeShift.name}`);

      // BƯỚC A: DỌN DẸP - Hủy tất cả thông báo ca làm việc cũ
      await this.cleanupOldReminders();

      // BƯỚC B: TÌM VÀ LÊN LỊCH "CHUẨN BỊ ĐI LÀM" TIẾP THEO
      const nextDeparture = await this.findNextDepartureReminder(activeShift);
      if (nextDeparture) {
        await this.scheduleReminder(nextDeparture);
      }

      // BƯỚC C: TÌM VÀ LÊN LỊCH "CHẤM CÔNG VÀO" TIẾP THEO  
      const nextCheckin = await this.findNextCheckinReminder(activeShift);
      if (nextCheckin) {
        await this.scheduleReminder(nextCheckin);
      }

      // BƯỚC D: TÌM VÀ LÊN LỊCH "CHẤM CÔNG RA" TIẾP THEO
      const nextCheckout = await this.findNextCheckoutReminder(activeShift);
      if (nextCheckout) {
        await this.scheduleReminder(nextCheckout);
      }

      console.log('✅ ReminderSync: Sync completed successfully');
    } catch (error) {
      console.error('❌ ReminderSync: Error syncing reminders:', error);
      throw error;
    }
  }

  /**
   * BƯỚC 1: Dọn dẹp tất cả thông báo ca làm việc cũ
   * Hủy bỏ toàn bộ lịch trình cũ theo pattern ID để đảm bảo không có thông báo "mồ côi" nào tồn tại
   */
  private async cleanupOldReminders(): Promise<void> {
    console.log('🧹 ReminderSync: Cleaning up old reminders...');

    try {
      // Hủy tất cả notifications theo pattern ID
      console.log('📱 ReminderSync: Cancelling all shift notifications by pattern...');
      await this.cancelNotificationsByPattern(['departure-', 'checkin-', 'checkout-']);

      // Hủy tất cả alarms theo pattern ID
      console.log('🔔 ReminderSync: Cancelling all shift alarms by pattern...');
      await this.cancelAlarmsByPattern(['departure-', 'checkin-', 'checkout-']);

      console.log('✅ ReminderSync: Cleanup completed successfully');
    } catch (error) {
      console.error('❌ ReminderSync: Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Hủy notifications theo pattern ID
   */
  private async cancelNotificationsByPattern(patterns: string[]): Promise<void> {
    try {
      // Sử dụng method mới trong notificationService để hủy theo pattern
      for (const pattern of patterns) {
        await notificationService.cancelNotificationsByPattern(pattern);
      }
    } catch (error) {
      console.error('❌ ReminderSync: Error cancelling notifications by pattern:', error);
      // Fallback: sử dụng method cũ
      await notificationService.cancelAllShiftReminders();
    }
  }

  /**
   * Hủy alarms theo pattern ID
   */
  private async cancelAlarmsByPattern(patterns: string[]): Promise<void> {
    try {
      // Sử dụng method mới trong alarmService để hủy theo pattern
      for (const pattern of patterns) {
        await alarmService.cancelAlarmsByPattern(pattern);
      }
    } catch (error) {
      console.error('❌ ReminderSync: Error cancelling alarms by pattern:', error);
      // Fallback: sử dụng method cũ
      await alarmService.cancelShiftReminders();
    }
  }

  /**
   * BƯỚC B: Tìm và lên lịch "CHUẨN BỊ ĐI LÀM" tiếp theo
   */
  private async findNextDepartureReminder(shift: Shift): Promise<NextReminder | null> {
    const now = new Date();
    const today = startOfDay(now);

    console.log(`🔍 ReminderSync: Finding next departure reminder for shift: ${shift.name}`);

    // ✅ LOGIC CHUẨN: Tìm kiếm trong 14 ngày tới, bắt đầu từ hôm nay
    for (let i = 0; i < 14; i++) {
      const targetDate = addDays(today, i);
      const dayOfWeek = targetDate.getDay();

      // Kiểm tra có phải ngày làm việc không
      if (!shift.workDays.includes(dayOfWeek)) {
        console.log(`⏭️ ReminderSync: Skipping ${format(targetDate, 'dd/MM/yyyy')} - not a work day`);
        continue;
      }

      // ✅ BÁOTHỨC THỰC SỰ: Departure reminder trigger 30 phút trước departure time
      // Giống như báo thức điện thoại - nhắc nhở trước khi cần hành động
      const [depHour, depMin] = shift.departureTime.split(':').map(Number);
      const triggerTime = new Date(targetDate);
      triggerTime.setHours(depHour, depMin - 30, 0, 0); // 30 phút trước departure

      // ✅ KHÔNG CẦN điều chỉnh ngày cho departure time
      // Departure time luôn diễn ra trong cùng ngày với targetDate

      // ✅ LOGIC CHUẨN: Kiểm tra thời gian - PHẢI LÀ TƯƠNG LAI
      const timeDiff = triggerTime.getTime() - now.getTime();
      const maxFutureTime = 7 * 24 * 60 * 60 * 1000; // 7 ngày

      console.log(`🔍 ReminderSync: Departure check for ${format(targetDate, 'dd/MM/yyyy')}`);
      console.log(`   ⏰ Trigger: ${triggerTime.toLocaleString('vi-VN')}`);
      console.log(`   🕐 Now: ${now.toLocaleString('vi-VN')}`);
      console.log(`   📊 Diff: ${Math.round(timeDiff / 1000 / 60)} minutes`);

      if (triggerTime <= now) {
        console.log(`   ⏭️ SKIPPED: Already passed - will check next day`);
        continue;
      }

      if (timeDiff > maxFutureTime) {
        console.log(`   ⏭️ SKIPPED: Too far in future (${Math.round(timeDiff / 1000 / 60 / 60 / 24)} days)`);
        continue;
      }

      // Kiểm tra user đã thực hiện action "đi làm" chưa
      const dateString = format(targetDate, 'yyyy-MM-dd');
      const dayLogs = await storageService.getAttendanceLogsForDate(dateString);
      const hasGoWork = dayLogs.some(log => log.type === 'go_work');

      if (hasGoWork) {
        console.log(`   ⏭️ SKIPPED: User already went to work on ${dateString}`);
        continue;
      }

      // ✅ FOUND: Tìm thấy reminder tiếp theo hợp lệ
      console.log(`   ✅ FOUND: Next departure reminder for ${dateString} at ${triggerTime.toLocaleTimeString('vi-VN')}`);
      return {
        type: 'departure',
        date: targetDate,
        triggerTime,
        shiftId: shift.id,
        shiftName: shift.name
      };
    }

    console.log('ℹ️ ReminderSync: No next departure reminder found in 14 days');
    return null;
  }

  /**
   * BƯỚC C: Tìm và lên lịch "CHẤM CÔNG VÀO" tiếp theo
   */
  private async findNextCheckinReminder(shift: Shift): Promise<NextReminder | null> {
    const now = new Date();
    const today = startOfDay(now);

    for (let i = 0; i < 14; i++) {
      const targetDate = addDays(today, i);
      const dayOfWeek = targetDate.getDay();

      if (!shift.workDays.includes(dayOfWeek)) {
        continue;
      }

      // ✅ BÁOTHỨC THỰC SỰ: Checkin reminder với buffer time thông minh
      // Sử dụng remindBeforeStart từ shift settings (thường là 5-10 phút)
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const triggerTime = new Date(targetDate);
      const bufferMinutes = Math.max(5, shift.remindBeforeStart || 5); // Tối thiểu 5 phút
      triggerTime.setHours(startHour, startMin - bufferMinutes, 0, 0);

      // ✅ KHÔNG CẦN điều chỉnh ngày cho start time
      // Start time luôn diễn ra trong cùng ngày với targetDate

      // ✅ BÁOTHỨC THỰC SỰ: Kiểm tra thời gian hợp lý
      const timeDiff = triggerTime.getTime() - now.getTime();
      const maxFutureTime = 7 * 24 * 60 * 60 * 1000; // 7 ngày

      console.log(`🔍 ReminderSync: Checkin check - Now: ${now.toLocaleString()}, Trigger: ${triggerTime.toLocaleString()}, Diff: ${Math.round(timeDiff / 1000 / 60)} minutes`);

      if (triggerTime <= now) {
        console.log(`⏭️ ReminderSync: Skipping checkin reminder - already passed (${triggerTime.toLocaleString()})`);
        continue;
      }

      if (timeDiff > maxFutureTime) {
        console.log(`⏭️ ReminderSync: Skipping checkin reminder - too far in future (${Math.round(timeDiff / 1000 / 60 / 60 / 24)} days)`);
        continue;
      }

      // Kiểm tra user đã check-in chưa
      const dateString = format(targetDate, 'yyyy-MM-dd');
      const dayLogs = await storageService.getAttendanceLogsForDate(dateString);
      const hasCheckIn = dayLogs.some(log => log.type === 'check_in');

      if (hasCheckIn) {
        continue;
      }

      return {
        type: 'checkin',
        date: targetDate,
        triggerTime,
        shiftId: shift.id,
        shiftName: shift.name
      };
    }

    console.log('ℹ️ ReminderSync: No next checkin reminder found');
    return null;
  }

  /**
   * BƯỚC D: Tìm và lên lịch "CHẤM CÔNG RA" tiếp theo
   */
  private async findNextCheckoutReminder(shift: Shift): Promise<NextReminder | null> {
    const now = new Date();
    const today = startOfDay(now);

    for (let i = 0; i < 14; i++) {
      const targetDate = addDays(today, i);
      const dayOfWeek = targetDate.getDay();

      if (!shift.workDays.includes(dayOfWeek)) {
        continue;
      }

      // ✅ BÁOTHỨC THỰC SỰ: Checkout reminder với buffer time hợp lý
      // Sử dụng remindAfterEnd từ shift settings (thường là 5-15 phút sau end time)
      const [endHour, endMin] = shift.officeEndTime.split(':').map(Number);
      const triggerTime = new Date(targetDate);
      const bufferMinutes = Math.max(5, shift.remindAfterEnd || 10); // Tối thiểu 5 phút, mặc định 10 phút
      triggerTime.setHours(endHour, endMin + bufferMinutes, 0, 0);

      // Xử lý ca đêm
      if (shift.isNightShift && endHour < 12) {
        triggerTime.setDate(triggerTime.getDate() + 1);
      }

      // ✅ BÁOTHỨC THỰC SỰ: Kiểm tra thời gian hợp lý
      const timeDiff = triggerTime.getTime() - now.getTime();
      const maxFutureTime = 7 * 24 * 60 * 60 * 1000; // 7 ngày

      console.log(`🔍 ReminderSync: Checkout check - Now: ${now.toLocaleString()}, Trigger: ${triggerTime.toLocaleString()}, Diff: ${Math.round(timeDiff / 1000 / 60)} minutes`);

      if (triggerTime <= now) {
        console.log(`⏭️ ReminderSync: Skipping checkout reminder - already passed (${triggerTime.toLocaleString()})`);
        continue;
      }

      if (timeDiff > maxFutureTime) {
        console.log(`⏭️ ReminderSync: Skipping checkout reminder - too far in future (${Math.round(timeDiff / 1000 / 60 / 60 / 24)} days)`);
        continue;
      }

      // Kiểm tra user đã check-out chưa
      const dateString = format(targetDate, 'yyyy-MM-dd');
      const dayLogs = await storageService.getAttendanceLogsForDate(dateString);
      const hasCheckOut = dayLogs.some(log => log.type === 'check_out');

      if (hasCheckOut) {
        continue;
      }

      return {
        type: 'checkout',
        date: targetDate,
        triggerTime,
        shiftId: shift.id,
        shiftName: shift.name
      };
    }

    console.log('ℹ️ ReminderSync: No next checkout reminder found');
    return null;
  }

  /**
   * Lên lịch một reminder cụ thể với ID có quy tắc
   * ID format: type-YYYYMMDD (ví dụ: departure-20250623, checkin-20250623, checkout-20250623)
   */
  private async scheduleReminder(reminder: NextReminder): Promise<void> {
    const dateString = format(reminder.date, 'yyyy-MM-dd');
    const dateId = format(reminder.date, 'yyyyMMdd'); // Format cho ID: 20250623
    const identifier = `${reminder.type}-${dateId}`; // departure-20250623

    console.log(`📅 ReminderSync: Scheduling ${reminder.type} reminder for ${dateString} at ${reminder.triggerTime.toLocaleTimeString()}`);
    console.log(`🆔 ReminderSync: Using identifier: ${identifier}`);

    // Lên lịch cho cả NotificationService và AlarmService
    await Promise.all([
      this.scheduleNotification(reminder, identifier),
      this.scheduleAlarm(reminder, identifier)
    ]);
  }

  /**
   * Lên lịch notification với ID có quy tắc
   */
  private async scheduleNotification(reminder: NextReminder, identifier: string): Promise<void> {
    try {
      if (!this.currentActiveShift) {
        console.log('⚠️ ReminderSync: No active shift for notification scheduling');
        return;
      }

      // Sử dụng method mới với ID có quy tắc
      await notificationService.scheduleReminderWithId(
        identifier,
        reminder.type,
        this.currentActiveShift,
        reminder.triggerTime,
        format(reminder.date, 'yyyy-MM-dd')
      );

      console.log(`📱 ReminderSync: Scheduled notification ${identifier}`);
    } catch (error) {
      console.error(`❌ ReminderSync: Error scheduling notification ${identifier}:`, error);
      // Fallback: sử dụng method cũ với kiểm tra thời gian bổ sung
      try {
        // ✅ SAFETY CHECK: Kiểm tra lại thời gian trước khi fallback
        const now = new Date();
        if (reminder.triggerTime <= now) {
          console.log(`⏭️ ReminderSync: SKIPPED fallback notification for ${reminder.type} - trigger time is in the past`);
          return;
        }

        // ✅ SAFETY CHECK: Đảm bảo có active shift
        if (!this.currentActiveShift) {
          console.log(`⏭️ ReminderSync: SKIPPED fallback notification for ${reminder.type} - no active shift`);
          return;
        }

        await notificationService.scheduleSpecificReminder(
          reminder.type,
          this.currentActiveShift,
          reminder.triggerTime,
          format(reminder.date, 'yyyy-MM-dd')
        );
        console.log(`📱 ReminderSync: Fallback scheduled notification for ${reminder.type}`);
      } catch (fallbackError) {
        console.error(`❌ ReminderSync: Fallback notification scheduling failed:`, fallbackError);
      }
    }
  }

  /**
   * Lên lịch alarm với ID có quy tắc
   */
  private async scheduleAlarm(reminder: NextReminder, identifier: string): Promise<void> {
    try {
      if (!this.currentActiveShift) {
        console.log('⚠️ ReminderSync: No active shift for alarm scheduling');
        return;
      }

      // Sử dụng method mới với ID có quy tắc
      await alarmService.scheduleAlarmWithId(
        identifier,
        reminder.type,
        this.currentActiveShift,
        reminder.triggerTime,
        format(reminder.date, 'yyyy-MM-dd')
      );

      console.log(`🔔 ReminderSync: Scheduled alarm ${identifier}`);
    } catch (error) {
      console.error(`❌ ReminderSync: Error scheduling alarm ${identifier}:`, error);
      // Fallback: sử dụng method cũ với kiểm tra thời gian bổ sung
      try {
        // ✅ SAFETY CHECK: Kiểm tra lại thời gian trước khi fallback
        const now = new Date();
        if (reminder.triggerTime <= now) {
          console.log(`⏭️ ReminderSync: SKIPPED fallback alarm for ${reminder.type} - trigger time is in the past`);
          return;
        }

        // ✅ SAFETY CHECK: Đảm bảo có active shift
        if (!this.currentActiveShift) {
          console.log(`⏭️ ReminderSync: SKIPPED fallback alarm for ${reminder.type} - no active shift`);
          return;
        }

        await alarmService.scheduleSpecificAlarm(
          reminder.type,
          this.currentActiveShift,
          reminder.triggerTime,
          format(reminder.date, 'yyyy-MM-dd')
        );
        console.log(`🔔 ReminderSync: Fallback scheduled alarm for ${reminder.type}`);
      } catch (fallbackError) {
        console.error(`❌ ReminderSync: Fallback alarm scheduling failed:`, fallbackError);
      }
    }
  }

  /**
   * ✅ BÁOTHỨC THỰC SỰ: Kiểm tra thời gian phù hợp cho reminder cụ thể
   * Sử dụng logic kiểm tra thời gian chính xác như báo thức trên điện thoại
   */
  async isAppropriateTimeForSpecificReminder(
    reminderType: 'departure' | 'checkin' | 'checkout',
    shiftId: string,
    targetDate?: Date
  ): Promise<boolean> {
    try {
      const shifts = await storageService.getShiftList();
      const shift = shifts.find((s: Shift) => s.id === shiftId);

      if (!shift) {
        console.log(`⚠️ ReminderSync: Không tìm thấy ca làm việc ${shiftId}`);
        return false;
      }

      // Sử dụng logic kiểm tra thời gian cụ thể cho từng loại reminder
      const { timeSyncService } = await import('./timeSync');
      const isAppropriate = timeSyncService.isAppropriateTimeForSpecificReminder(
        shift,
        reminderType,
        targetDate
      );

      console.log(`⏰ ReminderSync: ${reminderType} reminder appropriate time check: ${isAppropriate}`);
      return isAppropriate;
    } catch (error) {
      console.error('❌ ReminderSync: Lỗi kiểm tra thời gian phù hợp:', error);
      return false; // Không hiển thị nếu có lỗi để tránh spam
    }
  }

  /**
   * Gọi sau khi một reminder được trigger hoặc user thực hiện action
   */
  async onReminderTriggeredOrCancelled(): Promise<void> {
    console.log('🔄 ReminderSync: Reminder triggered/cancelled, re-syncing...');

    // ✅ CRITICAL FIX: Luôn lấy active shift mới nhất từ storage
    // Không dựa vào this.currentActiveShift có thể đã cũ hoặc null
    let activeShift: Shift | undefined = this.currentActiveShift || undefined;

    if (!activeShift) {
      console.log('⚠️ ReminderSync: No cached active shift, fetching from storage...');
      const activeShiftId = await storageService.getActiveShiftId();
      if (activeShiftId) {
        const shifts = await storageService.getShiftList();
        activeShift = shifts.find(s => s.id === activeShiftId);

        if (activeShift) {
          console.log(`✅ ReminderSync: Found active shift from storage: ${activeShift.name}`);
        } else {
          console.log('⚠️ ReminderSync: Active shift ID found but shift not in list');
        }
      } else {
        console.log('⚠️ ReminderSync: No active shift ID in storage');
      }
    }

    // ✅ ADDITIONAL SAFETY: Thêm delay nhỏ để đảm bảo UI đã hoàn tất
    console.log('⏳ ReminderSync: Adding safety delay before sync...');
    await new Promise(resolve => setTimeout(resolve, 500));

    await this.syncNextReminders(activeShift);
  }

  /**
   * ✅ FORCE RESET: Dành cho khi user áp dụng ca mới
   * CHỈ dọn dẹp, KHÔNG lên lịch ngay lập tức để tránh "cơn bão" thông báo
   */
  async forceResetForNewShift(newShift: Shift): Promise<void> {
    try {
      console.log('🔄 ReminderSync: FORCE RESET for new shift application');
      console.log(`🏢 New shift: ${newShift.name}`);
      console.log(`⏰ Current time: ${new Date().toLocaleString('vi-VN')}`);

      // BƯỚC 1: Dọn dẹp hoàn toàn
      console.log('🧹 Step 1: Complete cleanup of all old reminders...');
      await this.cleanupOldReminders();

      // BƯỚC 2: Đợi một chút để đảm bảo cleanup hoàn tất
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ✅ CRITICAL FIX: KHÔNG gọi syncNextReminders ngay lập tức
      // Thay vào đó, lên lịch sync sau 5 phút để tránh thông báo ngay lập tức
      console.log('⏳ Step 2: Scheduling delayed sync to avoid immediate notifications...');
      setTimeout(async () => {
        try {
          console.log('📅 ReminderSync: Starting delayed sync after force reset...');
          await this.syncNextReminders(newShift);
          console.log('✅ ReminderSync: Delayed sync completed');
        } catch (delayedError) {
          console.error('❌ ReminderSync: Error in delayed sync:', delayedError);
        }
      }, 300000); // 5 phút delay

      console.log('✅ ReminderSync: Force reset completed - NO immediate sync, NO immediate notifications');
    } catch (error) {
      console.error('❌ ReminderSync: Error during force reset:', error);
      throw error;
    }
  }

  /**
   * ✅ IMMEDIATE SYNC: Chỉ dùng khi thực sự cần thiết (ví dụ: user test hoặc debug)
   * CẢNH BÁO: Có thể gây thông báo ngay lập tức nếu không cẩn thận
   */
  async forceSyncImmediately(activeShift: Shift, reason: string): Promise<void> {
    try {
      console.log(`🚨 ReminderSync: IMMEDIATE SYNC requested - Reason: ${reason}`);
      console.log(`⚠️ WARNING: This may cause immediate notifications if not used carefully`);

      await this.syncNextReminders(activeShift);

      console.log(`✅ ReminderSync: Immediate sync completed for reason: ${reason}`);
    } catch (error) {
      console.error('❌ ReminderSync: Error during immediate sync:', error);
      throw error;
    }
  }

  /**
   * ✅ IMMEDIATE SYNC: Chỉ dùng khi thực sự cần thiết (ví dụ: user test hoặc debug)
   * CẢNH BÁO: Có thể gây thông báo ngay lập tức nếu không cẩn thận
   */
  async forceSyncImmediately(activeShift: Shift, reason: string): Promise<void> {
    try {
      console.log(`🚨 ReminderSync: IMMEDIATE SYNC requested - Reason: ${reason}`);
      console.log(`⚠️ WARNING: This may cause immediate notifications if not used carefully`);

      await this.syncNextReminders(activeShift);

      console.log(`✅ ReminderSync: Immediate sync completed for reason: ${reason}`);
    } catch (error) {
      console.error('❌ ReminderSync: Error during immediate sync:', error);
      throw error;
    }
  }
}

export const reminderSyncService = new ReminderSyncService();
