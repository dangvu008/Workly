import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  UserSettings,
  Shift,
  Note,
  WeatherData,
  ButtonState,
  DailyWorkStatus
} from '../types';
import { storageService } from '../services/storage';
import { workManager } from '../services/workManager';
import { weatherService } from '../services/weather';
import { extremeWeatherService } from '../services/extremeWeatherService';
import { notificationScheduler } from '../services/notificationScheduler';
import { alarmService } from '../services/alarmService';
import { dayOffService } from '../services/dayOffService';
import { ShiftDebugLogger } from '../utils/shiftDebugLogger';

import { format, addDays, startOfWeek } from 'date-fns';

// State interface
interface AppState {
  isLoading: boolean;
  settings: UserSettings | null;
  shifts: Shift[];
  activeShift: Shift | null;
  notes: Note[];
  weatherData: WeatherData | null;
  currentButtonState: ButtonState;
  todayStatus: DailyWorkStatus | null;
  weeklyStatus: Record<string, DailyWorkStatus>;
  timeDisplayInfo: {
    isActiveWindow: boolean;
    shouldShowButton: boolean;
    shouldShowHistory: boolean;
    timeUntilNextReset: number;
    currentPhase: 'before_work' | 'work_time' | 'after_work' | 'inactive';
  } | null;
  // ✅ Thêm refresh trigger để force update UI
  refreshTrigger: number;
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'SET_SHIFTS'; payload: Shift[] }
  | { type: 'SET_ACTIVE_SHIFT'; payload: Shift | null }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'SET_WEATHER_DATA'; payload: WeatherData | null }
  | { type: 'SET_BUTTON_STATE'; payload: ButtonState }
  | { type: 'SET_TODAY_STATUS'; payload: DailyWorkStatus | null }
  | { type: 'SET_WEEKLY_STATUS'; payload: Record<string, DailyWorkStatus> }
  | { type: 'SET_TIME_DISPLAY_INFO'; payload: AppState['timeDisplayInfo'] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'ADD_SHIFT'; payload: Shift }
  | { type: 'UPDATE_SHIFT'; payload: { id: string; updates: Partial<Shift> } }
  | { type: 'DELETE_SHIFT'; payload: string }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: { id: string; updates: Partial<Note> } }
  | { type: 'DELETE_NOTE'; payload: string };

