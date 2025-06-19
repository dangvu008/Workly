/**
 * 🔍 Debug Logger cho việc áp dụng ca và lập lịch notifications
 */

import { Shift } from '../types';

export interface DebugLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: 'shift_change' | 'notification' | 'cleanup' | 'validation' | 'timing';
  message: string;
  data?: any;
}

export class ShiftDebugLogger {
  private static logs: DebugLogEntry[] = [];
  private static maxLogs = 100;
  private static listeners: ((logs: DebugLogEntry[]) => void)[] = [];

  /**
   * Thêm log entry
   */
  static log(
    level: DebugLogEntry['level'],
    category: DebugLogEntry['category'],
    message: string,
    data?: any
  ) {
    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.unshift(entry);
    
    // Giới hạn số lượng logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console log với format đẹp
    const emoji = this.getEmoji(level, category);
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${emoji} [${timestamp}] ${category.toUpperCase()}: ${message}`);
    
    if (data) {
      console.log('  Data:', data);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  /**
   * Get emoji cho log level và category
   */
  private static getEmoji(level: DebugLogEntry['level'], category: DebugLogEntry['category']): string {
    if (level === 'error') return '❌';
    if (level === 'warning') return '⚠️';
    if (level === 'success') return '✅';

    switch (category) {
      case 'shift_change': return '🔄';
      case 'notification': return '🔔';
      case 'cleanup': return '🧹';
      case 'validation': return '🔍';
      case 'timing': return '⏰';
      default: return 'ℹ️';
    }
  }

  /**
   * Shorthand methods
   */
  static info(category: DebugLogEntry['category'], message: string, data?: any) {
    this.log('info', category, message, data);
  }

  static success(category: DebugLogEntry['category'], message: string, data?: any) {
    this.log('success', category, message, data);
  }

  static warning(category: DebugLogEntry['category'], message: string, data?: any) {
    this.log('warning', category, message, data);
  }

  static error(category: DebugLogEntry['category'], message: string, data?: any) {
    this.log('error', category, message, data);
  }

  /**
   * Lấy tất cả logs
   */
  static getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  /**
   * Lấy logs theo category
   */
  static getLogsByCategory(category: DebugLogEntry['category']): DebugLogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Clear logs
   */
  static clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
    console.log('🗑️ Debug logs cleared');
  }

  /**
   * Subscribe to log updates
   */
  static subscribe(listener: (logs: DebugLogEntry[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Debug shift application process
   */
  static debugShiftApplication(oldShift: Shift | null, newShift: Shift | null) {
    this.info('shift_change', '=== SHIFT APPLICATION DEBUG START ===');
    
    if (oldShift) {
      this.info('shift_change', `Previous shift: ${oldShift.name}`, {
        id: oldShift.id,
        startTime: oldShift.startTime,
        endTime: oldShift.endTime,
        isNightShift: oldShift.isNightShift
      });
    } else {
      this.info('shift_change', 'No previous shift');
    }

    if (newShift) {
      this.info('shift_change', `New shift: ${newShift.name}`, {
        id: newShift.id,
        startTime: newShift.startTime,
        endTime: newShift.endTime,
        departureTime: newShift.departureTime,
        remindBeforeStart: newShift.remindBeforeStart,
        remindAfterEnd: newShift.remindAfterEnd,
        isNightShift: newShift.isNightShift,
        workDays: newShift.workDays
      });
    } else {
      this.info('shift_change', 'No new shift (clearing active shift)');
    }

    this.info('shift_change', `Current time: ${new Date().toLocaleString()}`);
  }

  /**
   * Debug notification timing calculations
   */
  static debugNotificationTiming(shift: Shift, baseDate: Date) {
    this.info('timing', `=== NOTIFICATION TIMING DEBUG for ${shift.name} ===`);
    this.info('timing', `Base date: ${baseDate.toDateString()}`);
    this.info('timing', `Current time: ${new Date().toLocaleString()}`);

    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return { hours, minutes };
    };

    const createDateTime = (date: Date, timeStr: string, addDays: number = 0): Date => {
      const { hours, minutes } = parseTime(timeStr);
      const result = new Date(date);
      result.setHours(hours, minutes, 0, 0);
      if (addDays !== 0) {
        result.setDate(result.getDate() + addDays);
      }
      return result;
    };

    const now = new Date();

    // Departure timing
    const departureTime = createDateTime(baseDate, shift.departureTime);
    this.info('timing', `Departure: ${shift.departureTime} → ${departureTime.toLocaleString()}`, {
      isFuture: departureTime > now,
      hoursFromNow: (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    });

    // Check-in timing
    const checkinTime = createDateTime(baseDate, shift.startTime);
    checkinTime.setMinutes(checkinTime.getMinutes() - (shift.remindBeforeStart || 15));
    this.info('timing', `Check-in reminder: ${checkinTime.toLocaleString()}`, {
      originalStartTime: shift.startTime,
      reminderMinutes: shift.remindBeforeStart || 15,
      isFuture: checkinTime > now,
      hoursFromNow: (checkinTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    });

    // Check-out timing
    let checkoutTime = createDateTime(baseDate, shift.endTime);
    checkoutTime.setMinutes(checkoutTime.getMinutes() + (shift.remindAfterEnd || 10));
    
    if (shift.isNightShift) {
      checkoutTime.setDate(checkoutTime.getDate() + 1);
      this.info('timing', 'Applied night shift adjustment: +1 day for checkout');
    }

    this.info('timing', `Check-out reminder: ${checkoutTime.toLocaleString()}`, {
      originalEndTime: shift.endTime,
      reminderMinutes: shift.remindAfterEnd || 10,
      isNightShift: shift.isNightShift,
      isFuture: checkoutTime > now,
      hoursFromNow: (checkoutTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    });

    this.info('timing', '=== END TIMING DEBUG ===');
  }

  /**
   * Debug cleanup process
   */
  static debugCleanupStart() {
    this.info('cleanup', '=== CLEANUP PROCESS START ===');
    this.info('cleanup', 'Cancelling all existing notifications...');
  }

  static debugCleanupComplete(cancelledCount: number) {
    this.success('cleanup', `Cleanup completed: ${cancelledCount} notifications cancelled`);
    this.info('cleanup', '=== CLEANUP PROCESS END ===');
  }

  /**
   * Debug notification scheduling
   */
  static debugNotificationScheduled(type: string, identifier: string, scheduledTime: Date) {
    this.success('notification', `Scheduled ${type} notification`, {
      identifier,
      scheduledTime: scheduledTime.toLocaleString(),
      hoursFromNow: (scheduledTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    });
  }

  static debugNotificationSkipped(type: string, reason: string, data?: any) {
    this.warning('notification', `Skipped ${type} notification: ${reason}`, data);
  }

  /**
   * Export logs as text
   */
  static exportLogsAsText(): string {
    const header = `=== SHIFT DEBUG LOGS ===\nGenerated: ${new Date().toLocaleString()}\nTotal entries: ${this.logs.length}\n\n`;
    
    const logEntries = this.logs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const emoji = this.getEmoji(log.level, log.category);
      let entry = `${emoji} [${timestamp}] ${log.category.toUpperCase()}: ${log.message}`;
      
      if (log.data) {
        entry += `\n  Data: ${JSON.stringify(log.data, null, 2)}`;
      }
      
      return entry;
    }).join('\n\n');

    return header + logEntries;
  }
}

// Export cho global debugging
if (typeof global !== 'undefined') {
  (global as any).ShiftDebugLogger = ShiftDebugLogger;
}
