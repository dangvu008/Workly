/**
 * ✅ Sample Shifts Service - Quản lý dữ liệu mẫu ca làm việc với đa ngôn ngữ
 * Cung cấp dữ liệu mẫu ban đầu kèm theo ứng dụng (người dùng có thể xóa/chỉnh sửa)
 */

import { Shift } from '../types';
import { t } from '../i18n';

/**
 * ✅ Tạo dữ liệu mẫu ca làm việc với đa ngôn ngữ
 * @param language - Ngôn ngữ hiện tại ('vi' hoặc 'en')
 * @returns Array of sample shifts with localized names
 */
export const createSampleShifts = (language: string = 'vi'): Shift[] => {
  const currentDate = new Date().toISOString();

  return [
    // Ca 1 (8 tiếng) - 06:00-14:00
    {
      id: 'shift_uuid_1_8h',
      name: t(language, 'shifts.defaultShifts.shift1_8h'),
      startTime: '06:00',
      officeEndTime: '14:00',
      endTime: '14:30',
      departureTime: '05:15', // Trước startTime 45 phút
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      remindBeforeStart: 15,
      remindAfterEnd: 10,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      createdAt: currentDate,
      updatedAt: currentDate
    },
    // Ca 2 (8 tiếng) - 14:00-22:00
    {
      id: 'shift_uuid_2_8h',
      name: t(language, 'shifts.defaultShifts.shift2_8h'),
      startTime: '14:00',
      officeEndTime: '22:00',
      endTime: '22:30',
      departureTime: '13:15', // Trước startTime 45 phút
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      remindBeforeStart: 15,
      remindAfterEnd: 10,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      createdAt: currentDate,
      updatedAt: currentDate
    },
    // Ca 3 (8 tiếng) - 22:00-06:00
    {
      id: 'shift_uuid_3_8h',
      name: t(language, 'shifts.defaultShifts.shift3_8h'),
      startTime: '22:00',
      officeEndTime: '06:00', // Sáng hôm sau
      endTime: '06:30',       // Sáng hôm sau
      departureTime: '21:15', // Trước startTime 45 phút
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      remindBeforeStart: 20,
      remindAfterEnd: 15,
      showPunch: true,
      breakMinutes: 60,
      isNightShift: true, // ✅ Ca đêm
      createdAt: currentDate,
      updatedAt: currentDate
    },
    // Ca Ngày (12 tiếng) - 06:00-18:00
    {
      id: 'shift_uuid_day_12h',
      name: t(language, 'shifts.defaultShifts.dayShift_12h'),
      startTime: '06:00',
      officeEndTime: '18:00',
      endTime: '18:30',
      departureTime: '05:00', // Trước startTime 1 tiếng
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      remindBeforeStart: 30,
      remindAfterEnd: 15,
      showPunch: true,
      breakMinutes: 120, // 2 tiếng nghỉ cho ca 12h
      isNightShift: false,
      createdAt: currentDate,
      updatedAt: currentDate
    },
    // Ca Đêm (12 tiếng) - 18:00-06:00
    {
      id: 'shift_uuid_night_12h',
      name: t(language, 'shifts.defaultShifts.nightShift_12h'),
      startTime: '18:00',
      officeEndTime: '06:00', // Sáng hôm sau
      endTime: '06:30',       // Sáng hôm sau
      departureTime: '17:00', // Trước startTime 1 tiếng
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      remindBeforeStart: 30,
      remindAfterEnd: 20,
      showPunch: true,
      breakMinutes: 120, // 2 tiếng nghỉ cho ca 12h
      isNightShift: true, // ✅ Ca đêm
      createdAt: currentDate,
      updatedAt: currentDate
    },
    // Ca Kíp (xoay ca linh hoạt)
    {
      id: 'shift_uuid_rotation',
      name: t(language, 'shifts.defaultShifts.rotationShift'),
      startTime: '08:00',
      officeEndTime: '16:00',
      endTime: '16:30',
      departureTime: '07:15', // Trước startTime 45 phút
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      remindBeforeStart: 15,
      remindAfterEnd: 10,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      createdAt: currentDate,
      updatedAt: currentDate
    },
    // Ca Hành Chính
    {
      id: 'shift_uuid_hc',
      name: t(language, 'shifts.defaultShifts.administrative'),
      startTime: '08:00',
      officeEndTime: '17:00',
      endTime: '17:30',
      departureTime: '07:00', // Trước startTime 1 tiếng
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      remindBeforeStart: 15,
      remindAfterEnd: 15,
      showPunch: false,
      breakMinutes: 60,
      isNightShift: false,
      createdAt: currentDate,
      updatedAt: currentDate
    }
  ];
};

