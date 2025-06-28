// Storage keys
export const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  SHIFT_LIST: 'shiftList',
  ACTIVE_SHIFT_ID: 'activeShiftId',
  ATTENDANCE_LOGS: 'attendanceLogs',
  DAILY_WORK_STATUS: 'dailyWorkStatus',
  NOTES: 'notes',
  LAST_AUTO_RESET_TIME: 'lastAutoResetTime',
  PUBLIC_HOLIDAYS: 'publicHolidays',
  WEATHER_CACHE: 'weatherCache',
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  language: 'vi',
  theme: 'light' as const,
  multiButtonMode: 'full' as const,
  alarmSoundEnabled: true,
  alarmVibrationEnabled: true,
  weatherWarningEnabled: true,
  weatherLocation: null,
  changeShiftReminderMode: 'ask_weekly' as const,
  timeFormat: '24h' as const,
  firstDayOfWeek: 'Mon' as const,
  lateThresholdMinutes: 5,
  rapidPressThresholdSeconds: 30, // Ngưỡng phát hiện "Bấm Nhanh" - mặc định 30 giây

  // ✅ Location settings
  homeLocation: null,
  workLocation: null,
  autoCheckInEnabled: false,
  autoCheckInRadius: 100, // 100 mét
  locationTrackingEnabled: false,
  overtimeRates: {
    weekday: 150,
    saturday: 200,
    sunday: 300,
    holiday: 300,
  },
  notesDisplayCount: 3 as const,
  notesTimeWindow: 'always' as const,
  notesShowConflictWarning: true,
};