// Initial state
const initialState: AppState = {
  isLoading: true,
  settings: null,
  shifts: [],
  activeShift: null,
  notes: [],
  weatherData: null,
  currentButtonState: 'go_work',
  todayStatus: null,
  weeklyStatus: {},
  timeDisplayInfo: null,
  refreshTrigger: 0,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'SET_SHIFTS':
      return { ...state, shifts: action.payload };

    case 'SET_ACTIVE_SHIFT':
      return { ...state, activeShift: action.payload };

    case 'SET_NOTES':
      return { ...state, notes: action.payload };

    case 'SET_WEATHER_DATA':
      return { ...state, weatherData: action.payload };

    case 'SET_BUTTON_STATE':
      return { ...state, currentButtonState: action.payload };

    case 'SET_TODAY_STATUS':
      return { ...state, todayStatus: action.payload };

    case 'SET_WEEKLY_STATUS':
      return { ...state, weeklyStatus: action.payload };

    case 'SET_TIME_DISPLAY_INFO':
      return { ...state, timeDisplayInfo: action.payload };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: state.settings ? { ...state.settings, ...action.payload } : null
      };

    case 'ADD_SHIFT':
      return { ...state, shifts: [...state.shifts, action.payload] };

    case 'UPDATE_SHIFT':
      return {
        ...state,
        shifts: state.shifts.map(shift =>
          shift.id === action.payload.id
            ? { ...shift, ...action.payload.updates }
            : shift
        ),
        activeShift: state.activeShift?.id === action.payload.id
          ? { ...state.activeShift, ...action.payload.updates }
          : state.activeShift,
      };

    case 'DELETE_SHIFT':
      return {
        ...state,
        shifts: state.shifts.filter(shift => shift.id !== action.payload),
        activeShift: state.activeShift?.id === action.payload ? null : state.activeShift,
      };

    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] };

    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id
            ? { ...note, ...action.payload.updates }
            : note
        ),
      };

    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload),
      };

    case 'TRIGGER_REFRESH':
      return { ...state, refreshTrigger: state.refreshTrigger + 1 };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadInitialData: () => Promise<void>;
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
    setActiveShift: (shiftId: string | null) => Promise<void>;
    addShift: (shift: Shift, applyImmediately?: boolean) => Promise<void>;
    updateShift: (shiftId: string, updates: Partial<Shift>) => Promise<void>;
    deleteShift: (shiftId: string) => Promise<void>;
    addNote: (note: Note) => Promise<void>;
    updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
    deleteNote: (noteId: string) => Promise<void>;
    handleButtonPress: () => Promise<void>;
    handleRapidPressConfirmed: (checkInTime: string, checkOutTime: string) => Promise<void>;
    resetDailyStatus: () => Promise<void>;
    refreshWeatherData: () => Promise<void>;
    refreshButtonState: () => Promise<void>;
    refreshWeeklyStatus: () => Promise<void>;
    refreshTimeDisplayInfo: () => Promise<void>;
    forceRefreshAllStatus: () => Promise<void>;
    triggerRefresh: () => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data
  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Initialize notification scheduler and alarm service
      await notificationScheduler.initialize();
      await alarmService.initialize();

      // Load all data
      const [settings, shifts, activeShiftId] = await Promise.all([
        storageService.getUserSettings(),
        storageService.getShiftList(),
        storageService.getActiveShiftId(),
      ]);

      // Load notes and add sample data if needed
      let notes = await storageService.getNotes();
      if (notes.length === 0) {
        // Import and add sample data với ngôn ngữ từ settings
        const { addSampleNotesToStorage } = await import('../services/sampleData');
        notes = await addSampleNotesToStorage(settings.language);
      }

      dispatch({ type: 'SET_SETTINGS', payload: settings });
      dispatch({ type: 'SET_SHIFTS', payload: shifts });
      dispatch({ type: 'SET_NOTES', payload: notes });

      // Set active shift
      const activeShift = activeShiftId ? shifts.find(s => s.id === activeShiftId) || null : null;
      dispatch({ type: 'SET_ACTIVE_SHIFT', payload: activeShift });

      // Load today's status and button state
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayStatus = await storageService.getDailyWorkStatusForDate(today);
      const buttonState = await workManager.getCurrentButtonState(today);

      dispatch({ type: 'SET_TODAY_STATUS', payload: todayStatus });
      dispatch({ type: 'SET_BUTTON_STATE', payload: buttonState });

      // Load weekly status
      await refreshWeeklyStatus();

      // Load time display info
      await refreshTimeDisplayInfo();

      // Load weather data
      if (settings.weatherWarningEnabled) {
        const weatherData = await weatherService.getWeatherData();
        dispatch({ type: 'SET_WEATHER_DATA', payload: weatherData });
      }

      // ✅ REMINDER SYSTEM: Khởi tạo hệ thống nhắc nhở 3 loại
      ShiftDebugLogger.info('notification', 'Khởi tạo Reminder System...');

      // Khởi tạo notification handler để xử lý responses
      const { notificationHandler } = await import('../services/notificationHandler');
      await notificationHandler.initialize();

      // Dọn dẹp HOÀN TOÀN tất cả alarms và notifications cũ
      await alarmService.cancelAllAlarms();
      await notificationScheduler.cleanupAllNotifications();
      ShiftDebugLogger.success('cleanup', 'Đã cleanup tất cả reminders cũ');

      // Check for shift rotation (KHÔNG lập lịch gì trong này)
      await workManager.checkAndRotateShifts();

      // Lập lịch cho active shift với hệ thống mới
      if (activeShiftId && activeShift) {
        ShiftDebugLogger.info('notification', `Lập lịch reminders cho ca ${activeShift.name}...`);

        // ✅ 1. Báo thức (Alarm) - Độ ưu tiên cao nhất
        await alarmService.scheduleShiftReminder(activeShift);

        // ✅ 2. Cảnh báo Thời tiết - Thông báo ưu tiên cao (1 giờ trước departure)
        // Cleanup weather warnings trước khi lập lịch mới
        await notificationScheduler.cancelAllWeatherWarnings();
        await extremeWeatherService.cancelAllExtremeWeatherChecks();

        const today = new Date();
        let scheduledCount = 0;

        // ✅ Chỉ lập lịch cho 3 ngày tới thay vì 7 ngày để giảm spam
        for (let i = 0; i < 3; i++) {
          const workdayDate = new Date(today);
          workdayDate.setDate(today.getDate() + i);
          const dayOfWeek = workdayDate.getDay();

          if (activeShift.workDays.includes(dayOfWeek)) {
            await notificationScheduler.scheduleWeatherWarning(activeShift, workdayDate);
            scheduledCount++;
            // ❌ DISABLED: Extreme weather check tạm thời vô hiệu hóa để tránh spam
            // await extremeWeatherService.scheduleExtremeWeatherCheck(activeShift, workdayDate);
          }
        }

        ShiftDebugLogger.info('weather', `Scheduled ${scheduledCount} weather warnings for next 3 days`);

        // ✅ 3. Nhắc nhở Đổi ca - Thông báo tiêu chuẩn
        await workManager.scheduleWeeklyReminder();

        ShiftDebugLogger.success('notification', `Hoàn thành lập lịch reminders cho ca ${activeShift.name}`);
      } else {
        ShiftDebugLogger.info('notification', 'Không có ca hoạt động, bỏ qua lập lịch');
      }

      ShiftDebugLogger.success('notification', 'Hoàn thành khởi tạo Reminder System');

      // ✅ Khởi tạo ngày nghỉ thông thường (tự động đặt Chủ Nhật là ngày nghỉ)
      console.log('🔄 AppContext: Khởi tạo ngày nghỉ thông thường...');
      await dayOffService.initializeDayOffs();
      console.log('✅ AppContext: Hoàn thành khởi tạo ngày nghỉ thông thường');

    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update settings
  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const newSettings = await storageService.updateUserSettings(updates);
      dispatch({ type: 'SET_SETTINGS', payload: newSettings });

      // If weather settings changed, refresh weather data
      if ('weatherWarningEnabled' in updates || 'weatherLocation' in updates) {
        await refreshWeatherData();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Set active shift
  const setActiveShift = async (shiftId: string | null) => {
    try {
      // Debug shift application
      const oldShift = state.activeShift;
      const newShift = shiftId ? state.shifts.find(s => s.id === shiftId) || null : null;
      ShiftDebugLogger.debugShiftApplication(oldShift, newShift);

      // ✅ Tránh duplicate scheduling nếu shift không thay đổi
      if (oldShift?.id === newShift?.id) {
        ShiftDebugLogger.info('shift_change', 'Same shift selected, skipping notification rescheduling');
        return;
      }

      await storageService.setActiveShiftId(shiftId);
      const activeShift = shiftId ? state.shifts.find(s => s.id === shiftId) || null : null;
      dispatch({ type: 'SET_ACTIVE_SHIFT', payload: activeShift });

      // Handle rotation config if in rotate mode
      if (state.settings?.changeShiftReminderMode === 'rotate' && state.settings.rotationConfig && shiftId) {
        const rotationShifts = state.settings.rotationConfig.rotationShifts;
        const newIndex = rotationShifts.findIndex(id => id === shiftId);

        if (newIndex >= 0) {
          // Update rotation index and reset last applied date
          await storageService.updateUserSettings({
            rotationConfig: {
              ...state.settings.rotationConfig,
              currentRotationIndex: newIndex,
              rotationLastAppliedDate: new Date().toISOString(),
            }
          });
        } else {
          // Shift not in rotation list - show warning
          console.warn('Selected shift is not in rotation list');
        }
      }

      // ✅ REMINDER SYSTEM: Cleanup và reschedule cho ca mới
      ShiftDebugLogger.info('shift_change', 'Starting reminder system cleanup and reschedule');

      // Cleanup hoàn toàn
      await alarmService.cancelAllAlarms();
      await notificationScheduler.cleanupAllNotifications();
      ShiftDebugLogger.success('shift_change', 'Cleanup completed');

      // Đợi một chút để đảm bảo cleanup hoàn tất
      await new Promise(resolve => setTimeout(resolve, 300));

      // Lập lịch cho ca mới
      if (activeShift) {
        ShiftDebugLogger.info('shift_change', `Scheduling reminders for new shift: ${activeShift.name}`);

        // ✅ 1. Báo thức (Alarm) - Độ ưu tiên cao nhất
        await alarmService.scheduleShiftReminder(activeShift);

        // ✅ 2. Cảnh báo Thời tiết - Thông báo ưu tiên cao
        // Cleanup weather warnings trước khi lập lịch mới
        await notificationScheduler.cancelAllWeatherWarnings();
        await extremeWeatherService.cancelAllExtremeWeatherChecks();

        // ✅ Delay nhỏ để đảm bảo cleanup hoàn tất
        await new Promise(resolve => setTimeout(resolve, 500));

        const today = new Date();
        let scheduledCount = 0;

        // ✅ Chỉ lập lịch cho 3 ngày tới thay vì 7 ngày để giảm spam
        for (let i = 0; i < 3; i++) {
          const workdayDate = new Date(today);
          workdayDate.setDate(today.getDate() + i);
          const dayOfWeek = workdayDate.getDay();

          if (activeShift.workDays.includes(dayOfWeek)) {
            await notificationScheduler.scheduleWeatherWarning(activeShift, workdayDate);
            scheduledCount++;
            // ❌ DISABLED: Extreme weather check tạm thời vô hiệu hóa để tránh spam
            // await extremeWeatherService.scheduleExtremeWeatherCheck(activeShift, workdayDate);
          }
        }

        ShiftDebugLogger.info('weather', `Scheduled ${scheduledCount} weather warnings for next 3 days`);

        // ✅ 3. Nhắc nhở Đổi ca - Thông báo tiêu chuẩn
        await workManager.scheduleWeeklyReminder();

        ShiftDebugLogger.success('shift_change', `Completed scheduling for shift: ${activeShift.name}`);
      } else {
        ShiftDebugLogger.info('shift_change', 'No active shift - skipping reminder scheduling');
      }

      // Refresh button state and time display info
      await refreshButtonState();
      await refreshTimeDisplayInfo();
    } catch (error) {
      console.error('Error setting active shift:', error);
      throw error;
    }
  };

  // Add shift
  const addShift = async (shift: Shift, applyImmediately: boolean = false) => {
    try {
      await storageService.addShift(shift);
      dispatch({ type: 'ADD_SHIFT', payload: shift });

      if (applyImmediately) {
        await setActiveShift(shift.id);
      }
    } catch (error) {
      console.error('Error adding shift:', error);
      throw error;
    }
  };

  // Update shift
  const updateShift = async (shiftId: string, updates: Partial<Shift>) => {
    try {
      await storageService.updateShift(shiftId, updates);
      dispatch({ type: 'UPDATE_SHIFT', payload: { id: shiftId, updates } });

      // If this is the active shift, reschedule reminders với cleanup trước
      if (state.activeShift?.id === shiftId) {
        ShiftDebugLogger.info('shift_change', 'Updating active shift - cleanup và reschedule reminders...');

        // ✅ Cleanup hoàn toàn trước khi reschedule
        await alarmService.cancelAllAlarms();
        await notificationScheduler.cleanupAllNotifications();

        // Đợi một chút để đảm bảo cleanup hoàn tất
        await new Promise(resolve => setTimeout(resolve, 300));

        // Reschedule với shift đã update
        const updatedShift = { ...state.activeShift, ...updates };

        // ✅ 1. Báo thức (Alarm)
        await alarmService.scheduleShiftReminder(updatedShift);

        // ✅ 2. Cảnh báo Thời tiết
        // Cleanup weather warnings trước khi lập lịch mới
        await notificationScheduler.cancelAllWeatherWarnings();
        await extremeWeatherService.cancelAllExtremeWeatherChecks();

        // ✅ Delay nhỏ để đảm bảo cleanup hoàn tất
        await new Promise(resolve => setTimeout(resolve, 500));

        const today = new Date();
        let scheduledCount = 0;

        // ✅ Chỉ lập lịch cho 3 ngày tới thay vì 7 ngày để giảm spam
        for (let i = 0; i < 3; i++) {
          const workdayDate = new Date(today);
          workdayDate.setDate(today.getDate() + i);
          const dayOfWeek = workdayDate.getDay();

          if (updatedShift.workDays.includes(dayOfWeek)) {
            await notificationScheduler.scheduleWeatherWarning(updatedShift, workdayDate);
            scheduledCount++;
            // ❌ DISABLED: Extreme weather check tạm thời vô hiệu hóa để tránh spam
            // await extremeWeatherService.scheduleExtremeWeatherCheck(updatedShift, workdayDate);
          }
        }

        ShiftDebugLogger.info('weather', `Scheduled ${scheduledCount} weather warnings for next 3 days`);

        ShiftDebugLogger.success('shift_change', `Đã reschedule reminders cho shift ${updatedShift.name}`);
      }
    } catch (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
  };

  // Delete shift
  const deleteShift = async (shiftId: string) => {
    try {
      await storageService.deleteShift(shiftId);
      dispatch({ type: 'DELETE_SHIFT', payload: shiftId });

      // If this was the active shift, clear it
      if (state.activeShift?.id === shiftId) {
        await storageService.setActiveShiftId(null);
        await notificationScheduler.cleanupAllNotifications();
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
  };

  // Add note
  const addNote = async (note: Note) => {
    try {
      await storageService.addNote(note);
      dispatch({ type: 'ADD_NOTE', payload: note });

      // Schedule reminder if set (chỉ alarms vì note reminders chưa implement trong notificationScheduler)
      // Hỗ trợ cả specific datetime và shift-based reminders
      if (note.reminderDateTime || (note.associatedShiftIds && note.associatedShiftIds.length > 0)) {
        await alarmService.scheduleNoteReminder(note);
        // TODO: Implement note reminders trong notificationScheduler nếu cần
      }
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  };

  // Update note
  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      await storageService.updateNote(noteId, updates);
      dispatch({ type: 'UPDATE_NOTE', payload: { id: noteId, updates } });

      // Update reminder (chỉ alarms)
      await alarmService.cancelNoteReminder(noteId);

      const updatedNote = state.notes.find(n => n.id === noteId);
      if (updatedNote) {
        const newNote = { ...updatedNote, ...updates } as Note;
        // Hỗ trợ cả specific datetime và shift-based reminders
        if (newNote.reminderDateTime || (newNote.associatedShiftIds && newNote.associatedShiftIds.length > 0)) {
          await alarmService.scheduleNoteReminder(newNote);
          // TODO: Implement note reminders trong notificationScheduler nếu cần
        }
      }
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    try {
      await storageService.deleteNote(noteId);
      dispatch({ type: 'DELETE_NOTE', payload: noteId });

      // Cancel reminder (chỉ alarms)
      await alarmService.cancelNoteReminder(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  // Handle button press - Improved with better error handling and state management
  const handleButtonPress = async () => {
    try {
      // Validate prerequisites
      if (!state.activeShift) {
        throw new Error('Không có ca làm việc đang hoạt động');
      }

      await workManager.handleButtonPress(state.currentButtonState);

      // Batch state updates to reduce re-renders
      const today = format(new Date(), 'yyyy-MM-dd');
      const [newButtonState, todayStatus, weeklyStatus] = await Promise.all([
        workManager.getCurrentButtonState(today),
        storageService.getDailyWorkStatusForDate(today),
        (async () => {
          const weeklyStatus: Record<string, DailyWorkStatus> = {};
          const todayDate = new Date();

          for (let i = -6; i <= 0; i++) {
            const date = new Date(todayDate);
            date.setDate(todayDate.getDate() + i);
            const dateString = format(date, 'yyyy-MM-dd');

            const status = await storageService.getDailyWorkStatusForDate(dateString);
            if (status) {
              weeklyStatus[dateString] = status;
            }
          }
          return weeklyStatus;
        })()
      ]);

      // Update all states at once
      dispatch({ type: 'SET_BUTTON_STATE', payload: newButtonState });
      dispatch({ type: 'SET_TODAY_STATUS', payload: todayStatus });
      dispatch({ type: 'SET_WEEKLY_STATUS', payload: weeklyStatus });

      // ✅ Trigger refresh để force update tất cả UI components
      dispatch({ type: 'TRIGGER_REFRESH' });

    } catch (error) {
      // Chỉ log error nếu không phải RapidPressDetectedException
      if ((error as any)?.name !== 'RapidPressDetectedException') {
        console.error('Error handling button press:', error);
      }
      // Luôn throw để UI component xử lý
      throw error;
    }
  };

  // Handle rapid press confirmation - tính đủ công theo lịch trình
  const handleRapidPressConfirmed = async (checkInTime: string, checkOutTime: string) => {
    try {
      console.log('🚀 AppContext: handleRapidPressConfirmed started', { checkInTime, checkOutTime });

      const today = format(new Date(), 'yyyy-MM-dd');
      const logs = await storageService.getAttendanceLogsForDate(today);

      console.log('🚀 AppContext: Retrieved logs for today:', logs.length);

      if (!state.activeShift) {
        console.error('❌ AppContext: No active shift found');
        throw new Error('Không có ca làm việc đang hoạt động');
      }

      console.log('🚀 AppContext: Active shift found:', state.activeShift.name);

      // Thêm check_out log trước khi tính toán status
      console.log('🚀 AppContext: Adding check_out log for rapid press confirmation');
      const updatedLogs = [...logs];
      const checkOutLog = { type: 'check_out' as const, time: checkOutTime };
      updatedLogs.push(checkOutLog);

      // ✅ Tự động thêm complete log ngay sau check_out để hoàn tất quy trình
      console.log('🚀 AppContext: Auto-adding complete log for rapid press confirmation');
      const completeLog = { type: 'complete' as const, time: checkOutTime };
      updatedLogs.push(completeLog);

      await storageService.setAttendanceLogsForDate(today, updatedLogs);

      // Tính toán work status với xác nhận "bấm nhanh"
      console.log('🚀 AppContext: Calling calculateDailyWorkStatusWithRapidPressConfirmed');
      const status = await workManager.calculateDailyWorkStatusWithRapidPressConfirmed(
        today,
        updatedLogs,
        state.activeShift,
        checkInTime,
        checkOutTime
      );

      console.log('🚀 AppContext: Calculated status:', status);

      // Lưu kết quả
      console.log('🚀 AppContext: Saving status to storage');
      await storageService.setDailyWorkStatusNewForDate(today, status);

      // ✅ FIX: Refresh state KHÔNG gọi refreshButtonState() để tránh trigger lại rapid press detection
      // Thay vào đó, set trực tiếp button state thành 'completed_day'
      console.log('🚀 AppContext: Setting button state to completed_day after rapid press confirmation');
      dispatch({ type: 'SET_BUTTON_STATE', payload: 'completed_day' });

      // Chỉ refresh weekly status và today status
      await refreshWeeklyStatus();
      const todayStatus = await storageService.getDailyWorkStatusForDate(today);
      dispatch({ type: 'SET_TODAY_STATUS', payload: todayStatus });

      // ✅ Trigger refresh để force update tất cả UI components
      dispatch({ type: 'TRIGGER_REFRESH' });

      console.log('✅ AppContext: Đã xử lý xác nhận bấm nhanh thành công');
    } catch (error) {
      console.error('❌ AppContext: Error handling rapid press confirmation:', error);
      throw error;
    }
  };

  // Reset daily status
  const resetDailyStatus = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('🔄 AppContext: Starting reset daily status');

      await workManager.resetDailyStatus(today);

      console.log('🔄 AppContext: Reset completed, refreshing states');

      // ✅ Force refresh tất cả states để đảm bảo UI được cập nhật
      const [newButtonState, todayStatus] = await Promise.all([
        workManager.getCurrentButtonState(today),
        storageService.getDailyWorkStatusForDate(today) // Sẽ trả về null sau khi reset
      ]);

      // ✅ Batch update tất cả states cùng lúc
      dispatch({ type: 'SET_BUTTON_STATE', payload: newButtonState });
      dispatch({ type: 'SET_TODAY_STATUS', payload: todayStatus });

      // ✅ Refresh weekly status và time display info
      await Promise.all([
        refreshWeeklyStatus(),
        refreshTimeDisplayInfo()
      ]);

      // ✅ Trigger refresh để force update tất cả UI components
      dispatch({ type: 'TRIGGER_REFRESH' });

      console.log(`✅ AppContext: Reset daily status completed, new button state: ${newButtonState}`);
    } catch (error) {
      console.error('Error resetting daily status:', error);
      throw error;
    }
  };

  // Refresh weather data
  const refreshWeatherData = async () => {
    try {
      if (state.settings?.weatherWarningEnabled) {
        const weatherData = await weatherService.getWeatherData(true);
        dispatch({ type: 'SET_WEATHER_DATA', payload: weatherData });
      }
    } catch (error) {
      console.error('Error refreshing weather data:', error);
    }
  };

  // Refresh button state
  const refreshButtonState = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const buttonState = await workManager.getCurrentButtonState(today);
      dispatch({ type: 'SET_BUTTON_STATE', payload: buttonState });
    } catch (error) {
      console.error('Error refreshing button state:', error);
    }
  };

  // Refresh weekly status
  const refreshWeeklyStatus = async () => {
    try {
      const weeklyStatus: Record<string, DailyWorkStatus> = {};
      const today = new Date();

      // Get current week (Monday to Sunday) - same logic as WeeklyStatusGrid
      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday

      // Get status for all 7 days of current week
      for (let i = 0; i < 7; i++) {
        const date = addDays(startOfCurrentWeek, i);
        const dateString = format(date, 'yyyy-MM-dd');

        const status = await storageService.getDailyWorkStatusForDate(dateString);
        if (status) {
          weeklyStatus[dateString] = status;
        }
      }

      dispatch({ type: 'SET_WEEKLY_STATUS', payload: weeklyStatus });
    } catch (error) {
      console.error('Error refreshing weekly status:', error);
    }
  };

  // Refresh time display info
  const refreshTimeDisplayInfo = async () => {
    try {
      const timeDisplayInfo = await workManager.getTimeDisplayInfo();
      dispatch({ type: 'SET_TIME_DISPLAY_INFO', payload: timeDisplayInfo });
    } catch (error) {
      console.error('Error refreshing time display info:', error);
    }
  };

  // ✅ Force refresh tất cả trạng thái - dùng cho debug
  const forceRefreshAllStatus = async () => {
    try {
      console.log('🔄 AppContext: Force refreshing all status...');

      const today = format(new Date(), 'yyyy-MM-dd');

      // Force tính lại trạng thái từ logs
      await workManager.recalculateFromAttendanceLogs(today);

      // Đợi một chút để đảm bảo storage được cập nhật
      await new Promise(resolve => setTimeout(resolve, 300));

      // Refresh tất cả state
      await Promise.all([
        refreshButtonState(),
        refreshWeeklyStatus(),
        refreshTimeDisplayInfo()
      ]);

      console.log('✅ AppContext: Force refresh completed');

    } catch (error) {
      console.error('❌ AppContext: Error force refreshing status:', error);
    }
  };

  // ✅ Trigger refresh để force update UI components
  const triggerRefresh = () => {
    dispatch({ type: 'TRIGGER_REFRESH' });
  };



  // Initialize app on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Refresh time display info every minute - Optimized with debouncing
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Only start interval if we have active shift and not loading
    if (!state.isLoading && state.activeShift) {
      interval = setInterval(async () => {
        try {
          const today = format(new Date(), 'yyyy-MM-dd');

          // Kiểm tra và thực hiện auto-reset nếu cần
          const wasReset = await workManager.performAutoResetIfNeeded(today);

          // Batch updates to reduce re-renders
          await Promise.all([
            refreshTimeDisplayInfo(),
            refreshButtonState()
          ]);

          // Nếu có auto-reset, refresh thêm weekly status
          if (wasReset) {
            await refreshWeeklyStatus();
            dispatch({ type: 'SET_TODAY_STATUS', payload: null });
          }
        } catch (error) {
          console.error('Error in periodic refresh:', error);
        }
      }, 60000); // Every minute
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isLoading, state.activeShift?.id]); // Use activeShift.id instead of whole object



  const contextValue: AppContextType = {
    state,
    dispatch,
    actions: {
      loadInitialData,
      updateSettings,
      setActiveShift,
      addShift,
      updateShift,
      deleteShift,
      addNote,
      updateNote,
      deleteNote,
      handleButtonPress,
      handleRapidPressConfirmed,
      resetDailyStatus,
      refreshWeatherData,
      refreshButtonState,
      refreshWeeklyStatus,
      refreshTimeDisplayInfo,
      forceRefreshAllStatus,
      triggerRefresh,

    },
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