/**
 * ✅ Cập nhật tên ca mẫu theo ngôn ngữ hiện tại
 * @param shifts - Danh sách ca hiện tại
 * @param language - Ngôn ngữ mới
 * @returns Updated shifts with localized names for sample shifts only
 */
export const updateShiftNamesForLanguage = (shifts: Shift[], language: string): Shift[] => {
  const sampleShifts = createSampleShifts(language);
  
  return shifts.map(shift => {
    // Tìm ca mẫu tương ứng dựa trên ID
    const sampleShift = sampleShifts.find(sample => sample.id === shift.id);

    if (sampleShift) {
      // Cập nhật tên ca mẫu theo ngôn ngữ mới, giữ nguyên các thông tin khác
      return {
        ...shift,
        name: sampleShift.name,
        updatedAt: new Date().toISOString()
      };
    }

    // Nếu không phải ca mẫu, giữ nguyên (ca tùy chỉnh của user)
    return shift;
  });
};

/**
 * ✅ Kiểm tra xem có phải ca mẫu không
 * @param shiftId - ID của ca
 * @returns true nếu là ca mẫu (có thể xóa được)
 */
export const isSampleShift = (shiftId: string): boolean => {
  const sampleShiftIds = [
    // Ca 8 tiếng
    'shift_uuid_1_8h',
    'shift_uuid_2_8h',
    'shift_uuid_3_8h',
    // Ca 12 tiếng
    'shift_uuid_day_12h',
    'shift_uuid_night_12h',
    // Ca kíp và hành chính
    'shift_uuid_rotation',
    'shift_uuid_hc'
  ];

  return sampleShiftIds.includes(shiftId);
};

/**
 * ✅ Lấy mapping ngày trong tuần theo ngôn ngữ (JavaScript standard: 0 = Sunday)
 * @param language - Ngôn ngữ hiện tại
 * @returns Object mapping day numbers to localized day names
 */
export const getDayNamesMapping = (language: string) => {
  if (language === 'vi') {
    return {
      0: 'CN', // Chủ Nhật
      1: 'T2', // Thứ 2
      2: 'T3', // Thứ 3
      3: 'T4', // Thứ 4
      4: 'T5', // Thứ 5
      5: 'T6', // Thứ 6
      6: 'T7'  // Thứ 7
    };
  } else {
    return {
      0: 'Sun', // Sunday
      1: 'Mon', // Monday
      2: 'Tue', // Tuesday
      3: 'Wed', // Wednesday
      4: 'Thu', // Thursday
      5: 'Fri', // Friday
      6: 'Sat'  // Saturday
    };
  }
};

/**
 * ✅ Lấy mapping ngày trong tuần cho Weekly Grid (bắt đầu từ thứ Hai)
 * @param language - Ngôn ngữ hiện tại
 * @returns Array tên ngày theo thứ tự: [Thứ 2, Thứ 3, ..., Chủ Nhật]
 */
export const getWeeklyGridDayNames = (language: string) => {
  if (language === 'vi') {
    return ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']; // Thứ 2 -> Chủ Nhật
  } else {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Monday -> Sunday
  }
};

/**
 * ✅ Chuyển đổi workDays array thành chuỗi hiển thị theo ngôn ngữ
 * @param workDays - Array các ngày làm việc (0-6)
 * @param language - Ngôn ngữ hiện tại
 * @returns Formatted string of work days
 */
export const formatWorkDays = (workDays: number[], language: string): string => {
  const dayNames = getDayNamesMapping(language);
  return workDays.map(day => dayNames[day as keyof typeof dayNames]).join(', ');
};

/**
 * ✅ Service chính để quản lý ca làm việc mẫu
 */
export const sampleShiftsService = {
  createSampleShifts,
  updateShiftNamesForLanguage,
  isSampleShift,
  getDayNamesMapping,
  getWeeklyGridDayNames,
  formatWorkDays
};
