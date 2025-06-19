/**
 * Work Manager Service - Quản lý logic chấm công và trạng thái làm việc
 * Xử lý tất cả logic nghiệp vụ liên quan đến chấm công, tính toán giờ làm việc
 */

import { format, parseISO, addDays, differenceInMinutes, differenceInSeconds, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { storageService } from './storage';
import { notificationScheduler } from './notificationScheduler';
import { 
  AttendanceLog, 
  ButtonState, 
  DailyWorkStatus, 
  DailyWorkStatusNew,
  Shift, 
  UserSettings,
  RapidPressDetectedException 
} from '../types';
import { BUTTON_STATES, DEFAULT_SETTINGS } from '../constants';

class WorkManager {
  /**
   * Lấy trạng thái hiện tại của nút chấm công
   */
  async getCurrentButtonState(date: string): Promise<ButtonState> {
    try {
      const settings = await storageService.getUserSettings();
      const activeShiftId = await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        console.log('🔘 WorkManager: No active shift, returning go_work');
        return 'go_work';
      }

      const logs = await storageService.getAttendanceLogsForDate(date);
      const now = new Date();
      const currentTime = format(now, 'HH:mm');

      console.log(`🔘 WorkManager: Getting button state for ${date} at ${currentTime}, logs count: ${logs.length}`);

      // Kiểm tra xem có phải ngày làm việc không
      const dayOfWeek = now.getDay();
      if (!activeShift.workDays.includes(dayOfWeek)) {
        console.log(`🔘 WorkManager: Not a work day (${dayOfWeek}), returning completed_day`);
        return 'completed_day';
      }

      // QUAN TRỌNG: Nếu không có logs sau reset, luôn trả về go_work
      if (logs.length === 0) {
        console.log('🔘 WorkManager: No logs found, returning go_work');
        return 'go_work';
      }

      // Kiểm tra auto reset logic - reset 1 giờ trước giờ khởi hành
      const isInResetWindow = this.isInResetWindow(activeShift, currentTime);
      if (isInResetWindow) {
        console.log('🔘 WorkManager: In reset window, returning go_work');
        return 'go_work';
      }

      // Kiểm tra hide logic - ẩn 2 giờ sau giờ kết thúc ca
      const shouldHide = this.shouldHideButton(activeShift, currentTime);
      console.log(`🔘 WorkManager: Hide check result: ${shouldHide} for shift ${activeShift.name} (${activeShift.endTime})`);
      if (shouldHide) {
        console.log('🔘 WorkManager: Should hide button, returning completed_day');
        return 'completed_day';
      }

      // Xác định trạng thái dựa trên logs
      const hasGoWork = logs.some(log => log.type === 'go_work');
      const hasCheckIn = logs.some(log => log.type === 'check_in');
      const hasCheckOut = logs.some(log => log.type === 'check_out');
      const hasComplete = logs.some(log => log.type === 'complete');

      console.log(`🔘 WorkManager: Logs analysis - GoWork: ${hasGoWork}, CheckIn: ${hasCheckIn}, CheckOut: ${hasCheckOut}, Complete: ${hasComplete}`);

      if (hasComplete) {
        console.log('🔘 WorkManager: Has complete log, returning completed_day');
        return 'completed_day';
      }

      if (settings.multiButtonMode === 'simple') {
        const result = hasGoWork ? 'completed_day' : 'go_work';
        console.log(`🔘 WorkManager: Simple mode, returning ${result}`);
        return result;
      }

      // Full mode logic
      if (!hasGoWork) {
        console.log('🔘 WorkManager: No go_work log, returning go_work');
        return 'go_work';
      }

      if (!hasCheckIn) {
        // Kiểm tra thời gian để quyết định awaiting hay check_in
        if (currentTime < activeShift.startTime) {
          console.log('🔘 WorkManager: Before start time, returning awaiting_check_in');
          return 'awaiting_check_in';
        }
        console.log('🔘 WorkManager: After start time, returning check_in');
        return 'check_in';
      }

      if (!hasCheckOut) {
        // ✅ Loại bỏ trạng thái working - chuyển thẳng sang check_out sau check_in
        console.log('🔘 WorkManager: Has check_in but no check_out, returning check_out');
        return 'check_out';
      }

      // ✅ Đã có check_out và complete (tự động thêm), trả về completed_day
      // Không cần kiểm tra thời gian nữa vì đã tự động complete

      // Đã hoàn tất tất cả
      console.log('🔘 WorkManager: Has complete log, returning completed_day');
      return 'completed_day';

    } catch (error) {
      console.error('Error getting current button state:', error);
      return 'go_work';
    }
  }

  /**
   * Xử lý khi người dùng bấm nút chấm công
   */
  async handleButtonPress(currentState: ButtonState): Promise<void> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();
      const settings = await storageService.getUserSettings();

      console.log(`🔘 WorkManager: Handling button press - State: ${currentState}`);

      switch (currentState) {
        case 'go_work':
          await this.addAttendanceLog(today, 'go_work', now);
          break;

        case 'awaiting_check_in':
          // Trong trạng thái awaiting, bấm nút sẽ thực hiện check_in
          await this.addAttendanceLog(today, 'check_in', now);
          break;

        case 'check_in':
          await this.addAttendanceLog(today, 'check_in', now);
          break;

        case 'check_out':
          // Tất cả các trạng thái này đều thực hiện check_out
          // Kiểm tra rapid press logic trước
          const logs = await storageService.getAttendanceLogsForDate(today);
          const checkInLog = logs.find(log => log.type === 'check_in');

          if (checkInLog && settings.multiButtonMode === 'full') {
            const checkInTime = new Date(checkInLog.time);
            const checkOutTime = new Date(now);
            const durationSeconds = differenceInSeconds(checkOutTime, checkInTime);

            if (durationSeconds < settings.rapidPressThresholdSeconds) {
              // ✅ FIX: Kiểm tra xem đã có complete log chưa để tránh trigger lại rapid press detection
              const logs = await storageService.getAttendanceLogsForDate(today);
              const hasCompleteLog = logs.some(log => log.type === 'complete');

              if (hasCompleteLog) {
                console.log('🚀 WorkManager: Complete log already exists, skipping rapid press detection');
                // Đã có complete log, không cần rapid press detection nữa
                return;
              }

              // Throw exception để UI xử lý confirmation dialog
              // Đây KHÔNG phải lỗi - đây là flow bình thường để yêu cầu xác nhận từ user
              console.log('🚀 WorkManager: Rapid press detected, throwing RapidPressDetectedException for UI confirmation');
              throw new RapidPressDetectedException(
                durationSeconds,
                settings.rapidPressThresholdSeconds,
                checkInLog.time,
                now
              );
            }
          }

          await this.addAttendanceLog(today, 'check_out', now);

          // ✅ Tự động thêm complete log ngay sau check_out để hoàn tất quy trình
          console.log('🚀 WorkManager: Auto-completing after check_out');
          await this.addAttendanceLog(today, 'complete', now);
          break;

        // ✅ Loại bỏ các case awaiting_complete và complete vì đã tự động complete sau check_out

        default:
          console.log(`🔘 WorkManager: No action for state: ${currentState}`);
          break;
      }

      // Tính toán và lưu daily work status
      await this.calculateAndSaveDailyWorkStatus(today);

      // ✅ FIX: Đảm bảo trạng thái được cập nhật ngay lập tức
      console.log('🔄 WorkManager: Force recalculating status after button press to ensure consistency');
      await this.recalculateFromAttendanceLogs(today);

    } catch (error) {
      if (error instanceof RapidPressDetectedException) {
        throw error; // Re-throw để UI xử lý
      }
      console.error('Error handling button press:', error);
      throw error;
    }
  }

  /**
   * Thêm log chấm công
   */
  private async addAttendanceLog(date: string, type: AttendanceLog['type'], time: string): Promise<void> {
    try {
      const logs = await storageService.getAttendanceLogsForDate(date);
      const newLog: AttendanceLog = { type, time };

      logs.push(newLog);
      await storageService.setAttendanceLogsForDate(date, logs);

      console.log(`📝 WorkManager: Added ${type} log at ${time}`);

      // ✅ Tự động hủy alarm tương ứng khi người dùng thực hiện hành động
      await this.cancelRelatedAlarm(type, date);

    } catch (error) {
      console.error('Error adding attendance log:', error);
      throw error;
    }
  }

  /**
   * ✅ Hủy alarm liên quan khi người dùng thực hiện hành động (tự động hủy)
   */
  private async cancelRelatedAlarm(action: AttendanceLog['type'], date: string): Promise<void> {
    try {
      const activeShiftId = await storageService.getActiveShiftId();

      if (!activeShiftId) return;

      // Map action to alarm type
      let alarmAction: 'go_work' | 'check_in' | 'punch' | 'check_out' | null = null;

      switch (action) {
        case 'go_work':
          alarmAction = 'go_work'; // Maps to 'departure-' alarm
          break;
        case 'check_in':
          alarmAction = 'check_in'; // Maps to 'checkin-' alarm
          break;
        case 'punch':
          alarmAction = 'punch'; // Maps to 'punch-' alarm
          break;
        case 'check_out':
          alarmAction = 'check_out'; // Maps to 'checkout-' alarm
          break;
        default:
          return; // Không hủy alarm cho các action khác
      }

      if (alarmAction) {
        const { alarmService } = await import('./alarmService');
        await alarmService.cancelAlarmAfterAction(alarmAction, activeShiftId, date);
        console.log(`🔕 WorkManager: Đã hủy alarm ${alarmAction} sau khi thực hiện ${action}`);
      }
    } catch (error) {
      console.error('❌ WorkManager: Lỗi hủy alarm liên quan:', error);
      // Không throw error để không ảnh hưởng đến việc ghi log chính
    }
  }

  /**
   * Tính toán và lưu daily work status
   */
  private async calculateAndSaveDailyWorkStatus(date: string): Promise<void> {
    try {
      const logs = await storageService.getAttendanceLogsForDate(date);
      const activeShiftId = await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        console.log('⚠️ WorkManager: No active shift, skipping status calculation');
        return;
      }

      const status = await this.calculateDailyWorkStatusNew(date, logs, activeShift);
      
      // Convert to old format for compatibility
      const dailyStatus: DailyWorkStatus = {
        status: status.status as any,
        vaoLogTime: status.vaoLogTime || undefined,
        raLogTime: status.raLogTime || undefined,
        standardHoursScheduled: status.standardHours,
        otHoursScheduled: status.otHours,
        sundayHoursScheduled: status.sundayHours,
        nightHoursScheduled: status.nightHours,
        totalHoursScheduled: status.totalHours,
        lateMinutes: 0, // TODO: Calculate based on logs vs schedule
        earlyMinutes: 0, // TODO: Calculate based on logs vs schedule
        isHolidayWork: status.isHolidayWork,
        isManualOverride: false
      };

      await storageService.setDailyWorkStatusForDate(date, dailyStatus);
      console.log(`💾 WorkManager: Saved daily work status for ${date}:`, status.status);

      // ✅ Debug: Log chi tiết trạng thái đã lưu
      console.log('🔍 WorkManager: Daily status details:', {
        date,
        status: status.status,
        hasCompleteLog: logs.some(log => log.type === 'complete'),
        hasCheckOutLog: logs.some(log => log.type === 'check_out'),
        totalLogs: logs.length,
        logTypes: logs.map(log => log.type),
        standardHours: status.standardHours,
        totalHours: status.totalHours
      });

    } catch (error) {
      console.error('Error calculating and saving daily work status:', error);
    }
  }

  /**
   * Tính toán trạng thái làm việc mới
   */
  async calculateDailyWorkStatusNew(date: string, logs: AttendanceLog[], shift: Shift): Promise<DailyWorkStatusNew> {
    try {
      const goWorkLog = logs.find(log => log.type === 'go_work');
      const checkInLog = logs.find(log => log.type === 'check_in');
      const checkOutLog = logs.find(log => log.type === 'check_out');
      const completeLog = logs.find(log => log.type === 'complete');

      // ✅ Xác định trạng thái dựa trên logs - Complete log có ưu tiên cao nhất
      let status: DailyWorkStatusNew['status'] = 'CHUA_DI';

      // ✅ QUAN TRỌNG: Complete log có ưu tiên cao nhất, kiểm tra đầu tiên
      if (completeLog) {
        status = 'DU_CONG';
        console.log(`🎯 WorkManager: Found complete log, setting status to DU_CONG for ${date}`);
      } else if (!goWorkLog) {
        status = 'CHUA_DI';
      } else if (!checkInLog) {
        status = 'DA_DI_CHUA_VAO';
      } else if (!checkOutLog) {
        status = 'CHUA_RA';
        console.log(`⏰ WorkManager: Missing check-out log, setting status to CHUA_RA for ${date}`);
      } else {
        // Có đủ check-in và check-out, kiểm tra thời gian
        const checkInTime = new Date(checkInLog.time);
        const checkOutTime = new Date(checkOutLog.time);
        const shiftStartTime = this.parseTimeToDate(date, shift.startTime);
        const shiftEndTime = this.parseTimeToDate(date, shift.endTime);

        // Xử lý ca đêm (endTime < startTime)
        if (shift.isNightShift && shift.endTime < shift.startTime) {
          shiftEndTime.setDate(shiftEndTime.getDate() + 1);
        }

        const isLate = checkInTime > shiftStartTime;
        const isEarly = checkOutTime < shiftEndTime;

        if (isLate && isEarly) {
          status = 'DI_MUON_VE_SOM';
        } else if (isLate) {
          status = 'DI_MUON';
        } else if (isEarly) {
          status = 'VE_SOM';
        } else {
          status = 'DU_CONG';
        }

        console.log(`📊 WorkManager: Calculated status based on timing for ${date}: ${status}`);
      }

      // Tính toán giờ làm việc
      const workHours = this.calculateWorkHours(date, logs, shift, status);

      return {
        date,
        status,
        vaoLogTime: checkInLog?.time || null,
        raLogTime: checkOutLog?.time || null,
        standardHours: workHours.standardHours,
        otHours: workHours.otHours,
        totalHours: workHours.totalHours,
        sundayHours: workHours.sundayHours,
        nightHours: workHours.nightHours,
        isHolidayWork: workHours.isHolidayWork,
        notes: ''
      };

    } catch (error) {
      console.error('Error calculating daily work status:', error);
      return {
        date,
        status: 'CHUA_DI',
        vaoLogTime: null,
        raLogTime: null,
        standardHours: 0,
        otHours: 0,
        totalHours: 0,
        sundayHours: 0,
        nightHours: 0,
        isHolidayWork: false,
        notes: ''
      };
    }
  }

  /**
   * Parse time string to Date object for specific date
   */
  private parseTimeToDate(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const dateObj = parseISO(date);
    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj;
  }

  /**
   * Tính toán giờ làm việc
   */
  private calculateWorkHours(date: string, logs: AttendanceLog[], shift: Shift, status: DailyWorkStatusNew['status']) {
    const dateObj = parseISO(date);
    const dayOfWeek = dateObj.getDay();
    const isSunday = dayOfWeek === 0;
    const isHolidayWork = false; // TODO: Check against holiday list

    // Nếu trạng thái là DU_CONG, tính theo lịch trình ca
    if (status === 'DU_CONG') {
      const standardHours = 8; // Default standard hours
      return {
        standardHours,
        otHours: 0,
        totalHours: standardHours,
        sundayHours: isSunday ? standardHours : 0,
        nightHours: shift.isNightShift ? standardHours : 0,
        isHolidayWork
      };
    }

    // ✅ FIX: Nếu trạng thái là CHUA_RA (chưa check out) nhưng đã check in
    // Tính giờ làm việc dựa trên thời gian đã làm việc cho đến hiện tại
    if (status === 'CHUA_RA') {
      const checkInLog = logs.find(log => log.type === 'check_in');
      if (checkInLog) {
        const checkInTime = new Date(checkInLog.time);
        const currentTime = new Date();
        const totalMinutes = differenceInMinutes(currentTime, checkInTime);
        const workMinutes = Math.max(0, totalMinutes - (shift.breakMinutes || 0));
        const totalHours = Math.max(0, workMinutes / 60);

        return {
          standardHours: Math.min(totalHours, 8),
          otHours: Math.max(0, totalHours - 8),
          totalHours,
          sundayHours: isSunday ? totalHours : 0,
          nightHours: shift.isNightShift ? totalHours : 0,
          isHolidayWork
        };
      }
    }

    // Các trạng thái khác tính theo thời gian thực tế (nếu có)
    const checkInLog = logs.find(log => log.type === 'check_in');
    const checkOutLog = logs.find(log => log.type === 'check_out');

    if (!checkInLog || !checkOutLog) {
      return {
        standardHours: 0,
        otHours: 0,
        totalHours: 0,
        sundayHours: 0,
        nightHours: 0,
        isHolidayWork
      };
    }

    const checkInTime = new Date(checkInLog.time);
    const checkOutTime = new Date(checkOutLog.time);
    const totalMinutes = differenceInMinutes(checkOutTime, checkInTime);
    const totalHours = Math.max(0, (totalMinutes - shift.breakMinutes) / 60);

    return {
      standardHours: Math.min(totalHours, 8),
      otHours: Math.max(0, totalHours - 8),
      totalHours,
      sundayHours: isSunday ? totalHours : 0,
      nightHours: shift.isNightShift ? totalHours : 0,
      isHolidayWork
    };
  }

  /**
   * Xử lý xác nhận "Bấm Nhanh" - tính đủ công theo lịch trình (format mới)
   */
  async calculateDailyWorkStatusWithRapidPressConfirmed(
    date: string,
    logs: AttendanceLog[],
    shift: Shift,
    checkInTime: string,
    checkOutTime: string
  ): Promise<DailyWorkStatusNew> {
    try {
      console.log('🚀 WorkManager: Processing rapid press confirmation');

      // Tính toán giờ làm việc theo lịch trình ca
      const workHours = this.calculateScheduledWorkHours(date, shift);

      const status: DailyWorkStatusNew = {
        date,
        status: 'DU_CONG',
        vaoLogTime: checkInTime,
        raLogTime: checkOutTime,
        standardHours: workHours.standardHours,
        otHours: workHours.otHours,
        totalHours: workHours.totalHours,
        sundayHours: workHours.sundayHours,
        nightHours: workHours.nightHours,
        isHolidayWork: workHours.isHolidayWork,
        notes: 'Xác nhận bấm nhanh - tính đủ công theo lịch trình'
      };

      console.log('✅ WorkManager: Rapid press confirmed status calculated:', status);
      return status;

    } catch (error) {
      console.error('Error processing rapid press confirmation:', error);
      throw error;
    }
  }

  /**
   * Tính toán giờ làm việc theo lịch trình ca (không dựa vào logs thực tế)
   */
  private calculateScheduledWorkHours(date: string, shift: Shift): {
    standardHours: number;
    otHours: number;
    totalHours: number;
    sundayHours: number;
    nightHours: number;
    isHolidayWork: boolean;
  } {
    const dateObj = parseISO(date);
    const isSunday = dateObj.getDay() === 0;

    // Tính giờ làm việc chuẩn từ ca
    const startTime = parseISO(`${date}T${shift.startTime}:00`);
    const endTime = shift.isNightShift
      ? parseISO(`${format(addDays(dateObj, 1), 'yyyy-MM-dd')}T${shift.endTime}:00`)
      : parseISO(`${date}T${shift.endTime}:00`);

    const totalMinutes = differenceInMinutes(endTime, startTime);
    const workMinutes = totalMinutes - (shift.breakMinutes || 0);
    const standardHours = Math.max(0, workMinutes / 60);

    return {
      standardHours,
      otHours: 0, // Không tính OT cho rapid press confirmation
      totalHours: standardHours,
      sundayHours: isSunday ? standardHours : 0,
      nightHours: shift.isNightShift ? standardHours : 0,
      isHolidayWork: false // TODO: Check holiday calendar
    };
  }

  /**
   * Kiểm tra xem hiện tại có trong thời gian reset window không
   */
  private isInResetWindow(shift: Shift, currentTime: string): boolean {
    try {
      // Tính toán thời gian reset (1 giờ trước departure time)
      const [depHour, depMin] = shift.departureTime.split(':').map(Number);
      let resetHour = depHour - 1;

      // Xử lý trường hợp giờ âm (ví dụ: 00:30 -> 23:30 ngày hôm trước)
      if (resetHour < 0) {
        resetHour += 24;
        // Nếu reset time là ngày hôm trước, check từ 00:00 đến departure time
        return currentTime >= '00:00' && currentTime < shift.departureTime;
      }

      const resetTime = `${resetHour.toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}`;

      // Check trong khoảng reset time đến departure time
      return currentTime >= resetTime && currentTime < shift.departureTime;

    } catch (error) {
      console.error('Error checking reset window:', error);
      return false;
    }
  }

  /**
   * Thực hiện auto reset nếu cần - được gọi từ bên ngoài
   */
  async performAutoResetIfNeeded(date: string): Promise<boolean> {
    try {
      const activeShiftId = await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        return false;
      }

      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const logs = await storageService.getAttendanceLogsForDate(date);

      // Kiểm tra xem có trong reset window và có logs cần reset không
      const isInResetWindow = this.isInResetWindow(activeShift, currentTime);

      if (isInResetWindow && logs.length > 0) {
        console.log(`🔄 WorkManager: Auto-resetting daily status for ${date} at ${currentTime}`);
        await this.resetDailyStatus(date);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error performing auto reset:', error);
      return false;
    }
  }



  /**
   * Kiểm tra xem có nên ẩn button không (2 giờ sau kết thúc ca)
   */
  private shouldHideButton(shift: Shift, currentTime: string): boolean {
    try {
      // DEBUG: Tạm thời disable hide logic để test
      const DEBUG_DISABLE_HIDE = true;
      if (DEBUG_DISABLE_HIDE) {
        console.log(`🔘 WorkManager: shouldHideButton - DEBUG MODE: Hide logic disabled for testing`);
        return false;
      }

      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      let hideHour = endHour + 2;

      console.log(`🔘 WorkManager: shouldHideButton - Shift endTime: ${shift.endTime}, Current time: ${currentTime}`);

      // Xử lý trường hợp vượt quá 24h
      if (hideHour >= 24) {
        hideHour -= 24;
        console.log(`🔘 WorkManager: shouldHideButton - Hide hour adjusted to next day: ${hideHour}:${endMin.toString().padStart(2, '0')}, returning false`);
        // Nếu hide time là ngày hôm sau, không ẩn (vì chúng ta chỉ check trong ngày)
        return false;
      }

      const hideTime = `${hideHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      const shouldHide = currentTime > hideTime;

      console.log(`🔘 WorkManager: shouldHideButton - Hide time: ${hideTime}, Current: ${currentTime}, Should hide: ${shouldHide}`);

      return shouldHide;

    } catch (error) {
      console.error('Error checking hide button:', error);
      return false;
    }
  }

  /**
   * Reset daily status - xóa logs và status cho ngày
   */
  async resetDailyStatus(date: string): Promise<void> {
    try {
      console.log(`🔄 WorkManager: Resetting daily status for ${date}`);

      // Xóa attendance logs
      await storageService.clearAttendanceLogsForDate(date);

      // Xóa daily work status - không thể set null, thay vào đó xóa khỏi storage
      const allStatus = await storageService.getDailyWorkStatus();
      delete allStatus[date];
      await storageService.setDailyWorkStatus(allStatus);

      console.log('✅ WorkManager: Daily status reset completed');

    } catch (error) {
      console.error('Error resetting daily status:', error);
      throw error;
    }
  }

  /**
   * Đặt trạng thái làm việc thủ công
   */
  async setManualWorkStatus(date: string, status: DailyWorkStatus['status'], selectedShiftId?: string): Promise<void> {
    try {
      console.log(`📝 WorkManager: Setting manual work status for ${date}: ${status}`, { selectedShiftId });

      // Sử dụng selectedShiftId nếu có, nếu không thì dùng activeShift
      const activeShiftId = selectedShiftId || await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        throw new Error('Không có ca làm việc đang hoạt động');
      }

      const dateObj = parseISO(date);
      const isSunday = dateObj.getDay() === 0;
      const standardHours = status === 'CONG_TAC' ? 8 : (status === 'DU_CONG' ? 8 : 0);

      const workStatus: DailyWorkStatus = {
        status,
        appliedShiftIdForDay: activeShiftId, // Lưu ca làm việc áp dụng cho ngày này
        vaoLogTime: undefined,
        raLogTime: undefined,
        standardHoursScheduled: standardHours,
        otHoursScheduled: 0,
        sundayHoursScheduled: isSunday ? standardHours : 0,
        nightHoursScheduled: activeShift.isNightShift ? standardHours : 0,
        totalHoursScheduled: standardHours,
        lateMinutes: 0,
        earlyMinutes: 0,
        isHolidayWork: false,
        isManualOverride: true
      };

      await storageService.setDailyWorkStatusForDate(date, workStatus);
      console.log('✅ WorkManager: Manual work status saved');

    } catch (error) {
      console.error('Error setting manual work status:', error);
      throw error;
    }
  }

  /**
   * Tính lại trạng thái từ attendance logs
   */
  async recalculateFromAttendanceLogs(date: string): Promise<void> {
    try {
      console.log(`🔄 WorkManager: Recalculating status from logs for ${date}`);

      // Lấy logs và tính lại trạng thái
      const logs = await storageService.getAttendanceLogsForDate(date);
      const activeShiftId = await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        throw new Error('Không tìm thấy ca làm việc');
      }

      // Tính toán lại trạng thái dựa trên logs
      const newStatus = await this.calculateDailyWorkStatusNew(date, logs, activeShift);

      // Convert to old format for compatibility
      const workStatus: DailyWorkStatus = {
        status: newStatus.status as any,
        vaoLogTime: newStatus.vaoLogTime || undefined,
        raLogTime: newStatus.raLogTime || undefined,
        standardHoursScheduled: newStatus.standardHours,
        otHoursScheduled: newStatus.otHours,
        sundayHoursScheduled: newStatus.sundayHours,
        nightHoursScheduled: newStatus.nightHours,
        totalHoursScheduled: newStatus.totalHours,
        lateMinutes: 0, // TODO: Calculate based on logs vs schedule
        earlyMinutes: 0, // TODO: Calculate based on logs vs schedule
        isHolidayWork: newStatus.isHolidayWork,
        isManualOverride: false // Xóa manual override flag
      };

      await storageService.setDailyWorkStatusForDate(date, workStatus);
      console.log('✅ WorkManager: Status recalculated from logs');

    } catch (error) {
      console.error('❌ WorkManager: Error recalculating from logs:', error);
      throw error;
    }
  }

  /**
   * Xóa trạng thái thủ công và tính lại từ chấm công
   */
  async clearManualStatus(date: string): Promise<void> {
    try {
      console.log(`🗑️ WorkManager: Clearing manual status for ${date}`);

      // Tính lại từ logs
      await this.recalculateFromAttendanceLogs(date);

      console.log('✅ WorkManager: Manual status cleared and recalculated');

    } catch (error) {
      console.error('❌ WorkManager: Error clearing manual status:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thời gian chấm công
   */
  async updateAttendanceTime(date: string, checkInTime: string, checkOutTime: string): Promise<void> {
    try {
      console.log(`🕐 WorkManager: Updating attendance time for ${date}`);

      // Validate times
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);

      if (checkOut <= checkIn) {
        throw new Error('Thời gian ra phải sau thời gian vào');
      }

      // Get existing status or create new one
      let status = await storageService.getDailyWorkStatusForDate(date);

      if (!status) {
        const activeShiftId = await storageService.getActiveShiftId();
        const shifts = await storageService.getShiftList();
        const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

        if (!activeShift) {
          throw new Error('Không có ca làm việc đang hoạt động');
        }

        // Create new status
        status = {
          status: 'DU_CONG' as any,
          standardHoursScheduled: 8,
          otHoursScheduled: 0,
          sundayHoursScheduled: 0,
          nightHoursScheduled: 0,
          totalHoursScheduled: 8,
          lateMinutes: 0,
          earlyMinutes: 0,
          isHolidayWork: false,
          isManualOverride: true
        };
      }

      // Update times
      status.vaoLogTime = checkInTime;
      status.raLogTime = checkOutTime;
      status.isManualOverride = true;

      await storageService.setDailyWorkStatusForDate(date, status);
      console.log('✅ WorkManager: Attendance time updated');

    } catch (error) {
      console.error('Error updating attendance time:', error);
      throw error;
    }
  }

  // ✅ Function đã được định nghĩa ở trên, xóa duplicate này

  /**
   * Xóa trạng thái thủ công và tính lại
   */
  async clearManualStatusAndRecalculate(date: string): Promise<void> {
    try {
      console.log(`🗑️ WorkManager: Clearing manual status and recalculating for ${date}`);

      // Recalculate from logs
      await this.recalculateFromAttendanceLogs(date);

      console.log('✅ WorkManager: Manual status cleared and recalculated');

    } catch (error) {
      console.error('Error clearing manual status:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra và xoay ca làm việc (shift rotation)
   */
  async checkAndRotateShifts(): Promise<void> {
    try {
      console.log('🔄 WorkManager: Checking shift rotation');

      const settings = await storageService.getUserSettings();

      if (!settings.rotationConfig || settings.changeShiftReminderMode !== 'rotate') {
        console.log('⏭️ WorkManager: Shift rotation disabled');
        return;
      }

      const { rotationShifts, rotationFrequency, rotationLastAppliedDate, currentRotationIndex } = settings.rotationConfig;

      if (!rotationShifts || rotationShifts.length === 0) {
        console.log('⚠️ WorkManager: No rotation shifts configured');
        return;
      }

      // Check if rotation is due
      const now = new Date();
      const lastApplied = rotationLastAppliedDate ? parseISO(rotationLastAppliedDate) : null;

      let shouldRotate = false;

      if (!lastApplied) {
        shouldRotate = true;
      } else {
        const daysSinceLastRotation = differenceInMinutes(now, lastApplied) / (24 * 60);

        switch (rotationFrequency) {
          case 'weekly':
            shouldRotate = daysSinceLastRotation >= 7;
            break;
          case 'biweekly':
            shouldRotate = daysSinceLastRotation >= 14;
            break;
          case 'triweekly':
            shouldRotate = daysSinceLastRotation >= 21;
            break;
          case 'monthly':
            shouldRotate = daysSinceLastRotation >= 30;
            break;
        }
      }

      if (shouldRotate) {
        const nextIndex = (currentRotationIndex + 1) % rotationShifts.length;
        const nextShiftId = rotationShifts[nextIndex];

        // Get shift names for notification
        const shifts = await storageService.getShifts();
        const oldShift = shifts.find(s => s.id === settings.activeShiftId);
        const newShift = shifts.find(s => s.id === nextShiftId);

        // Apply rotation
        await storageService.setActiveShiftId(nextShiftId);

        // Update rotation config
        const updatedConfig = {
          ...settings.rotationConfig,
          currentRotationIndex: nextIndex,
          rotationLastAppliedDate: now.toISOString()
        };

        await storageService.setUserSettings({
          ...settings,
          rotationConfig: updatedConfig
        });

        // CHỈ gửi thông báo rotation MỘT LẦN, không lập lịch thêm gì
        if (oldShift && newShift) {
          await notificationScheduler.scheduleShiftRotationNotification(oldShift.name, newShift.name);
          console.log(`✅ WorkManager: Rotated from ${oldShift?.name} to ${newShift?.name} - Notification sent`);
        }

        // KHÔNG lập lịch thông báo ở đây - để AppContext xử lý
        console.log(`✅ WorkManager: Shift rotation completed - letting AppContext handle scheduling`);
      }

    } catch (error) {
      console.error('Error checking shift rotation:', error);
    }
  }

  /**
   * Lập lịch nhắc nhở hàng tuần - CHỈ khi thực sự cần
   */
  async scheduleWeeklyReminder(): Promise<void> {
    try {
      console.log('📅 WorkManager: Checking weekly reminder...');

      const settings = await storageService.getUserSettings();

      if (settings.changeShiftReminderMode !== 'ask_weekly') {
        console.log('⏭️ WorkManager: Weekly reminder disabled');
        // ✅ Cancel existing reminders khi tắt tính năng
        await notificationScheduler.cancelWeeklyReminders();
        return;
      }

      // ✅ KIỂM TRA xem đã có weekly reminder chưa để tránh trùng lặp
      const allScheduled = await notificationScheduler.getAllScheduledNotifications();
      const existingReminders = allScheduled.filter((n: any) => n.identifier.startsWith('weekly_reminder_'));
      if (existingReminders.length > 0) {
        console.log(`📅 WorkManager: Already have ${existingReminders.length} weekly reminders, skipping`);
        return;
      }

      // Schedule reminder for end of week (Saturday evening)
      const now = new Date();
      const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const currentHour = now.getHours();

      console.log(`📅 WorkManager: Current time: ${now.toISOString()}`);
      console.log(`📅 WorkManager: Current day: ${currentDay} (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)`);
      console.log(`📅 WorkManager: Current hour: ${currentHour}`);

      // ✅ CHỈ lập lịch khi thực sự cần thiết - gần cuối tuần
      const isFridayEvening = currentDay === 5 && currentHour >= 17; // Friday 5 PM+
      const isSaturdayBeforeReminder = currentDay === 6 && currentHour < 22; // Saturday before 10 PM
      const isSaturdayAfterReminder = currentDay === 6 && currentHour >= 22; // Saturday 10 PM+

      console.log(`📅 WorkManager: Time checks - Friday evening: ${isFridayEvening}, Saturday before reminder: ${isSaturdayBeforeReminder}, Saturday after reminder: ${isSaturdayAfterReminder}`);

      // ✅ CHỈ lập lịch khi đang ở cuối tuần hoặc đã qua thời gian reminder
      const shouldSchedule = isFridayEvening || isSaturdayBeforeReminder || isSaturdayAfterReminder;

      if (!shouldSchedule) {
        console.log(`📅 WorkManager: Not end of week yet (current day: ${currentDay}), skipping weekly reminder scheduling`);
        return;
      }

      const saturday = new Date(now);
      let daysToAdd = (6 - currentDay + 7) % 7; // 6 = Saturday

      // Nếu hôm nay là Saturday, kiểm tra thời gian
      if (daysToAdd === 0) {
        // Nếu chưa đến 10 PM thì lập lịch cho hôm nay
        // Nếu đã qua 10 PM thì lập lịch cho Saturday tuần sau
        if (currentHour >= 22) {
          daysToAdd = 7; // Saturday tuần sau
        }
      }

      console.log(`📅 WorkManager: Days to add to get next Saturday: ${daysToAdd}`);

      saturday.setDate(now.getDate() + daysToAdd);
      saturday.setHours(22, 0, 0, 0); // 10 PM Saturday
      console.log(`📅 WorkManager: Calculated Saturday: ${saturday.toISOString()}`);

      // Double check: nếu thời gian tính được vẫn trong quá khứ, thêm 7 ngày
      if (saturday <= now) {
        console.log(`📅 WorkManager: Saturday is still in the past, adding 7 more days`);
        saturday.setDate(saturday.getDate() + 7); // Next Saturday
      }

      // Kiểm tra cuối cùng: chỉ lập lịch nếu thời gian hợp lý (ít nhất 1 ngày trong tương lai)
      const timeDiff = saturday.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      console.log(`📅 WorkManager: Time difference: ${timeDiff}ms (${daysDiff.toFixed(2)} days)`);

      if (daysDiff < 0.5) { // Ít nhất 12 giờ trong tương lai
        console.log(`📅 WorkManager: Reminder time too close (${daysDiff.toFixed(2)} days), adding 7 more days`);
        saturday.setDate(saturday.getDate() + 7);
      }

      console.log(`📅 WorkManager: Final Saturday reminder time: ${saturday.toISOString()}`);
      await notificationScheduler.scheduleWeeklyShiftReminder(saturday);
      console.log(`✅ WorkManager: Weekly reminder scheduled for ${saturday.toISOString()}`);

    } catch (error) {
      console.error('Error scheduling weekly reminder:', error);
    }
  }

  /**
   * Debug function để kiểm tra trạng thái hiện tại
   */
  async debugCurrentStatus(date: string): Promise<void> {
    try {
      console.log('🔍 === DEBUG CURRENT STATUS ===');
      console.log(`📅 Date: ${date}`);

      const logs = await storageService.getAttendanceLogsForDate(date);
      const status = await storageService.getDailyWorkStatusForDate(date);
      const buttonState = await this.getCurrentButtonState(date);

      console.log('📋 Attendance Logs:', logs.map(log => `${log.type} at ${format(parseISO(log.time), 'HH:mm:ss')}`));
      console.log('📊 Current Status:', status?.status || 'No status');
      console.log('🔘 Button State:', buttonState);
      console.log('⏰ Standard Hours:', status?.standardHoursScheduled || 0);
      console.log('🔍 === END DEBUG ===');

    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  }

  /**
   * Lấy thông tin hiển thị thời gian
   */
  async getTimeDisplayInfo(): Promise<any> {
    try {
      const activeShift = await storageService.getActiveShift();
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayStatus = await storageService.getDailyWorkStatusForDate(today);
      const logs = await storageService.getAttendanceLogsForDate(today);

      if (!activeShift) {
        return {
          currentTime: format(new Date(), 'HH:mm'),
          shiftInfo: null,
          workStatus: null,
          nextAction: null
        };
      }

      const now = new Date();
      const currentTime = format(now, 'HH:mm');

      return {
        currentTime,
        shiftInfo: {
          name: activeShift.name,
          startTime: activeShift.startTime,
          endTime: activeShift.endTime,
          departureTime: activeShift.departureTime
        },
        workStatus: todayStatus,
        nextAction: await this.getCurrentButtonState(today),
        logs: logs.map(log => ({
          type: log.type,
          time: format(parseISO(log.time), 'HH:mm')
        }))
      };

    } catch (error) {
      console.error('Error getting time display info:', error);
      return {
        currentTime: format(new Date(), 'HH:mm'),
        shiftInfo: null,
        workStatus: null,
        nextAction: null
      };
    }
  }
}

// Export singleton instance
export const workManager = new WorkManager();
