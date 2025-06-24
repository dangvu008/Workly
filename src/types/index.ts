// Workly App Types
export interface UserSettings {
  language: string;
  theme: 'light' | 'dark';
  multiButtonMode: 'full' | 'simple';
  alarmSoundEnabled: boolean;
  alarmVibrationEnabled: boolean;
  weatherWarningEnabled: boolean;
  weatherLocation: WeatherLocation | null;
  changeShiftReminderMode: 'ask_weekly' | 'rotate' | 'disabled';
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 'Mon' | 'Sun';
  lateThresholdMinutes: number;
  rapidPressThresholdSeconds: number; // Ngưỡng phát hiện "Bấm Nhanh" (giây)
  overtimeRates: {
    weekday: number;
    saturday: number;
    sunday: number;
    holiday: number;
  };
  notesDisplayCount: 2 | 3 | 4 | 5;
  notesTimeWindow: 5 | 15 | 30 | 60 | 'always'; // minutes or 'always'
  notesShowConflictWarning: boolean;
  rotationConfig?: {
    rotationShifts: string[];
    rotationFrequency: 'weekly' | 'biweekly' | 'triweekly' | 'monthly';
    rotationLastAppliedDate?: string;
    currentRotationIndex: number;
  };
}

export interface WeatherLocation {
  home: { lat: number; lon: number } | null;
  work: { lat: number; lon: number } | null;
  useSingleLocation: boolean;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  officeEndTime: string; // HH:MM format
  departureTime: string; // HH:MM format
  daysApplied: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  remindBeforeStart: number; // Minutes before start time to remind
  remindAfterEnd: number; // Minutes after end time to remind
  showPunch: boolean;
  breakMinutes: number;
  isNightShift: boolean;
  workDays: number[]; // 0-6 (Sunday-Saturday) - kept for backward compatibility
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface AttendanceLog {
  type: 'go_work' | 'check_in' | 'punch' | 'check_out' | 'complete';
  time: string; // ISO 8601 timestamp
}

export interface DailyWorkStatus {
  status: 'completed' | 'late' | 'early' | 'absent' | 'manual_present' | 'manual_absent' | 'manual_holiday' | 'manual_completed' | 'manual_review' | 'day_off' | 'pending' | 'NGHI_PHEP' | 'NGHI_BENH' | 'NGHI_LE' | 'VANG_MAT' | 'CONG_TAC' | 'DU_CONG' | 'RV' | 'DI_MUON' | 'VE_SOM' | 'DI_MUON_VE_SOM' | 'CHUA_DI' | 'DA_DI_CHUA_VAO' | 'CHUA_RA' | 'TINH_THEO_CHAM_CONG' | 'THIEU_LOG' | 'XOA_TRANG_THAI_THU_CONG';
  appliedShiftIdForDay?: string; // ID ca làm việc áp dụng cho ngày này
  vaoLogTime?: string; // ISO 8601 timestamp
  raLogTime?: string; // ISO 8601 timestamp
  standardHoursScheduled: number;
  otHoursScheduled: number;
  sundayHoursScheduled: number;
  nightHoursScheduled: number;
  totalHoursScheduled: number;
  lateMinutes: number;
  earlyMinutes: number;
  isHolidayWork: boolean;
  isManualOverride?: boolean; // Đánh dấu trạng thái được cập nhật thủ công
}

// New DailyWorkStatus with enhanced logic
export interface DailyWorkStatusNew {
  date: string;
  status: 'DU_CONG' | 'DI_MUON' | 'VE_SOM' | 'DI_MUON_VE_SOM' | 'CHUA_DI' | 'DA_DI_CHUA_VAO' | 'CHUA_RA';
  vaoLogTime: string | null; // ISO 8601 timestamp
  raLogTime: string | null; // ISO 8601 timestamp
  standardHours: number; // Calculated based on logic
  otHours: number; // Overtime hours
  totalHours: number; // Total work hours
  sundayHours: number; // Sunday work hours
  nightHours: number; // Night work hours (22:00-06:00)
  isHolidayWork: boolean; // Whether this is holiday work
  notes: string; // Additional notes
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPriority: boolean;
  reminderDateTime?: string; // ISO 8601 timestamp
  associatedShiftIds?: string[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  isHiddenFromHome?: boolean; // Temporarily hidden from home screen
  snoozeUntil?: string; // ISO 8601 timestamp - snoozed until this time
  enableNotifications?: boolean; // ✅ Cho phép hiển thị thông báo/nhắc nhở (mặc định: true)
}

export interface WeatherData {
  current: {
    temperature: number;
    description: string;
    icon: string;
    location: string;
  };
  forecast: Array<{
    time: string;
    temperature: number;
    description: string;
    icon: string;
  }>;
  warnings?: Array<{
    type: 'rain' | 'heat' | 'cold' | 'storm' | 'snow';
    message: string;
    location: 'home' | 'work';
    time: string;
  }>;
  lastUpdated: string;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'national' | 'regional';
}

// Navigation types
export type TabParamList = {
  HomeTab: undefined;
  ShiftsTab: undefined;
  NotesTab: undefined;
  StatisticsTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen?: keyof TabParamList } | undefined;
  ShiftManagement: { mode?: 'select_rotation' };
  AddEditShift: { shiftId?: string; applyImmediately?: boolean };
  NoteDetail: { noteId?: string };
  WeatherDetail: undefined;

};

// Multi-function button states
export type ButtonState =
  | 'go_work'
  | 'awaiting_check_in'
  | 'check_in'
  | 'check_out'
  | 'completed_day';
  // ✅ Loại bỏ working, awaiting_check_out, awaiting_complete, complete vì đã tự động complete sau check_out

// Exception for rapid press detection - yêu cầu xác nhận từ người dùng
export class RapidPressDetectedException extends Error {
  constructor(
    public actualDurationSeconds: number,
    public thresholdSeconds: number,
    public checkInTime: string,
    public checkOutTime: string
  ) {
    super(`Rapid press detected: ${actualDurationSeconds}s < ${thresholdSeconds}s`);
    this.name = 'RapidPressDetectedException';
  }
}

// Weekly status icons - Sử dụng Material Community Icons
export type WeeklyStatusIcon =
  | 'check-circle' // completed
  | 'alert' // late
  | 'clock-fast' // early
  | 'close-circle' // absent
  | 'account-check' // manual_present
  | 'sleep' // manual_absent
  | 'flag' // manual_holiday
  | 'help-circle' // pending/future
  | 'eye-check'; // review needed

export interface AlarmData {
  id: string;
  title: string;
  message: string;
  scheduledTime: string; // ISO 8601 timestamp
  type: 'shift_reminder' | 'note_reminder';
  relatedId?: string; // shift ID or note ID
}
