// Internationalization (i18n) system for Workly app
// Hệ thống đa ngôn ngữ cho ứng dụng Workly

export interface TranslationKeys {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    confirm: string;
    yes: string;
    no: string;
    ok: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    basicInfo: string;
  };

  // Navigation
  navigation: {
    home: string;
    shifts: string;
    notes: string;
    statistics: string;
    settings: string;
  };

  // Home Screen
  home: {
    title: string;
    noActiveShift: string;
    selectShift: string;
    currentShift: string;
    nextShift: string;
    weatherWarning: string;
    upcomingReminders: string;
    viewAll: string;
  };

  // Shifts
  shifts: {
    title: string;
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
    addShift: string;
    editShift: string;
    deleteShift: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    breakMinutes: string;
    workDays: string;
    management: string;
    selectRotation: string;
    rotationInfo: string;
    currentlyUsing: string;
    selected: string;
    selectThis: string;
    choose: string;
    nightShift: string;
    punchRequired: string;
    noShifts: string;
    createFirst: string;
    confirmRotationConfig: string;
    shiftModeConfig: string;
    mainMode: string;
    disabled: string;
    disabledDesc: string;
    askWeekly: string;
    askWeeklyDesc: string;
    rotate: string;
    rotateDesc: string;
    autoRotationConfig: string;
    selectRotationShifts: string;
    selectedShifts: string;
    current: string;
    rotationFrequency: string;
    selectFrequency: string;
    weekly: string;
    biweekly: string;
    triweekly: string;
    monthly: string;
    lastRotation: string;
    maxRotationShifts: string;
    minRotationShifts: string;
    shiftNotExist: string;
    confirmDelete: string;
    confirmDeleteMessage: string;
    successSelected: string;
    errorSelect: string;
    successDeleted: string;
    errorDelete: string;
    successUpdatedMode: string;
    errorUpdateMode: string;
    successUpdatedFrequency: string;
    errorUpdateFrequency: string;
    successConfiguredRotation: string;
    errorConfigureRotation: string;
    officeEndTime: string;
    departureTime: string;
    options: string;
    applyNow: string;
    createNew: string;
    editShiftTitle: string;
    successCreated: string;
    successCreatedAndApplied: string;
    successUpdated: string;
    errorSave: string;
    validation: {
      nameRequired: string;
      workDaysRequired: string;
      breakMinutesInvalid: string;
    };
    // Default shift names for sample data
    defaultShifts: {
      morning: string;
      afternoon: string;
      night: string;
      administrative: string;
      flexible: string;
      weekendNight: string;
      // New shift types
      shift1_8h: string;
      shift2_8h: string;
      shift3_8h: string;
      dayShift_12h: string;
      nightShift_12h: string;
      rotationShift: string;
    };
  };

  // Notes
  notes: {
    title: string;
    addNote: string;
    editNote: string;
    deleteNote: string;
    noteTitle: string;
    noteContent: string;
    reminderTime: string;
    priority: string;
    noNotes: string;
  };

  // Statistics
  statistics: {
    title: string;
    thisWeek: string;
    thisMonth: string;
    last4Weeks: string;
    totalDays: string;
    completed: string;
    totalHours: string;
    late: string;
    standardHours: string;
    overtimeHours: string;
    sundayHours: string;
    nightHours: string;
    dailyDetails: string;
    date: string;
    day: string;
    status: string;
    exportReport: string;
  };

  // Settings
  settings: {
    title: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    notifications: string;
    alarmSound: string;
    vibration: string;
    weatherWarnings: string;
    multiButtonMode: string;
    full: string;
    simple: string;
    general: string;
    notificationsAndAlarms: string;
    weather: string;
    dataManagement: string;
    sampleData: string;
    other: string;
    backupData: string;
    restoreData: string;
    resetWeatherLocation: string;
    replaceSampleData: string;
    clearAllNotes: string;
    appInfo: string;
    version: string;
    locationManagement: string;
    savedLocation: string;
    homeLocation: string;
    workLocation: string;
    and: string;
  };

  // Work Status
  workStatus: {
    completed: string;
    late: string;
    early: string;
    absent: string;
    present: string;
    holiday: string;
    sick: string;
    vacation: string;
    business: string;
    review: string;
    sufficient: string;
    dayOff: string;
  };

  // Button States
  buttonStates: {
    goWork: string;
    awaitingCheckIn: string;
    checkIn: string;
    working: string;
    awaitingCheckOut: string;
    checkOut: string;
    awaitingComplete: string;
    complete: string;
    completedDay: string;
    confirmedGoWork: string;
  };

  // Modals and Dialogs
  modals: {
    confirmAction: string;
    confirmActionMessage: string;
    continue: string;
    reset: string;
    resetConfirm: string;
    resetConfirmMessage: string;
    rapidPress: string;
    rapidPressMessage: string;
    rapidPressDetected: string;
    rapidPressConfirmMessage: string;
    rapidPressSuccess: string;
    rapidPressSuccessMessage: string;
    manualStatusUpdate: string;
    selectShift: string;
    selectWorkStatus: string;
    checkInTime: string;
    checkOutTime: string;
    punchSuccess: string;
    punchSuccessMessage: string;
    punchButton: string;
    validation: {
      required: string;
      invalidTime: string;
      timeOrder: string;
      futureDate: string;
      titleLength: string;
      contentLength: string;
      duplicateNote: string;
    };
  };

  // Time and Date
  time: {
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    nextWeek: string;
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
    hours: string;
    minutes: string;
    seconds: string;
  };

  // Weather
  weather: {
    title: string;
    current: string;
    forecast: string;
    warnings: string;
    noData: string;
    lastUpdated: string;
    refresh: string;
  };

  // Actions
  actions: {
    viewAll: string;
    hide: string;
    snooze: string;
    expand: string;
    collapse: string;
    refresh: string;
    export: string;
    import: string;
    backup: string;
    restore: string;
  };

  // Messages
  messages: {
    loadingSettings: string;
    backupFeatureComingSoon: string;
    restoreFeatureComingSoon: string;
    cannotBackupData: string;
    cannotRestoreData: string;
    locationDeletedSuccessfully: string;
    cannotDeleteLocation: string;
    sampleDataReplacedSuccessfully: string;
    cannotReplaceSampleData: string;
    allNotesDeletedSuccessfully: string;
    cannotDeleteNotes: string;
    restartAppToSeeChanges: string;
    confirmDeleteLocation: string;
    confirmDeleteLocationDescription: string;
    confirmReplaceSampleData: string;
    confirmReplaceSampleDataDescription: string;
    confirmDeleteAllNotes: string;
    confirmDeleteAllNotesDescription: string;
    actionCannotBeUndone: string;
    currentNotesCount: string;
    deleteAllNotesData: string;
    replace: string;
    deleteAll: string;
  };

  // Time and Date
  timeDate: {
    today: string;
    passed: string;
    timeError: string;
    shiftDeleted: string;
    byShift: string;
    remind: string;
    snoozeOptions: {
      title: string;
      selectTime: string;
      fiveMinutes: string;
      fifteenMinutes: string;
      thirtyMinutes: string;
      oneHour: string;
    };
  };

  // Time units
  timeUnits: {
    seconds: string;
    minutes: string;
    hours: string;
    days: string;
  };

  // Attendance History
  attendanceHistory: {
    title: string;
    totalActions: string;
    actions: {
      goWork: string;
      checkIn: string;
      punch: string;
      checkOut: string;
      complete: string;
    };
  };

  // Alarms
  alarms: {
    departureTitle: string;
    departureMessage: string;
    checkinTitle: string;
    checkinMessage: string;
    checkoutTitle: string;
    checkoutMessage: string;
    snooze5min: string;
    testTitle: string;
    testMessage: string;
  };

  // Expo Go limitations
  expo: {
    bannerTitle: string;
    bannerMessage: string;
    bannerAlternative: string;
  };
}