// Time constants
export const TIME_CONSTANTS = {
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  MILLISECONDS_PER_MINUTE: 60 * 1000,
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

// Button states and their display info - Icons đồng bộ với Material Community Icons (đã kiểm tra tính hợp lệ)
export const BUTTON_STATES = {
  go_work: {
    text: 'ĐI LÀM',
    icon: 'run', // Icon cơ bản và hợp lệ
    color: '#4CAF50',
  },
  awaiting_check_in: {
    text: 'CHỜ CHECK-IN',
    icon: 'clock-outline',
    color: '#FF9800',
  },
  check_in: {
    text: 'CHẤM CÔNG VÀO',
    icon: 'login', // Icon cơ bản và hợp lệ
    color: '#2196F3',
  },
  // ✅ Loại bỏ working và awaiting_check_out
  check_out: {
    text: 'CHẤM CÔNG RA',
    icon: 'logout', // Icon cơ bản và hợp lệ
    color: '#FF5722',
  },
  // ✅ Loại bỏ awaiting_complete và complete vì đã tự động complete sau check_out
  completed_day: {
    text: 'ĐÃ HOÀN TẤT',
    icon: 'target', // Icon cơ bản và hợp lệ
    color: '#9E9E9E',
  },
} as const;

// Weekly status icons and colors - Sử dụng Material Community Icons với đa ngôn ngữ
export const WEEKLY_STATUS = {
  completed: {
    icon: 'check-circle',
    color: '#4CAF50',
    text: {
      vi: 'Hoàn thành',
      en: 'Completed',
    },
  },
  late: {
    icon: 'alert',
    color: '#FF9800',
    text: {
      vi: 'Đi muộn',
      en: 'Late',
    },
  },
  early: {
    icon: 'clock', // Icon cơ bản và hợp lệ
    color: '#2196F3',
    text: {
      vi: 'Về sớm',
      en: 'Early',
    },
  },
  absent: {
    icon: 'close-circle',
    color: '#F44336',
    text: {
      vi: 'Vắng mặt',
      en: 'Absent',
    },
  },
  manual_present: {
    icon: 'account-check',
    color: '#9C27B0',
    text: {
      vi: 'Có mặt (thủ công)',
      en: 'Present (manual)',
    },
  },
  manual_absent: {
    icon: 'sleep',
    color: '#607D8B',
    text: {
      vi: 'Nghỉ (thủ công)',
      en: 'Absent (manual)',
    },
  },
  manual_holiday: {
    icon: 'flag',
    color: '#E91E63',
    text: {
      vi: 'Nghỉ lễ (thủ công)',
      en: 'Holiday (manual)',
    },
  },
  manual_completed: {
    icon: 'check-circle',
    color: '#4CAF50',
    text: {
      vi: 'Hoàn thành (thủ công)',
      en: 'Completed (manual)',
    },
  },
  manual_review: {
    icon: 'eye-check',
    color: '#FF5722',
    text: {
      vi: 'Cần xem lại (thủ công)',
      en: 'Review (manual)',
    },
  },
  // ✅ Trạng thái ngày nghỉ thông thường (mặc định cho Chủ Nhật)
  day_off: {
    icon: 'calendar-remove',
    color: '#9C27B0',
    text: {
      vi: 'Ngày nghỉ thông thường',
      en: 'Regular day off',
    },
  },
  pending: {
    icon: 'help-circle',
    color: '#9E9E9E',
    text: {
      vi: 'Chưa xác định',
      en: 'Pending',
    },
  },
  review: {
    icon: 'eye-check',
    color: '#FF5722',
    text: {
      vi: 'Cần xem lại',
      en: 'Review',
    },
  },
  // Các trạng thái nghỉ mới theo yêu cầu - Sử dụng Material Community Icons với đa ngôn ngữ
  NGHI_PHEP: {
    icon: 'beach',
    color: '#00BCD4',
    text: {
      vi: 'Nghỉ Phép',
      en: 'Vacation',
    },
  },
  NGHI_BENH: {
    icon: 'hospital-box',
    color: '#FF9800',
    text: {
      vi: 'Nghỉ Bệnh',
      en: 'Sick Leave',
    },
  },
  NGHI_LE: {
    icon: 'flag',
    color: '#E91E63',
    text: {
      vi: 'Nghỉ Lễ',
      en: 'Holiday',
    },
  },
  VANG_MAT: {
    icon: 'close-circle',
    color: '#F44336',
    text: {
      vi: 'Vắng Mặt',
      en: 'Absent',
    },
  },
  CONG_TAC: {
    icon: 'airplane',
    color: '#673AB7',
    text: {
      vi: 'Công Tác',
      en: 'Business Trip',
    },
  },
  DU_CONG: {
    icon: 'check-circle',
    color: '#4CAF50',
    text: {
      vi: 'Đủ Công',
      en: 'Sufficient Work',
    },
  },
  RV: {
    icon: 'eye-check',
    color: '#FF5722',
    text: {
      vi: 'Cần Xem Lại',
      en: 'Review Required',
    },
  },
  // Các trạng thái từ DailyWorkStatusNew - Sử dụng Material Community Icons với đa ngôn ngữ
  DI_MUON: {
    icon: 'clock-alert', // Icon cơ bản và hợp lệ
    color: '#FF9800',
    text: {
      vi: 'Đi Muộn',
      en: 'Late Arrival',
    },
  },
  VE_SOM: {
    icon: 'run', // Icon cơ bản và hợp lệ
    color: '#2196F3',
    text: {
      vi: 'Về Sớm',
      en: 'Early Leave',
    },
  },
  DI_MUON_VE_SOM: {
    icon: 'alert-circle',
    color: '#FF5722',
    text: {
      vi: 'Vào muộn & Ra sớm',
      en: 'Late In & Early Out',
    },
  },
  // Các trạng thái đặc biệt cho modal - Sử dụng Material Community Icons với đa ngôn ngữ
  TINH_THEO_CHAM_CONG: {
    icon: 'calculator',
    color: '#2196F3',
    text: {
      vi: 'Tính theo Chấm công',
      en: 'Calculate by Attendance',
    },
  },
  THIEU_LOG: {
    icon: 'help-circle',
    color: '#9E9E9E',
    text: {
      vi: 'Thiếu Log',
      en: 'Missing Log',
    },
  },
  XOA_TRANG_THAI_THU_CONG: {
    icon: 'delete',
    color: '#F44336',
    text: {
      vi: 'Xóa trạng thái thủ công',
      en: 'Delete Manual Status',
    },
  },
  CHUA_DI: {
    icon: 'home',
    color: '#9E9E9E',
    text: {
      vi: 'Chưa Đi',
      en: 'Not Left',
    },
  },
  DA_DI_CHUA_VAO: {
    icon: 'walk', // Icon cơ bản và hợp lệ
    color: '#FFC107',
    text: {
      vi: 'Đã Đi Chưa Vào',
      en: 'Left But Not Checked In',
    },
  },
  CHUA_RA: {
    icon: 'briefcase',
    color: '#9C27B0',
    text: {
      vi: 'Chưa Ra',
      en: 'Not Checked Out',
    },
  },
} as const;

// Weather warning types
export const WEATHER_WARNINGS = {
  rain: {
    icon: '🌧️',
    color: '#2196F3',
    threshold: 0.5, // mm/h
  },
  heat: {
    icon: '🌡️',
    color: '#FF5722',
    threshold: 35, // °C
  },
  cold: {
    icon: '❄️',
    color: '#00BCD4',
    threshold: 10, // °C
  },
  storm: {
    icon: '⛈️',
    color: '#9C27B0',
    threshold: 50, // km/h wind speed
  },
  snow: {
    icon: '🌨️',
    color: '#607D8B',
    threshold: 0.1, // mm/h
  },
} as const;

// Languages
export const LANGUAGES = {
  vi: 'Tiếng Việt',
  en: 'English',
} as const;

// Days of week (JavaScript standard: 0 = Sunday)
export const DAYS_OF_WEEK = {
  vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const;

// Days of week for Weekly Grid (Monday first)
export const WEEKLY_GRID_DAYS = {
  vi: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], // Thứ 2 -> Chủ Nhật
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], // Monday -> Sunday
} as const;

