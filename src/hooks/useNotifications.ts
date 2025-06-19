/**
 * 🔔 Hook quản lý notifications
 */

import { useEffect, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationScheduler } from '../services/notificationScheduler';
import { useApp } from '../contexts/AppContext';

interface NotificationStatus {
  isInitialized: boolean;
  canSchedule: boolean;
  lastScheduled: string | null;
  error: string | null;
}

export function useNotifications() {
  const { state } = useApp();
  const [status, setStatus] = useState<NotificationStatus>({
    isInitialized: false,
    canSchedule: false,
    lastScheduled: null,
    error: null,
  });

  /**
   * Khởi tạo notification service
   */
  const initialize = useCallback(async () => {
    try {
      await notificationScheduler.initialize();
      setStatus(prev => ({
        ...prev,
        isInitialized: true,
        canSchedule: true,
        error: null,
      }));
    } catch (error) {
      console.error('❌ useNotifications: Lỗi khởi tạo:', error);
      setStatus(prev => ({
        ...prev,
        isInitialized: true,
        canSchedule: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  /**
   * Lập lịch notifications cho active shift
   */
  const scheduleForActiveShift = useCallback(async () => {
    if (!state.activeShift) {
      console.log('📱 useNotifications: Không có active shift');
      return;
    }

    try {
      console.log(`📅 useNotifications: Scheduling notifications for ${state.activeShift.name}`);
      await notificationScheduler.scheduleShiftNotifications(state.activeShift);
      
      setStatus(prev => ({
        ...prev,
        lastScheduled: new Date().toISOString(),
        error: null,
      }));

      console.log('✅ useNotifications: Đã lập lịch thành công');
    } catch (error) {
      console.error('❌ useNotifications: Lỗi lập lịch:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Scheduling error',
      }));
    }
  }, [state.activeShift]);

  /**
   * Cleanup tất cả notifications
   */
  const cleanup = useCallback(async () => {
    try {
      await notificationScheduler.cleanupAllNotifications();
      console.log('🧹 useNotifications: Đã cleanup notifications');
    } catch (error) {
      console.error('❌ useNotifications: Lỗi cleanup:', error);
    }
  }, []);

  /**
   * Debug notifications
   */
  const debug = useCallback(async () => {
    await notificationScheduler.debugScheduledNotifications();
  }, []);

  /**
   * Force refresh notifications
   */
  const refresh = useCallback(async () => {
    console.log('🔄 useNotifications: Force refresh notifications');
    await cleanup();
    await scheduleForActiveShift();
  }, [cleanup, scheduleForActiveShift]);

  // Khởi tạo khi hook mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Lập lịch lại khi active shift thay đổi
  useEffect(() => {
    if (status.isInitialized && status.canSchedule && state.activeShift) {
      console.log('🔄 useNotifications: Active shift changed, rescheduling...');
      scheduleForActiveShift();
    }
  }, [state.activeShift?.id, status.isInitialized, status.canSchedule, scheduleForActiveShift]);

  // Refresh khi app quay lại foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && status.isInitialized && status.canSchedule) {
        console.log('📱 useNotifications: App became active, refreshing notifications');
        refresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [status.isInitialized, status.canSchedule, refresh]);

  // Refresh theo trigger từ AppContext
  useEffect(() => {
    if (state.refreshTrigger && status.isInitialized && status.canSchedule) {
      console.log('🔄 useNotifications: Refresh trigger activated');
      refresh();
    }
  }, [state.refreshTrigger, status.isInitialized, status.canSchedule, refresh]);

  return {
    status,
    initialize,
    scheduleForActiveShift,
    cleanup,
    debug,
    refresh,
  };
}

/**
 * 🔔 Hook đơn giản chỉ để khởi tạo notifications
 */
export function useNotificationInit() {
  const { initialize, status } = useNotifications();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return status;
}
