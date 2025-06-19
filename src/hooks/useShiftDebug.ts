/**
 * 🔧 Hook để debug shift application và notifications
 */

import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { notificationScheduler } from '../services/notificationScheduler';
import { ShiftDebugLogger } from '../utils/shiftDebugLogger';
import { Shift } from '../types';

export function useShiftDebug() {
  const { state, actions } = useApp();

  /**
   * Test áp dụng ca với debug logging
   */
  const testShiftApplication = useCallback(async (shiftId: string) => {
    try {
      ShiftDebugLogger.info('shift_change', '=== TESTING SHIFT APPLICATION ===');
      ShiftDebugLogger.info('shift_change', `Testing shift application for ID: ${shiftId}`);
      
      const shift = state.shifts.find(s => s.id === shiftId);
      if (!shift) {
        ShiftDebugLogger.error('shift_change', `Shift not found: ${shiftId}`);
        return;
      }

      // Apply shift
      await actions.setActiveShift(shiftId);
      
      ShiftDebugLogger.success('shift_change', 'Shift application test completed');
    } catch (error) {
      ShiftDebugLogger.error('shift_change', 'Shift application test failed', error);
    }
  }, [state.shifts, actions]);

  /**
   * Test notification scheduling cho shift hiện tại
   */
  const testNotificationScheduling = useCallback(async () => {
    if (!state.activeShift) {
      ShiftDebugLogger.warning('notification', 'No active shift to test');
      return;
    }

    try {
      ShiftDebugLogger.info('notification', '=== TESTING NOTIFICATION SCHEDULING ===');
      
      // Cleanup first
      await notificationScheduler.cleanupAllNotifications();
      
      // Schedule notifications
      await notificationScheduler.scheduleShiftNotifications(state.activeShift);
      
      // Debug scheduled notifications
      await notificationScheduler.debugScheduledNotifications();
      
      ShiftDebugLogger.success('notification', 'Notification scheduling test completed');
    } catch (error) {
      ShiftDebugLogger.error('notification', 'Notification scheduling test failed', error);
    }
  }, [state.activeShift]);

  /**
   * Test với ca đêm mẫu
   */
  const testWithNightShift = useCallback(async () => {
    const testNightShift: Shift = {
      id: 'test_night_shift_debug',
      name: 'Test Ca Đêm Debug',
      startTime: '22:00',
      endTime: '06:30',
      officeEndTime: '06:00',
      departureTime: '21:15',
      remindBeforeStart: 20,
      remindAfterEnd: 15,
      isNightShift: true,
      workDays: [1, 2, 3, 4, 5, 6],
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      showPunch: true,
      breakMinutes: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      ShiftDebugLogger.info('shift_change', '=== TESTING WITH NIGHT SHIFT ===');
      
      // Add test shift temporarily
      await actions.addShift(testNightShift, false);
      
      // Apply it
      await actions.setActiveShift(testNightShift.id);
      
      // Test notifications
      await testNotificationScheduling();
      
      ShiftDebugLogger.success('shift_change', 'Night shift test completed');
      
      // Cleanup - remove test shift
      await actions.deleteShift(testNightShift.id);
      
    } catch (error) {
      ShiftDebugLogger.error('shift_change', 'Night shift test failed', error);
    }
  }, [actions, testNotificationScheduling]);

  /**
   * Test với ca ngày mẫu
   */
  const testWithDayShift = useCallback(async () => {
    const testDayShift: Shift = {
      id: 'test_day_shift_debug',
      name: 'Test Ca Ngày Debug',
      startTime: '08:00',
      endTime: '17:00',
      officeEndTime: '17:00',
      departureTime: '07:15',
      remindBeforeStart: 15,
      remindAfterEnd: 10,
      isNightShift: false,
      workDays: [1, 2, 3, 4, 5],
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      showPunch: false,
      breakMinutes: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      ShiftDebugLogger.info('shift_change', '=== TESTING WITH DAY SHIFT ===');
      
      // Add test shift temporarily
      await actions.addShift(testDayShift, false);
      
      // Apply it
      await actions.setActiveShift(testDayShift.id);
      
      // Test notifications
      await testNotificationScheduling();
      
      ShiftDebugLogger.success('shift_change', 'Day shift test completed');
      
      // Cleanup - remove test shift
      await actions.deleteShift(testDayShift.id);
      
    } catch (error) {
      ShiftDebugLogger.error('shift_change', 'Day shift test failed', error);
    }
  }, [actions, testNotificationScheduling]);

  /**
   * Test full cycle: cleanup → apply shift → schedule → debug
   */
  const testFullCycle = useCallback(async () => {
    if (!state.activeShift) {
      ShiftDebugLogger.warning('shift_change', 'No active shift for full cycle test');
      return;
    }

    try {
      ShiftDebugLogger.info('shift_change', '=== TESTING FULL CYCLE ===');
      
      const currentShift = state.activeShift;
      
      // Step 1: Clear active shift
      ShiftDebugLogger.info('shift_change', 'Step 1: Clearing active shift');
      await actions.setActiveShift(null);
      
      // Step 2: Cleanup notifications
      ShiftDebugLogger.info('shift_change', 'Step 2: Cleanup notifications');
      await notificationScheduler.cleanupAllNotifications();
      
      // Step 3: Re-apply shift
      ShiftDebugLogger.info('shift_change', 'Step 3: Re-applying shift');
      await actions.setActiveShift(currentShift.id);
      
      // Step 4: Debug results
      ShiftDebugLogger.info('shift_change', 'Step 4: Debug scheduled notifications');
      await notificationScheduler.debugScheduledNotifications();
      
      ShiftDebugLogger.success('shift_change', 'Full cycle test completed');
    } catch (error) {
      ShiftDebugLogger.error('shift_change', 'Full cycle test failed', error);
    }
  }, [state.activeShift, actions]);

  /**
   * Clear all debug logs
   */
  const clearDebugLogs = useCallback(() => {
    ShiftDebugLogger.clearLogs();
  }, []);

  /**
   * Export debug logs
   */
  const exportDebugLogs = useCallback(() => {
    return ShiftDebugLogger.exportLogsAsText();
  }, []);

  return {
    // Test functions
    testShiftApplication,
    testNotificationScheduling,
    testWithNightShift,
    testWithDayShift,
    testFullCycle,
    
    // Utility functions
    clearDebugLogs,
    exportDebugLogs,
    
    // State
    hasActiveShift: !!state.activeShift,
    activeShiftName: state.activeShift?.name,
    availableShifts: state.shifts,
  };
}

// Export cho global debugging
if (typeof global !== 'undefined') {
  (global as any).useShiftDebug = useShiftDebug;
}