// Months
export const MONTHS = {
  vi: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  en: [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ],
} as const;

// API endpoints (for weather and holidays)
export const API_ENDPOINTS = {
  WEATHER: 'https://api.openweathermap.org/data/2.5',
  HOLIDAYS: 'https://date.nager.at/api/v3',
} as const;

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  SHIFT_REMINDER: 'shift_reminder',
  NOTE_REMINDER: 'note_reminder',
  WEATHER_WARNING: 'weather_warning',
  SHIFT_ROTATION: 'shift_rotation',
} as const;

// ✅ DEFAULT_SHIFTS đã được thay thế bằng sampleShiftsService
// Xem src/services/sampleShifts.ts để quản lý dữ liệu mẫu ca làm việc
/*
export const DEFAULT_SHIFTS = {
  vi: [
    {
      id: 'shift_uuid_001',
      name: 'Ca 1 (Sáng)',
      startTime: '06:00',
      officeEndTime: '14:00',
      endTime: '14:30',
      departureTime: '05:15', // Trước startTime 45 phút
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      remindBeforeStart: 15,
      remindAfterEnd: 10,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      workDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_002',
      name: 'Ca 2 (Chiều)',
      startTime: '14:00',
      officeEndTime: '22:00',
      endTime: '22:30',
      departureTime: '13:15', // Trước startTime 45 phút
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      remindBeforeStart: 15,
      remindAfterEnd: 10,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      workDays: [1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_003',
      name: 'Ca 3 (Đêm)', // Ca qua đêm
      startTime: '22:00',
      officeEndTime: '06:00', // Sáng hôm sau
      endTime: '06:30',       // Sáng hôm sau
      departureTime: '21:15', // Trước startTime 45 phút
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], // Làm cả T7 đêm
      remindBeforeStart: 20,
      remindAfterEnd: 15,
      showPunch: true,
      breakMinutes: 60,
      isNightShift: true,
      workDays: [1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_hc',
      name: 'Ca Hành Chính',
      startTime: '08:00',
      officeEndTime: '17:00',
      endTime: '17:30',
      departureTime: '07:00', // Trước startTime 1 tiếng
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], // Làm cả T7
      remindBeforeStart: 15,
      remindAfterEnd: 15,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      workDays: [1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_ngay_linh_hoat',
      name: 'Ca Ngày Linh Hoạt',
      startTime: '09:00',
      officeEndTime: '18:00',
      endTime: '19:00',
      departureTime: '08:15', // Trước startTime 45 phút
      daysApplied: ['Tue', 'Wed', 'Thu', 'Sat'], // Ví dụ làm T3,4,5, T7
      remindBeforeStart: 10,
      remindAfterEnd: 5,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      workDays: [2, 3, 4, 6], // Tuesday, Wednesday, Thursday, Saturday
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_dem_cuoi_tuan',
      name: 'Ca Đêm Cuối Tuần',
      startTime: '20:00', // Ví dụ làm từ 20h T7 đến 4h sáng CN
      officeEndTime: '04:00',
      endTime: '05:00',
      departureTime: '19:00', // Trước startTime 1 tiếng
      daysApplied: ['Sat'], // Chỉ áp dụng cho ngày Thứ 7
      remindBeforeStart: 15,
      remindAfterEnd: 15,
      showPunch: true,
      breakMinutes: 60,
      isNightShift: true,
      workDays: [6], // Saturday only
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  en: [
    {
      id: 'shift_uuid_001',
      name: 'Shift 1 (Morning)',
      startTime: '06:00',
      officeEndTime: '14:00',
      endTime: '14:30',
      departureTime: '05:15', // 45 minutes before startTime
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      remindBeforeStart: 15,
      remindAfterEnd: 10,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      workDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_002',
      name: 'Shift 2 (Afternoon)',
      startTime: '14:00',
      officeEndTime: '22:00',
      endTime: '22:30',
      departureTime: '13:15', // 45 minutes before startTime
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      remindBeforeStart: 15,
      remindAfterEnd: 10,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      workDays: [1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_003',
      name: 'Shift 3 (Night)', // Overnight shift
      startTime: '22:00',
      officeEndTime: '06:00', // Next morning
      endTime: '06:30',       // Next morning
      departureTime: '21:15', // 45 minutes before startTime
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], // Including Saturday night
      remindBeforeStart: 20,
      remindAfterEnd: 15,
      showPunch: true,
      breakMinutes: 60,
      isNightShift: true,
      workDays: [1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_hc',
      name: 'Administrative Shift',
      startTime: '08:00',
      officeEndTime: '17:00',
      endTime: '17:30',
      departureTime: '07:00', // 1 hour before startTime
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], // Including Saturday
      remindBeforeStart: 15,
      remindAfterEnd: 15,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      workDays: [1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_ngay_linh_hoat',
      name: 'Flexible Day Shift',
      startTime: '09:00',
      officeEndTime: '18:00',
      endTime: '19:00',
      departureTime: '08:15', // 45 minutes before startTime
      daysApplied: ['Tue', 'Wed', 'Thu', 'Sat'], // Example: Tue, Wed, Thu, Sat
      remindBeforeStart: 10,
      remindAfterEnd: 5,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      workDays: [2, 3, 4, 6], // Tuesday, Wednesday, Thursday, Saturday
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_uuid_dem_cuoi_tuan',
      name: 'Weekend Night Shift',
      startTime: '20:00', // Example: 8 PM Saturday to 4 AM Sunday
      officeEndTime: '04:00',
      endTime: '05:00',
      departureTime: '19:00', // 1 hour before startTime
      daysApplied: ['Sat'], // Only applies to Saturday
      remindBeforeStart: 15,
      remindAfterEnd: 15,
      showPunch: true,
      breakMinutes: 60,
      isNightShift: true,
      workDays: [6], // Saturday only
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
} as const;
*/