// Vietnamese translations
export const vi: TranslationKeys = {
  common: {
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    add: 'Thêm',
    confirm: 'Xác nhận',
    yes: 'Có',
    no: 'Không',
    ok: 'OK',
    loading: 'Đang tải...',
    error: 'Lỗi',
    success: 'Thành công',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    basicInfo: 'Thông tin cơ bản',
  },

  navigation: {
    home: 'Trang chủ',
    shifts: 'Ca làm việc',
    notes: 'Ghi chú',
    statistics: 'Thống kê',
    settings: 'Cài đặt',
  },

  home: {
    title: 'Trang chủ',
    noActiveShift: 'Chưa chọn ca làm việc',
    selectShift: 'Chọn ca làm việc',
    currentShift: 'Ca hiện tại',
    nextShift: 'Ca tiếp theo',
    weatherWarning: 'Cảnh báo thời tiết',
    upcomingReminders: 'Nhắc nhở sắp tới',
    viewAll: 'Xem tất cả',
  },

  shifts: {
    title: 'Ca làm việc',
    morning: 'Ca Sáng',
    afternoon: 'Ca Chiều',
    evening: 'Ca Tối',
    night: 'Ca Đêm',
    addShift: 'Thêm ca làm việc',
    editShift: 'Sửa ca làm việc',
    deleteShift: 'Xóa ca làm việc',
    shiftName: 'Tên ca',
    startTime: 'Giờ bắt đầu',
    endTime: 'Giờ kết thúc',
    breakMinutes: 'Thời gian nghỉ (phút)',
    workDays: 'Ngày làm việc',
    management: 'Quản lý ca',
    selectRotation: 'Chọn ca xoay vòng',
    rotationInfo: 'Chọn 2-3 ca để xoay vòng hàng tuần. Đã chọn: {count}/3',
    currentlyUsing: 'Đang áp dụng',
    selected: 'Đã chọn',
    selectThis: 'Áp dụng',
    choose: 'Chọn',
    nightShift: '🌙 Ca đêm',
    punchRequired: '✍️ Yêu cầu ký công',
    noShifts: 'Chưa có ca làm việc nào. Hãy tạo ca đầu tiên!',
    createFirst: 'Tạo ca đầu tiên',
    confirmRotationConfig: 'Xác nhận cấu hình xoay ca',
    shiftModeConfig: 'Chế độ Ca & Nhắc Đổi Ca',
    mainMode: 'Chế độ chính:',
    disabled: 'Tắt - Không có nhắc nhở hay tự động xoay ca',
    disabledDesc: 'Không có nhắc nhở hay tự động xoay ca',
    askWeekly: 'Nhắc nhở hàng tuần - Nhắc kiểm tra và thay đổi ca cuối tuần',
    askWeeklyDesc: 'Nhắc kiểm tra và thay đổi ca cuối tuần',
    rotate: 'Tự động xoay ca - Tự động thay đổi ca theo tần suất',
    rotateDesc: 'Tự động thay đổi ca theo tần suất',
    autoRotationConfig: 'Cấu hình xoay ca tự động:',
    selectRotationShifts: 'Chọn Ca Xoay Vòng ({count}/3)',
    selectedShifts: 'Ca đã chọn:',
    current: '(Hiện tại)',
    rotationFrequency: 'Tần suất xoay ca:',
    selectFrequency: 'Chọn tần suất',
    weekly: 'Sau 1 tuần',
    biweekly: 'Sau 2 tuần',
    triweekly: 'Sau 3 tuần',
    monthly: 'Sau 1 tháng',
    lastRotation: 'Lần xoay cuối: {date}',
    maxRotationShifts: 'Chỉ có thể chọn tối đa 3 ca để xoay vòng.',
    minRotationShifts: 'Vui lòng chọn ít nhất 2 ca để xoay vòng.',
    shiftNotExist: 'Ca không tồn tại',
    confirmDelete: 'Xác nhận xóa',
    confirmDeleteMessage: 'Bạn có muốn xóa ca "{name}" không?',
    successSelected: 'Đã chọn ca làm việc mới.',
    errorSelect: 'Không thể chọn ca làm việc.',
    successDeleted: 'Đã xóa ca làm việc.',
    errorDelete: 'Không thể xóa ca làm việc.',
    successUpdatedMode: 'Đã cập nhật chế độ ca làm việc.',
    errorUpdateMode: 'Không thể cập nhật chế độ ca.',
    successUpdatedFrequency: 'Đã cập nhật tần suất xoay ca.',
    errorUpdateFrequency: 'Không thể cập nhật tần suất xoay ca.',
    successConfiguredRotation: 'Đã cấu hình xoay ca thành công.',
    errorConfigureRotation: 'Không thể cấu hình xoay ca.',
    officeEndTime: 'Giờ tan ca',
    departureTime: 'Giờ khởi hành',
    remindBeforeStart: 'Nhắc trước khi bắt đầu (phút)',
    remindAfterEnd: 'Nhắc sau khi kết thúc (phút)',
    daysApplied: 'Ngày áp dụng',
    options: 'Tùy chọn',
    applyNow: 'Áp dụng ngay',
    createNew: 'Tạo ca mới',
    editShiftTitle: 'Sửa ca',
    successCreated: '✅ Đã tạo ca làm việc thành công!',
    successCreatedAndApplied: '✅ Đã tạo ca làm việc và áp dụng ngay thành công!',
    successUpdated: '✅ Đã cập nhật ca làm việc thành công!',
    errorSave: '❌ Không thể lưu ca làm việc. Vui lòng thử lại.',
    validation: {
      nameRequired: 'Tên ca là bắt buộc',
      workDaysRequired: 'Vui lòng chọn ít nhất một ngày làm việc',
      breakMinutesInvalid: 'Thời gian nghỉ phải từ 0-480 phút',
      remindBeforeStartInvalid: 'Thời gian nhắc trước phải từ 0-120 phút',
      remindAfterEndInvalid: 'Thời gian nhắc sau phải từ 0-120 phút',
      departureTimeInvalid: 'Giờ khởi hành phải trước giờ bắt đầu',
    },
    // Default shift names for sample data
    defaultShifts: {
      morning: 'Ca 1 (Sáng)',
      afternoon: 'Ca 2 (Chiều)',
      night: 'Ca 3 (Đêm)',
      administrative: 'Ca Hành Chính',
      flexible: 'Ca Ngày Linh Hoạt',
      weekendNight: 'Ca Đêm Cuối Tuần',
      // New shift types
      shift1_8h: 'Ca 1 (8 tiếng)',
      shift2_8h: 'Ca 2 (8 tiếng)',
      shift3_8h: 'Ca 3 (8 tiếng)',
      dayShift_12h: 'Ca Ngày (12 tiếng)',
      nightShift_12h: 'Ca Đêm (12 tiếng)',
      rotationShift: 'Ca Kíp'
    },
  },

  notes: {
    title: 'Ghi chú',
    addNote: 'Thêm ghi chú',
    editNote: 'Sửa ghi chú',
    deleteNote: 'Xóa ghi chú',
    noteTitle: 'Tiêu đề',
    noteContent: 'Nội dung',
    reminderTime: 'Thời gian nhắc nhở',
    priority: 'Ưu tiên',
    noNotes: 'Chưa có ghi chú nào',
  },

  statistics: {
    title: 'Thống kê',
    thisWeek: 'Tuần này',
    thisMonth: 'Tháng này',
    last4Weeks: '4 tuần qua',
    totalDays: 'Tổng ngày',
    completed: 'Hoàn thành',
    totalHours: 'Tổng giờ',
    late: 'Đi muộn',
    standardHours: 'Giờ HC',
    overtimeHours: 'Giờ OT',
    sundayHours: 'Giờ CN',
    nightHours: 'Giờ đêm',
    dailyDetails: 'Chi tiết theo ngày',
    date: 'Ngày',
    day: 'Thứ',
    status: 'TT',
    exportReport: 'Xuất báo cáo',
  },

  settings: {
    title: 'Cài đặt',
    language: 'Ngôn ngữ',
    theme: 'Giao diện',
    light: 'Sáng',
    dark: 'Tối',
    notifications: 'Thông báo',
    alarmSound: 'Âm thanh báo thức',
    vibration: 'Rung',
    weatherWarnings: 'Cảnh báo thời tiết',
    multiButtonMode: 'Chế độ nút',
    full: 'Đầy đủ',
    simple: 'Đơn giản',
    general: 'Cài đặt chung',
    notificationsAndAlarms: 'Nhắc nhở & Báo thức',
    weather: 'Thời tiết',
    dataManagement: 'Quản lý dữ liệu',
    sampleData: 'Dữ liệu mẫu (Debug)',
    other: 'Khác',
    backupData: 'Sao lưu dữ liệu',
    restoreData: 'Phục hồi dữ liệu',
    resetWeatherLocation: 'Quản lý vị trí',
    replaceSampleData: 'Thay thế bằng dữ liệu mẫu',
    clearAllNotes: 'Xóa tất cả ghi chú',
    appInfo: 'Thông tin ứng dụng',
    version: 'Phiên bản 1.0.0',
    locationManagement: 'Quản lý vị trí',
    savedLocation: 'Đã lưu',
    homeLocation: 'vị trí nhà',
    workLocation: 'vị trí công ty',
    and: ' và ',
  },

  workStatus: {
    completed: 'Hoàn thành',
    late: 'Đi muộn',
    early: 'Về sớm',
    absent: 'Vắng mặt',
    present: 'Có mặt',
    holiday: 'Nghỉ lễ',
    sick: 'Nghỉ bệnh',
    vacation: 'Nghỉ phép',
    business: 'Công tác',
    review: 'Cần xem lại',
    sufficient: 'Đủ công',
    dayOff: 'Ngày nghỉ thông thường',
  },

  buttonStates: {
    goWork: 'Đi làm',
    awaitingCheckIn: 'Chờ check-in',
    checkIn: 'Chấm công vào',
    working: 'Đang làm việc',
    awaitingCheckOut: 'Chờ check-out',
    checkOut: 'Chấm công ra',
    awaitingComplete: 'Chờ hoàn tất',
    complete: 'Hoàn tất',
    completedDay: 'Đã hoàn tất',
    confirmedGoWork: 'Đã xác nhận đi làm',
  },

  modals: {
    confirmAction: '⚠️ Xác nhận hành động',
    confirmActionMessage: 'Bạn đang {action} không đúng thời gian dự kiến. Bạn có chắc chắn muốn tiếp tục không?',
    continue: 'Tiếp tục',
    reset: 'Đặt lại',
    resetConfirm: 'Xác nhận Reset',
    resetConfirmMessage: 'Bạn có muốn reset lại trạng thái chấm công hôm nay không? Mọi dữ liệu bấm nút hôm nay sẽ bị xóa.',
    rapidPress: 'Xác nhận bấm nhanh',
    rapidPressMessage: 'Bạn đã hoàn thành quy trình chấm công rất nhanh. Bạn có muốn xác nhận đã đủ công không?',
    rapidPressDetected: '⚡ Phát hiện "Bấm Nhanh"',
    rapidPressConfirmMessage: 'Bạn đã thực hiện check-in và check-out trong thời gian rất ngắn ({duration}).\n\nBạn có muốn xác nhận và tính đủ công theo lịch trình ca không?',
    rapidPressSuccess: 'Thành công',
    rapidPressSuccessMessage: 'Đã xác nhận và tính đủ công theo lịch trình ca.',
    manualStatusUpdate: 'Cập nhật trạng thái thủ công',
    selectShift: 'Chọn ca làm việc',
    selectWorkStatus: 'Chọn trạng thái làm việc',
    checkInTime: 'Giờ vào',
    checkOutTime: 'Giờ ra',
    punchSuccess: 'Thành công',
    punchSuccessMessage: 'Đã ký công thành công!',
    punchButton: 'Ký Công',
    validation: {
      required: 'Trường này là bắt buộc',
      invalidTime: 'Thời gian không hợp lệ',
      timeOrder: 'Giờ ra phải sau giờ vào',
      futureDate: 'Không thể cập nhật ngày tương lai',
      titleLength: 'Tiêu đề không được vượt quá 100 ký tự',
      contentLength: 'Nội dung không được vượt quá 300 ký tự',
      duplicateNote: 'Ghi chú với tiêu đề và nội dung này đã tồn tại',
    },
  },

  time: {
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    tomorrow: 'Ngày mai',
    thisWeek: 'Tuần này',
    nextWeek: 'Tuần sau',
    morning: 'Sáng',
    afternoon: 'Chiều',
    evening: 'Tối',
    night: 'Đêm',
    hours: 'giờ',
    minutes: 'phút',
    seconds: 'giây',
  },

  weather: {
    title: 'Thời tiết',
    current: 'Hiện tại',
    forecast: 'Dự báo',
    warnings: 'Cảnh báo',
    noData: 'Không có dữ liệu',
    lastUpdated: 'Cập nhật lần cuối',
    refresh: 'Làm mới',
  },

  actions: {
    viewAll: 'Xem tất cả',
    hide: 'Ẩn',
    snooze: 'Báo lại',
    expand: 'Mở rộng',
    collapse: 'Thu gọn',
    refresh: 'Làm mới',
    export: 'Xuất',
    import: 'Nhập',
    backup: 'Sao lưu',
    restore: 'Khôi phục',
  },

  messages: {
    loadingSettings: 'Đang tải cài đặt...',
    backupFeatureComingSoon: 'ℹ️ Tính năng sao lưu sẽ được triển khai trong phiên bản tiếp theo.',
    restoreFeatureComingSoon: 'ℹ️ Tính năng phục hồi sẽ được triển khai trong phiên bản tiếp theo.',
    cannotBackupData: '❌ Không thể sao lưu dữ liệu.',
    cannotRestoreData: '❌ Không thể phục hồi dữ liệu.',
    locationDeletedSuccessfully: '✅ Đã xóa vị trí đã lưu thành công!',
    cannotDeleteLocation: '❌ Không thể xóa vị trí. Vui lòng thử lại.',
    sampleDataReplacedSuccessfully: '✅ Đã thay thế bằng dữ liệu mẫu thành công! Vui lòng khởi động lại ứng dụng để thấy thay đổi.',
    cannotReplaceSampleData: '❌ Không thể thay thế dữ liệu. Vui lòng thử lại.',
    allNotesDeletedSuccessfully: '✅ Đã xóa tất cả ghi chú thành công! Vui lòng khởi động lại ứng dụng để thấy thay đổi.',
    cannotDeleteNotes: '❌ Không thể xóa ghi chú. Vui lòng thử lại.',
    restartAppToSeeChanges: 'Vui lòng khởi động lại ứng dụng để thấy thay đổi.',
    confirmDeleteLocation: '⚠️ Xác nhận xóa vị trí',
    confirmDeleteLocationDescription: 'Bạn có muốn xóa vị trí đã lưu không?\nỨng dụng sẽ yêu cầu xác định vị trí lại khi bạn sử dụng tính năng chấm công.',
    confirmReplaceSampleData: '⚠️ Xác nhận thay thế dữ liệu',
    confirmReplaceSampleDataDescription: 'Bạn có muốn thay thế tất cả ghi chú hiện tại bằng dữ liệu mẫu không?\nHành động này không thể hoàn tác.',
    confirmDeleteAllNotes: '⚠️ Xác nhận xóa tất cả',
    confirmDeleteAllNotesDescription: 'Bạn có muốn xóa tất cả ghi chú không?\nHành động này không thể hoàn tác.',
    actionCannotBeUndone: 'Hành động này không thể hoàn tác.',
    currentNotesCount: 'Hiện có {count} ghi chú',
    deleteAllNotesData: 'Xóa toàn bộ dữ liệu ghi chú',
    replace: 'Thay thế',
    deleteAll: 'Xóa tất cả',
  },

  timeDate: {
    today: 'Hôm nay',
    passed: 'Đã qua',
    timeError: 'Lỗi thời gian',
    shiftDeleted: 'Ca đã bị xóa',
    byShift: 'Theo ca',
    remind: 'Nhắc',
    snoozeOptions: {
      title: 'Báo lại',
      selectTime: 'Chọn thời gian báo lại:',
      fiveMinutes: '5 phút',
      fifteenMinutes: '15 phút',
      thirtyMinutes: '30 phút',
      oneHour: '1 giờ',
    },
  },

  timeUnits: {
    seconds: 'giây',
    minutes: 'phút',
    hours: 'giờ',
    days: 'ngày',
  },

  attendanceHistory: {
    title: 'Lịch sử bấm nút hôm nay',
    totalActions: 'Tổng cộng: {count} hành động',
    actions: {
      goWork: 'Đi Làm',
      checkIn: 'Chấm Công Vào',
      punch: 'Ký Công',
      checkOut: 'Chấm Công Ra',
      complete: 'Hoàn Tất',
    },
  },

  alarms: {
    departureTitle: 'Chuẩn bị đi làm',
    departureMessage: 'Còn 30 phút nữa là giờ khởi hành ({time}) cho ca {shift}',
    checkinTitle: 'Giờ chấm công vào',
    checkinMessage: 'Đã đến giờ chấm công vào cho ca {shift}',
    checkoutTitle: 'Giờ chấm công ra',
    checkoutMessage: 'Đã đến giờ chấm công ra cho ca {shift}',
    snooze5min: '⏰ Báo lại 5 phút',
    testTitle: 'Test Báo thức',
    testMessage: 'Hệ thống báo thức đang hoạt động bình thường!',
  },

  expo: {
    bannerTitle: 'Chạy trong Expo Go',
    bannerMessage: 'Push notifications không khả dụng trong Expo Go (SDK 53+). Hệ thống báo thức với rung vẫn hoạt động bình thường.',
    bannerAlternative: '💡 Để có đầy đủ tính năng notifications, hãy sử dụng development build.',
  },
};

