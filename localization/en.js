// English translations
export default {
  common: {
    appName: "Workly",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    ok: "OK",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    retry: "Retry",
    warning: "Warning",
    viewAll: "View All",
    helpCenter: "Help Center",
    support: "Support",
    locale: "en-US",
  },
  home: {
    todayShifts: "Today's Shifts",
    weeklySchedule: "Weekly Schedule",
    weather: "Weather",
    notes: "Work Notes",
    noShiftsToday: "No shifts today",
    addNewShift: "Add new shift",
    noNotes: "No notes",
    addNewNote: "Add new note",
    todayShift: "Today's Shift",
    goToWork: "Go to work",
    notStarted: "Not started",
    workingTime: "Working time: {duration}",
    weeklyStatus: "Weekly Status",
    dayDetails: "Day Details",
    date: "Date",
    status: "Status",
    checkInStatus: {
      notCheckedIn: "Not checked in",
      checkedInNotOut: "Checked in, not checked out",
      checkedInAndOut: "Checked in and checked out",
    },
    logGoWork: "Go to Work",
    logCheckIn: "Check In",
    logPunch: "Punch",
    logCheckOut: "Check Out",
    logComplete: "Complete",
    punch: "Punch",
    workingFor: "Working for {duration}",
    welcomeMessage: "Welcome to Workly, your personal shift management app!",
    weatherAlert: "Current weather: {temperature}°C - {condition}",
    shiftInstructions:
      "Tap 'Go to Work' to start your shift, then use 'Check In' when you arrive.",
    reminderNote: "You have {count} reminder(s) scheduled for today.",
    helpText: "Need help? Visit our help center or contact support.",
    activeShift: "Active Shift",
    noShiftSelected: "No shift selected",
    goWork: "Go to Work",
    checkIn: "Check In",
    checkOut: "Check Out",
    complete: "Complete",
    confirmCheckOut: "Confirm Check Out",
    confirmCheckOutMessage: "Are you sure you want to check out now?",
    onlyGoWorkModeActive:
      "You are in Go-Work-Only mode. To use all features, change settings in the Settings screen.",
    viewAll: "View All",
    confirmReset: "Confirm Reset",
    confirmResetMessage:
      "Are you sure you want to reset today's work status? This action will delete all attendance logs for today.",
    resetConfirmation: "Are you sure you want to reset today's work status?",
    goWorkDescription: "Start your workday",
    waitingCheckIn: "Waiting for Check-in",
    waitingCheckInDescription: "Ready to check in",
    completeDescription: "Finish your workday",
    completed: "Completed",
    completedDescription: "Workday completed",
  },
  shifts: {
    shiftList: "Shift List",
    addShift: "Add Shift",
    editShift: "Edit Shift",
    shiftDetails: "Shift Details",
    shiftName: "Shift Name",
    startTime: "Start Time",
    endTime: "End Time",
    daysApplied: "Days Applied",
    location: "Location",
    notes: "Notes",
    deleteShift: "Delete Shift",
    deleteShiftConfirm: "Are you sure you want to delete this shift?",
    deleteConfirm: "Confirm Delete",
    deleteConfirmMessage: 'Are you sure you want to delete the shift "{name}"?',
    noShifts: "No shifts",
    invalidTimeRange: "End time must be after start time",
    shiftSaved: "Shift saved",
    shiftDeleted: "Shift deleted",
    selectDays: "Select Days",
    showPunchButton: "Show Punch Button",
    shiftTip: "For overnight shifts, set the end time to be after midnight.",
    breakExplanation:
      "A {duration} minute break is automatically deducted from your work hours.",
    break: "Break",
    addShiftPrompt: "Tap the button below to add a new shift",
  },
  settings: {
    settings: "Settings",
    interface: "Interface",
    notifications: "Notifications",
    weather: "Weather",
    data: "Data",
    other: "Other",
    multiButtonMode: "Multi-button Mode",
    firstDayOfWeek: "First Day of Week",
    timeFormat: "Time Format",
    theme: "Theme",
    alarmSound: "Alarm Sound",
    alarmVibration: "Alarm Vibration",
    shiftChangeReminder: "Shift Change Reminder",
    weatherWarning: "Weather Warning",
    updateLocation: "Update Location",
    backupData: "Backup Data",
    restoreData: "Restore Data",
    language: "Language",
    about: "About",
    hapticFeedback: "Haptic Feedback",
    switchToLanguage: "Switch to {language}",
    options: {
      full: "Full",
      simple: "Simple",
      monday: "Monday",
      sunday: "Sunday",
      hour24: "24 Hour",
      hour12: "12 Hour",
      light: "Light",
      dark: "Dark",
      system: "System",
      askWeekly: "Ask Weekly",
      askDaily: "Ask Daily",
      auto: "Auto",
      off: "Off",
      vietnamese: "Vietnamese",
      english: "English",
    },
    descriptions: {
      multiButtonMode: "Choose how the multi-button appears on the home screen",
      firstDayOfWeek: "Choose the first day of the week in the calendar",
      timeFormat: "Choose how time is displayed",
      theme: "Choose the app's theme",
      alarmSound: "Enable/disable sound for alarm notifications",
      alarmVibration: "Enable/disable vibration for alarm notifications",
      hapticFeedback: "Enable/disable haptic feedback when pressing buttons",
      shiftChangeReminder:
        "Set reminders for when shifts are about to start or end",
      weatherWarning: "Receive alerts about extreme weather conditions",
      language: "Change the app's display language",
    },
  },
  attendance: {
    checkIn: "Check In",
    checkOut: "Check Out",
    attendanceHistory: "Attendance History",
    noAttendanceData: "No attendance data",
    checkInSuccess: "Check-in successful",
    checkOutSuccess: "Check-out successful",
    alreadyCheckedIn: "Already checked in",
    alreadyCheckedOut: "Already checked out",
    needCheckInFirst: "You need to check in first",
    noShiftsToCheckIn: "No shifts to check in",
    chooseShift: "Choose a shift",
    multipleShiftsPrompt:
      "You have multiple shifts today. Please choose one to check in:",
    multipleCheckInsPrompt:
      "You have checked in for multiple shifts. Please choose one to check out:",
    status: "Status",
    logs: "Attendance Logs",
    selectStatus: "Select Status",
    statusComplete: "Complete",
    statusIncomplete: "Incomplete",
    statusLeave: "Leave",
    statusSick: "Sick",
    statusHoliday: "Holiday",
    statusAbsent: "Absent",
    statusRV: "Late/Early",
    statusFuture: "Future Date",
    statusUnknown: "Unknown",
    cannotUpdateFutureDay: "Cannot update this status for future dates",
  },
  weather: {
    currentLocation: "Current Location",
    updatedAt: "Updated at",
    humidity: "Humidity",
    wind: "Wind",
    loadingWeather: "Loading weather data...",
    locationDenied: "Location access denied",
    weatherError: "Could not fetch weather data. Please try again later.",
    noWeatherData: "No weather data",
    loadData: "Load data",
    update: "Update",
    updatedSuccessfully: "Weather data updated successfully",
    warnings: {
      highTemp: "Unusually high temperature, drink plenty of water",
      lowTemp: "Low temperature, dress warmly",
      thunderstorm: "Thunderstorms, be careful when traveling",
      heavyRain: "Heavy rain, possible flooding",
      snow: "Snow expected, dress warmly and be careful on roads",
      strongWind: "Strong winds, secure loose items and be careful outdoors",
    },
    weatherAlert: "Weather Alert",
    departureAlert: "When leaving at {time}:",
    returnAlert: "When returning at {time}:",
    forecast: "5-Day Forecast",
    forecastError: "Could not fetch forecast data",
    today: "Today",
    tomorrow: "Tomorrow",
    nextHours: "Next 3 Hours",
  },
  notes: {
    notes: "Notes",
    addNote: "Add Note",
    editNote: "Edit Note",
    deleteNote: "Delete Note",
    deleteNoteConfirm: "Are you sure you want to delete this note?",
    saveConfirm: "Save this note?",
    title: "Title",
    content: "Content",
    reminderTime: "Reminder Time",
    reminderDays: "Reminder Days",
    associatedShifts: "Associated Shifts",
    noNotes: "No notes",
    noteSaved: "Note saved",
    noteDeleted: "Note deleted",
    today: "Today",
    tomorrow: "Tomorrow",
    titleRequired: "Title is required",
    duplicateNote: "A note with a similar title already exists",
    selectDays: "Select Days",
    selectShifts: "Select Shifts",
    addNotePrompt: "Add a new note",
    workNotes: "Work Notes",
    characterCount: "{current}/{max} characters",
    validation: {
      titleRequired: "Title is required",
      titleTooLong: "Title cannot exceed 100 characters",
      contentRequired: "Content is required",
      contentTooLong: "Content cannot exceed 300 characters",
      reminderTimeRequired: "Reminder time is required",
      reminderDaysRequired: "At least one reminder day is required",
      duplicateNote: "A note with this title and content already exists",
    },
  },
  backup: {
    backupRestore: "Backup & Restore",
    backupData: "Backup Data",
    restoreData: "Restore Data",
    backupDescription:
      "Export your data for backup or transfer to another device. The backup file will include all settings, shifts, attendance records, and notes.",
    restoreDescription:
      "Import data from a previously exported backup file. Note: Current data will be overwritten when you import new data.",
    exportData: "Export Data",
    importData: "Import Data",
    backupWarning:
      "Back up your data regularly to avoid data loss when changing devices or uninstalling the app.",
    confirmRestore: "Confirm Import",
    confirmRestoreMessage:
      "Current data will be overwritten. Are you sure you want to continue?",
    importSuccess: "Data has been imported successfully.",
    importError:
      "Could not import data. The file may be corrupted or in the wrong format.",
    sharingNotAvailable: "Sharing not available",
    sharingNotAvailableMessage: "Your device does not support file sharing.",
    processing: "Processing...",
  },
  time: {
    hour: "hour",
    hours: "hours",
    minute: "minute",
    minutes: "minutes",
    duration: "{hours} hours {minutes} minutes",
    durationHoursOnly: "{hours} hours",
    durationMinutesOnly: "{minutes} minutes",
  },
  alarm: {
    alarm: "Alarm",
    timeToWork: "Time to work",
    shiftStartingSoon: "Shift {name} will start in {minutes} minutes.",
    shiftEndingSoon: "Shift {name} will end in {minutes} minutes.",
    dismissAlarm: "Dismiss Alarm",
    displayTime: "Display time",
    sounds: {
      standard: "Standard Bell",
      gentle: "Gentle Bell",
      emergency: "Emergency Bell",
    },
  },
  errors: {
    invalidCredentials: "Invalid email or password",
    networkError: "Network error. Please check your connection",
    unknownError: "An unknown error occurred",
    sessionExpired: "Your session has expired. Please log in again",
    permissionDenied: "Permission denied",
    locationError: "Could not get your location",
    weatherError: "Could not fetch weather data",
    cannotLoadLogs: "Cannot load history. Please try again later.",
    cannotStartShift: "Cannot start work shift. Please try again later.",
    cannotCheckIn: "Cannot check in. Please try again later.",
    cannotPunch: "Cannot punch. Please try again later.",
    cannotCheckOut: "Cannot check out. Please try again later.",
    cannotCompleteShift: "Cannot complete work shift. Please try again later.",
    cannotResetStatus: "Cannot reset work status. Please try again later.",
    cannotPerformAction:
      'Cannot perform action "{action}". Please try again later.',
  },
};
