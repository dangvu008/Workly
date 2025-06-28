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
import { notificationService } from '../services/notifications';
import { alarmService } from '../services/alarmService';
import { dayOffService } from '../services/dayOffService';
import { EXPO_GO_CONFIG, shouldLoadService } from '../config/expoGoOptimization';
import { isExpoGo } from '../utils/expoGoCompat';
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
    refreshShifts: () => Promise<void>;
    syncNotes: () => Promise<void>;
    cleanupDuplicateLogs: () => Promise<void>;
    checkNotificationStatus: () => Promise<any>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data - Tối ưu hóa tốc độ loading
  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // ✅ Bước 1: Load dữ liệu cơ bản trước (critical path)
      const [settings, activeShiftId, finalShifts] = await Promise.all([
        storageService.getUserSettings(),
        storageService.getActiveShiftId(),
        storageService.getShiftList(),
      ]);

      // ✅ Bước 2: Khởi tạo services trong background (non-blocking)
      // Skip heavy services trên Expo Go để tăng tốc độ loading
      const servicesToInit = [];

      if (shouldLoadService('notificationService')) {
        servicesToInit.push(notificationService.initialize());
      } else {
        console.log('⚠️ Skipping notification service on Expo Go');
      }

      if (shouldLoadService('alarmService') && !EXPO_GO_CONFIG.DISABLE_AUDIO_SERVICES) {
        servicesToInit.push(alarmService.initialize());
      } else {
        console.log('⚠️ Skipping alarm service on Expo Go');
      }

      const servicesInitPromise = servicesToInit.length > 0
        ? Promise.allSettled(servicesToInit).then(results => {
            results.forEach((result, index) => {
              if (result.status === 'rejected') {
                const serviceNames = ['Notification', 'Alarm'];
                console.warn(`⚠️ ${serviceNames[index]} service init failed:`, result.reason);
              }
            });
          })
        : Promise.resolve();

      // ✅ Dispatch data cơ bản ngay lập tức để UI hiển thị nhanh
      dispatch({ type: 'SET_SHIFTS', payload: finalShifts });
      dispatch({ type: 'SET_SETTINGS', payload: settings });

      // Set active shift ngay lập tức
      const activeShift = activeShiftId ? finalShifts.find(s => s.id === activeShiftId) || null : null;
      dispatch({ type: 'SET_ACTIVE_SHIFT', payload: activeShift });

      // ✅ Load critical data và notes song song
      const today = format(new Date(), 'yyyy-MM-dd');
      const [todayStatus, buttonState, syncedNotes] = await Promise.all([
        storageService.getDailyWorkStatusForDate(today),
        workManager.getCurrentButtonState(today),
        storageService.getNotes(),
      ]);

      dispatch({ type: 'SET_TODAY_STATUS', payload: todayStatus });
      dispatch({ type: 'SET_BUTTON_STATE', payload: buttonState });
      dispatch({ type: 'SET_NOTES', payload: syncedNotes });

      // ✅ Ẩn loading ngay sau khi có dữ liệu cơ bản
      dispatch({ type: 'SET_LOADING', payload: false });

      // ✅ Đợi services init hoàn thành trước khi setup background tasks
      await servicesInitPromise;

      // Load các dữ liệu phụ trong background (không block UI)
      const backgroundTasks = [
        refreshWeeklyStatus(),
        refreshTimeDisplayInfo(),
      ];

      // ✅ Skip weather service trên Expo Go
      if (!EXPO_GO_CONFIG.DISABLE_WEATHER_SERVICE && settings.weatherWarningEnabled) {
        backgroundTasks.push(
          weatherService.getWeatherData().then(data =>
            dispatch({ type: 'SET_WEATHER_DATA', payload: data })
          ).catch(err => console.warn('Weather service failed:', err))
        );
      }

      Promise.all(backgroundTasks).catch(error => {
        console.error('Error loading background data:', error);
      });

      // Setup notifications và services trong background
      Promise.all([
        // Check shift rotation
        workManager.checkAndRotateShifts(),
        // Setup reminders nếu có active shift
        activeShift ? (async () => {
          const { reminderSyncService } = await import('../services/reminderSync');
          await Promise.all([
            reminderSyncService.forceResetForNewShift(activeShift),
            workManager.scheduleWeeklyReminder(),
          ]);
        })() : Promise.resolve(),
        // Initialize day offs
        dayOffService.initializeDayOffs(),
        // 🤖 Initialize auto mode service (có thể chạy trên Expo Go)
        (async () => {
          try {
            const { autoModeService } = await import('../services/autoMode');
            await autoModeService.initialize();
          } catch (error) {
            console.warn('⚠️ Auto mode service init failed:', error);
          }
        })(),
        // 🎯 Initialize auto check-in service
        (async () => {
          try {
            if (settings.locationTrackingEnabled && settings.autoCheckInEnabled) {
              const { autoCheckInService } = await import('../services/autoCheckInService');
              await autoCheckInService.initialize();
            }
          } catch (error) {
            console.warn('⚠️ Auto check-in service init failed:', error);
          }
        })(),
      ]).catch(error => {
        console.error('Error setting up background services:', error);
      });

    } catch (error) {
      console.error('Error loading initial data:', error);
      // Đảm bảo loading được tắt ngay cả khi có lỗi
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update settings
  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const newSettings = await storageService.updateUserSettings(updates);
      dispatch({ type: 'SET_SETTINGS', payload: newSettings });

      // 🤖 Handle auto mode changes
      if (updates.multiButtonMode !== undefined) {
        const { autoModeService } = await import('../services/autoMode');
        await autoModeService.updateMode(updates.multiButtonMode);
      }

      // 🎯 Handle location settings changes
      if ('locationTrackingEnabled' in updates || 'autoCheckInEnabled' in updates) {
        try {
          const { autoCheckInService } = await import('../services/autoCheckInService');
          const shouldEnable = newSettings.locationTrackingEnabled && newSettings.autoCheckInEnabled;
          await autoCheckInService.updateSettings(shouldEnable);
        } catch (error) {
          console.warn('⚠️ Error updating auto check-in service:', error);
        }
      }

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

      // ✅ Dọn dẹp và lập lịch lại thông báo cho ca mới
      console.log('🔄 AppContext: Bắt đầu cập nhật thông báo cho ca mới...');

      // Hủy tất cả thông báo cũ trước
      await notificationService.cancelAllShiftReminders();
      await alarmService.cancelShiftReminders();
      await notificationService.cancelWeeklyReminders();
      console.log('🧹 AppContext: Đã hủy tất cả thông báo cũ');

      // Lập lịch thông báo mới nếu có active shift
      if (activeShift) {
        // ✅ SỬ DỤNG FORCE RESET: Tránh "cơn bão" thông báo từ sự kiện đã qua
        console.log('🔄 AppContext: Using forceResetForNewShift to prevent immediate notifications');

        // Import ReminderSyncService
        const { reminderSyncService } = await import('../services/reminderSync');

        // Force reset với logic "chỉ tương lai"
        await Promise.all([
          reminderSyncService.forceResetForNewShift(activeShift),
          workManager.scheduleWeeklyReminder()
        ]);

        console.log(`✅ AppContext: Đã force reset thông báo cho ca ${activeShift.name} - không có thông báo ngay lập tức`);
      } else {
        console.log('ℹ️ AppContext: Không có ca hoạt động, bỏ qua lập lịch thông báo');
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

      // If this is the active shift, reschedule reminders
      if (state.activeShift?.id === shiftId) {
        console.log('🔄 AppContext: Updating active shift, rescheduling notifications...');

        // ✅ Hủy tất cả thông báo cũ trước khi lập lịch mới
        await notificationService.cancelAllShiftReminders();
        await alarmService.cancelShiftReminders();

        const updatedShift = { ...state.activeShift, ...updates };

        // ✅ SỬ DỤNG FORCE RESET: Tránh "cơn bão" thông báo khi cập nhật ca
        console.log('🔄 AppContext: Using forceResetForNewShift for shift update');

        // Import ReminderSyncService
        const { reminderSyncService } = await import('../services/reminderSync');

        // Force reset với logic "chỉ tương lai"
        await reminderSyncService.forceResetForNewShift(updatedShift);

        console.log(`✅ AppContext: Đã force reset thông báo cho ca ${updatedShift.name} - không có thông báo ngay lập tức`);
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
        await notificationService.cancelShiftReminders();
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

      // Schedule reminder if set (both notifications and alarms)
      // Hỗ trợ cả specific datetime và shift-based reminders
      if (note.reminderDateTime || (note.associatedShiftIds && note.associatedShiftIds.length > 0)) {
        // ✅ Đánh dấu là user-initiated action khi thêm note có reminder
        const actionId = `addNote_${note.id}_${Date.now()}`;
        notificationService.markAsUserInitiated(actionId);

        await Promise.all([
          notificationService.scheduleNoteReminder(note),
          alarmService.scheduleNoteReminder(note)
        ]);
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

      // Update reminder (both notifications and alarms)
      await notificationService.cancelNoteReminder(noteId);
      await alarmService.cancelNoteReminder(noteId);

      const updatedNote = state.notes.find(n => n.id === noteId);
      if (updatedNote) {
        const newNote = { ...updatedNote, ...updates } as Note;
        // Hỗ trợ cả specific datetime và shift-based reminders
        if (newNote.reminderDateTime || (newNote.associatedShiftIds && newNote.associatedShiftIds.length > 0)) {
          // ✅ Đánh dấu là user-initiated action khi cập nhật note có reminder
          const actionId = `updateNote_${noteId}_${Date.now()}`;
          notificationService.markAsUserInitiated(actionId);

          await Promise.all([
            notificationService.scheduleNoteReminder(newNote),
            alarmService.scheduleNoteReminder(newNote)
          ]);
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

      // Cancel reminder (both notifications and alarms)
      await notificationService.cancelNoteReminder(noteId);
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

      // Force refresh button state immediately
      const newButtonState = await workManager.getCurrentButtonState(today);
      dispatch({ type: 'SET_BUTTON_STATE', payload: newButtonState });

      // Clear today status
      dispatch({ type: 'SET_TODAY_STATUS', payload: null });

      // Refresh other states
      await refreshWeeklyStatus();

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

  // ✅ Refresh shifts data - tải lại danh sách ca làm việc
  const refreshShifts = async () => {
    try {
      console.log('🔄 AppContext: Refreshing shifts data...');

      // Tải lại danh sách ca từ storage (sẽ tự động thêm ca mẫu mới nếu có)
      const shifts = await storageService.getShiftList();
      dispatch({ type: 'SET_SHIFTS', payload: shifts });

      // Cập nhật active shift nếu cần
      const activeShiftId = await storageService.getActiveShiftId();
      const activeShift = activeShiftId ? shifts.find(s => s.id === activeShiftId) || null : null;
      dispatch({ type: 'SET_ACTIVE_SHIFT', payload: activeShift });

      console.log(`✅ AppContext: Refreshed ${shifts.length} shifts`);
    } catch (error) {
      console.error('❌ AppContext: Error refreshing shifts:', error);
    }
  };

  // ✅ Sync notes data - đồng bộ ghi chú với ca làm việc
  const syncNotes = async () => {
    try {
      console.log('🔄 AppContext: Syncing notes data...');

      // Tải lại ghi chú từ storage (sẽ tự động sửa chữa liên kết ca bị xóa)
      const notes = await storageService.getNotes();
      dispatch({ type: 'SET_NOTES', payload: notes });

      console.log(`✅ AppContext: Synced ${notes.length} notes`);
    } catch (error) {
      console.error('❌ AppContext: Error syncing notes:', error);
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
        refreshTimeDisplayInfo(),
        refreshShifts(),
        syncNotes()
      ]);

      console.log('✅ AppContext: Force refresh completed');

    } catch (error) {
      console.error('❌ AppContext: Error force refreshing status:', error);
    }
  };

  // ✅ Clean up duplicate logs
  const cleanupDuplicateLogs = async () => {
    try {
      console.log('🧹 AppContext: Cleaning up duplicate logs...');

      const today = format(new Date(), 'yyyy-MM-dd');
      await workManager.cleanupDuplicateLogs(today);

      // Refresh states after cleanup
      await Promise.all([
        refreshButtonState(),
        refreshWeeklyStatus(),
        refreshTimeDisplayInfo()
      ]);

      console.log('✅ AppContext: Duplicate logs cleaned up');

    } catch (error) {
      console.error('❌ AppContext: Error cleaning up duplicate logs:', error);
      throw error;
    }
  };

  // ✅ PRODUCTION: Debug functions removed

  // ✅ Check notification status for current shift
  const checkNotificationStatus = async () => {
    try {
      console.log('🔍 AppContext: Checking notification status...');

      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();

      // Get alarm status
      const alarmStatus = await alarmService.getAlarmStatus();

      // Get current shift info
      const activeShift = state.activeShift;

      // Get today's logs
      const todayLogs = await storageService.getAttendanceLogsForDate(today);

      // Get button state
      const buttonState = await workManager.getCurrentButtonState(today);

      const status = {
        timestamp: now.toLocaleString('vi-VN'),
        activeShift: activeShift ? {
          id: activeShift.id,
          name: activeShift.name,
          departureTime: activeShift.departureTime,
          startTime: activeShift.startTime,
          endTime: activeShift.endTime,
          officeEndTime: activeShift.officeEndTime,
          workDays: activeShift.workDays,
          isNightShift: activeShift.isNightShift
        } : null,
        alarmStatus: {
          scheduledCount: alarmStatus.scheduledCount || 0,
          activeCount: alarmStatus.activeCount || 0,
          alarms: (alarmStatus.alarms || []).map((alarm: any) => ({
            id: alarm.id,
            title: alarm.title,
            scheduledTime: alarm.scheduledTime ? alarm.scheduledTime.toLocaleString('vi-VN') : 'N/A',
            type: alarm.type,
            relatedId: alarm.relatedId,
            isActive: alarm.isActive
          }))
        },
        todayLogs: todayLogs.map((log: any) => ({
          type: log.type,
          time: new Date(log.time).toLocaleString('vi-VN')
        })),
        buttonState,
        settings: {
          alarmSoundEnabled: state.settings?.alarmSoundEnabled,
          alarmVibrationEnabled: state.settings?.alarmVibrationEnabled,
          language: state.settings?.language
        }
      };

      console.log('📊 Notification Status:', JSON.stringify(status, null, 2));
      return status;

    } catch (error) {
      console.error('❌ AppContext: Error checking notification status:', error);
      throw error;
    }
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
      refreshShifts,
      syncNotes,
      cleanupDuplicateLogs,
      checkNotificationStatus,
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