// English translations
export const en: TranslationKeys = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    basicInfo: 'Basic Information',
  },

  navigation: {
    home: 'Home',
    shifts: 'Shifts',
    notes: 'Notes',
    statistics: 'Statistics',
    settings: 'Settings',
  },

  home: {
    title: 'Home',
    noActiveShift: 'No active shift',
    selectShift: 'Select shift',
    currentShift: 'Current shift',
    nextShift: 'Next shift',
    weatherWarning: 'Weather warning',
    upcomingReminders: 'Upcoming reminders',
    viewAll: 'View all',
  },

  shifts: {
    title: 'Shifts',
    morning: 'Morning Shift',
    afternoon: 'Afternoon Shift',
    evening: 'Evening Shift',
    night: 'Night Shift',
    addShift: 'Add shift',
    editShift: 'Edit shift',
    deleteShift: 'Delete shift',
    shiftName: 'Shift name',
    startTime: 'Start time',
    endTime: 'End time',
    breakMinutes: 'Break time (minutes)',
    workDays: 'Work days',
    management: 'Shift Management',
    selectRotation: 'Select Rotation Shifts',
    rotationInfo: 'Select 2-3 shifts for weekly rotation. Selected: {count}/3',
    currentlyUsing: 'Currently Applied',
    selected: 'Selected',
    selectThis: 'Apply',
    choose: 'Select',
    nightShift: '🌙 Night Shift',
    punchRequired: '✍️ Punch Required',
    noShifts: 'No shifts yet. Create your first shift!',
    createFirst: 'Create First Shift',
    confirmRotationConfig: 'Confirm Rotation Configuration',
    shiftModeConfig: 'Shift Mode & Change Reminders',
    mainMode: 'Main mode:',
    disabled: 'Disabled - No reminders or automatic rotation',
    disabledDesc: 'No reminders or automatic rotation',
    askWeekly: 'Weekly Reminders - Remind to check and change shifts weekly',
    askWeeklyDesc: 'Remind to check and change shifts weekly',
    rotate: 'Auto Rotation - Automatically change shifts by frequency',
    rotateDesc: 'Automatically change shifts by frequency',
    autoRotationConfig: 'Auto rotation configuration:',
    selectRotationShifts: 'Select Rotation Shifts ({count}/3)',
    selectedShifts: 'Selected shifts:',
    current: '(Current)',
    rotationFrequency: 'Rotation frequency:',
    selectFrequency: 'Select frequency',
    weekly: 'After 1 week',
    biweekly: 'After 2 weeks',
    triweekly: 'After 3 weeks',
    monthly: 'After 1 month',
    lastRotation: 'Last rotation: {date}',
    maxRotationShifts: 'Can only select up to 3 shifts for rotation.',
    minRotationShifts: 'Please select at least 2 shifts for rotation.',
    shiftNotExist: 'Shift does not exist',
    confirmDelete: 'Confirm Delete',
    confirmDeleteMessage: 'Do you want to delete shift "{name}"?',
    successSelected: 'New shift selected successfully.',
    errorSelect: 'Cannot select shift.',
    successDeleted: 'Shift deleted successfully.',
    errorDelete: 'Cannot delete shift.',
    successUpdatedMode: 'Shift mode updated successfully.',
    errorUpdateMode: 'Cannot update shift mode.',
    successUpdatedFrequency: 'Rotation frequency updated successfully.',
    errorUpdateFrequency: 'Cannot update rotation frequency.',
    successConfiguredRotation: 'Rotation configured successfully.',
    errorConfigureRotation: 'Cannot configure rotation.',
    officeEndTime: 'Office end time',
    departureTime: 'Departure time',
    remindBeforeStart: 'Remind before start (minutes)',
    remindAfterEnd: 'Remind after end (minutes)',
    daysApplied: 'Days applied',
    options: 'Options',
    applyNow: 'Apply now',
    createNew: 'Create New Shift',
    editShiftTitle: 'Edit Shift',
    successCreated: '✅ Shift created successfully!',
    successCreatedAndApplied: '✅ Shift created and applied successfully!',
    successUpdated: '✅ Shift updated successfully!',
    errorSave: '❌ Cannot save shift. Please try again.',
    validation: {
      nameRequired: 'Shift name is required',
      workDaysRequired: 'Please select at least one work day',
      breakMinutesInvalid: 'Break time must be between 0-480 minutes',
      remindBeforeStartInvalid: 'Remind before start must be between 0-120 minutes',
      remindAfterEndInvalid: 'Remind after end must be between 0-120 minutes',
      departureTimeInvalid: 'Departure time must be before start time',
    },
    // Default shift names for sample data
    defaultShifts: {
      morning: 'Shift 1 (Morning)',
      afternoon: 'Shift 2 (Afternoon)',
      night: 'Shift 3 (Night)',
      administrative: 'Administrative Shift',
      flexible: 'Flexible Day Shift',
      weekendNight: 'Weekend Night Shift',
      // New shift types
      shift1_8h: 'Shift 1 (8 hours)',
      shift2_8h: 'Shift 2 (8 hours)',
      shift3_8h: 'Shift 3 (8 hours)',
      dayShift_12h: 'Day Shift (12 hours)',
      nightShift_12h: 'Night Shift (12 hours)',
      rotationShift: 'Rotation Shift'
    },
  },

  notes: {
    title: 'Notes',
    addNote: 'Add note',
    editNote: 'Edit note',
    deleteNote: 'Delete note',
    noteTitle: 'Title',
    noteContent: 'Content',
    reminderTime: 'Reminder time',
    priority: 'Priority',
    noNotes: 'No notes yet',
  },

  statistics: {
    title: 'Statistics',
    thisWeek: 'This week',
    thisMonth: 'This month',
    last4Weeks: 'Last 4 weeks',
    totalDays: 'Total days',
    completed: 'Completed',
    totalHours: 'Total hours',
    late: 'Late',
    standardHours: 'Standard hrs',
    overtimeHours: 'OT hrs',
    sundayHours: 'Sunday hrs',
    nightHours: 'Night hrs',
    dailyDetails: 'Daily details',
    date: 'Date',
    day: 'Day',
    status: 'Status',
    exportReport: 'Export report',
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    notifications: 'Notifications',
    alarmSound: 'Alarm sound',
    vibration: 'Vibration',
    weatherWarnings: 'Weather warnings',
    multiButtonMode: 'Button mode',
    full: 'Full',
    simple: 'Simple',
    general: 'General Settings',
    notificationsAndAlarms: 'Notifications & Alarms',
    weather: 'Weather',
    dataManagement: 'Data Management',
    sampleData: 'Sample Data (Debug)',
    other: 'Other',
    backupData: 'Backup data',
    restoreData: 'Restore data',
    resetWeatherLocation: 'Location management',
    replaceSampleData: 'Replace with sample data',
    clearAllNotes: 'Clear all notes',
    appInfo: 'App information',
    version: 'Version 1.0.0',
    locationManagement: 'Location management',
    savedLocation: 'Saved',
    homeLocation: 'home location',
    workLocation: 'work location',
    and: ' and ',
  },

  workStatus: {
    completed: 'Completed',
    late: 'Late',
    early: 'Early',
    absent: 'Absent',
    present: 'Present',
    holiday: 'Holiday',
    sick: 'Sick leave',
    vacation: 'Vacation',
    business: 'Business trip',
    review: 'Review',
    sufficient: 'Sufficient',
    dayOff: 'Regular day off',
  },

  buttonStates: {
    goWork: 'Go to work',
    awaitingCheckIn: 'Awaiting check-in',
    checkIn: 'Check in',
    working: 'Working',
    awaitingCheckOut: 'Awaiting check-out',
    checkOut: 'Check out',
    awaitingComplete: 'Awaiting complete',
    complete: 'Complete',
    completedDay: 'Completed',
    confirmedGoWork: 'Confirmed go to work',
  },

  modals: {
    confirmAction: '⚠️ Confirm Action',
    confirmActionMessage: 'You are {action} at an unexpected time. Are you sure you want to continue?',
    continue: 'Continue',
    reset: 'Reset',
    resetConfirm: 'Confirm Reset',
    resetConfirmMessage: 'Are you sure you want to reset today\'s status? All attendance data will be cleared.',
    rapidPress: 'Confirm Rapid Press',
    rapidPressMessage: 'You completed the attendance process very quickly. Do you want to confirm sufficient work?',
    rapidPressDetected: '⚡ "Rapid Press" Detected',
    rapidPressConfirmMessage: 'You completed check-in and check-out in a very short time ({duration}).\n\nDo you want to confirm and calculate sufficient work according to shift schedule?',
    rapidPressSuccess: 'Success',
    rapidPressSuccessMessage: 'Confirmed and calculated sufficient work according to shift schedule.',
    manualStatusUpdate: 'Manual Status Update',
    selectShift: 'Select Shift',
    selectWorkStatus: 'Select Work Status',
    checkInTime: 'Check-in Time',
    checkOutTime: 'Check-out Time',
    punchSuccess: 'Success',
    punchSuccessMessage: 'Punch recorded successfully!',
    punchButton: 'Punch',
    validation: {
      required: 'This field is required',
      invalidTime: 'Invalid time',
      timeOrder: 'Check-out time must be after check-in time',
      futureDate: 'Cannot update future dates',
      titleLength: 'Title cannot exceed 100 characters',
      contentLength: 'Content cannot exceed 300 characters',
      duplicateNote: 'A note with this title and content already exists',
    },
  },

  time: {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This week',
    nextWeek: 'Next week',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
  },

  weather: {
    title: 'Weather',
    current: 'Current',
    forecast: 'Forecast',
    warnings: 'Warnings',
    noData: 'No data',
    lastUpdated: 'Last updated',
    refresh: 'Refresh',
  },

  actions: {
    viewAll: 'View all',
    hide: 'Hide',
    snooze: 'Snooze',
    expand: 'Expand',
    collapse: 'Collapse',
    refresh: 'Refresh',
    export: 'Export',
    import: 'Import',
    backup: 'Backup',
    restore: 'Restore',
  },

  messages: {
    loadingSettings: 'Loading settings...',
    backupFeatureComingSoon: 'ℹ️ Backup feature will be implemented in the next version.',
    restoreFeatureComingSoon: 'ℹ️ Restore feature will be implemented in the next version.',
    cannotBackupData: '❌ Cannot backup data.',
    cannotRestoreData: '❌ Cannot restore data.',
    locationDeletedSuccessfully: '✅ Location deleted successfully!',
    cannotDeleteLocation: '❌ Cannot delete location. Please try again.',
    sampleDataReplacedSuccessfully: '✅ Sample data replaced successfully! Please restart the app to see changes.',
    cannotReplaceSampleData: '❌ Cannot replace sample data. Please try again.',
    allNotesDeletedSuccessfully: '✅ All notes deleted successfully! Please restart the app to see changes.',
    cannotDeleteNotes: '❌ Cannot delete notes. Please try again.',
    restartAppToSeeChanges: 'Please restart the app to see changes.',
    confirmDeleteLocation: '⚠️ Confirm Delete Location',
    confirmDeleteLocationDescription: 'Do you want to delete the saved location?\nThe app will request location again when you use the attendance feature.',
    confirmReplaceSampleData: '⚠️ Confirm Replace Data',
    confirmReplaceSampleDataDescription: 'Do you want to replace all current notes with sample data?\nThis action cannot be undone.',
    confirmDeleteAllNotes: '⚠️ Confirm Delete All',
    confirmDeleteAllNotesDescription: 'Do you want to delete all notes?\nThis action cannot be undone.',
    actionCannotBeUndone: 'This action cannot be undone.',
    currentNotesCount: 'Currently {count} notes',
    deleteAllNotesData: 'Delete all notes data',
    replace: 'Replace',
    deleteAll: 'Delete All',
  },

  timeDate: {
    today: 'Today',
    passed: 'Passed',
    timeError: 'Time error',
    shiftDeleted: 'Shift deleted',
    byShift: 'By shift',
    remind: 'Remind',
    snoozeOptions: {
      title: 'Snooze',
      selectTime: 'Select snooze time:',
      fiveMinutes: '5 minutes',
      fifteenMinutes: '15 minutes',
      thirtyMinutes: '30 minutes',
      oneHour: '1 hour',
    },
  },

  timeUnits: {
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
  },

  attendanceHistory: {
    title: 'Today\'s Button History',
    totalActions: 'Total: {count} actions',
    actions: {
      goWork: 'Go to Work',
      checkIn: 'Check In',
      punch: 'Punch',
      checkOut: 'Check Out',
      complete: 'Complete',
    },
  },

  alarms: {
    departureTitle: 'Prepare for Work',
    departureMessage: '30 minutes until departure time ({time}) for shift {shift}',
    checkinTitle: 'Check-in Time',
    checkinMessage: 'Time to check in for shift {shift}',
    checkoutTitle: 'Check-out Time',
    checkoutMessage: 'Time to check out for shift {shift}',
    snooze5min: '⏰ Snooze 5 min',
    testTitle: 'Test Alarm',
    testMessage: 'Alarm system is working properly!',
  },

  expo: {
    bannerTitle: 'Running in Expo Go',
    bannerMessage: 'Push notifications are not available in Expo Go (SDK 53+). Alarm system with vibration still works normally.',
    bannerAlternative: '💡 For full notification features, please use a development build.',
  },
};

// Translation function
export const getTranslations = (language: string): TranslationKeys => {
  switch (language) {
    case 'en':
      return en;
    case 'vi':
    default:
      return vi;
  }
};

// Helper function to get nested translation
export const t = (language: string, key: string): string => {
  const translations = getTranslations(language);
  const keys = key.split('.');

  let result: any = translations;
  for (const k of keys) {
    result = result?.[k];
    if (result === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return result;
};