// Public holidays (sample) - Đa ngôn ngữ
export const DEFAULT_HOLIDAYS = {
  vi: [
    { date: '2025-01-01', name: 'Tết Dương lịch', type: 'national' },
    { date: '2025-01-28', name: 'Tết Nguyên đán (29 Tết)', type: 'national' },
    { date: '2025-01-29', name: 'Tết Nguyên đán (30 Tết)', type: 'national' },
    { date: '2025-01-30', name: 'Tết Nguyên đán (Mùng 1)', type: 'national' },
    { date: '2025-01-31', name: 'Tết Nguyên đán (Mùng 2)', type: 'national' },
    { date: '2025-02-01', name: 'Tết Nguyên đán (Mùng 3)', type: 'national' },
    { date: '2025-04-30', name: 'Ngày Giải phóng miền Nam', type: 'national' },
    { date: '2025-05-01', name: 'Ngày Quốc tế Lao động', type: 'national' },
    { date: '2025-09-02', name: 'Ngày Quốc khánh', type: 'national' },
  ],
  en: [
    { date: '2025-01-01', name: 'New Year\'s Day', type: 'national' },
    { date: '2025-01-28', name: 'Lunar New Year (29th)', type: 'national' },
    { date: '2025-01-29', name: 'Lunar New Year (30th)', type: 'national' },
    { date: '2025-01-30', name: 'Lunar New Year (1st)', type: 'national' },
    { date: '2025-01-31', name: 'Lunar New Year (2nd)', type: 'national' },
    { date: '2025-02-01', name: 'Lunar New Year (3rd)', type: 'national' },
    { date: '2025-04-30', name: 'Liberation Day', type: 'national' },
    { date: '2025-05-01', name: 'International Labor Day', type: 'national' },
    { date: '2025-09-02', name: 'National Day', type: 'national' },
  ],
} as const;
