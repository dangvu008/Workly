"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storage";
import { getDayOfWeek, timeToMinutes } from "../utils/dateUtils";
import {
  isLogValidForShift,
  calculateAttendanceStatus,
} from "../utils/attendanceUtils";
import {
  checkExtremeWeather,
  formatWeatherAlertMessage,
} from "../utils/weatherUtils";
import {
  scheduleNotification,
  cancelNotification,
  scheduleShiftReminders,
  scheduleNoteReminders,
  scheduleWeatherAlert,
} from "../utils/notificationUtils";

const AppContext = createContext();

// User settings with defaults
const defaultUserSettings = {
  multiButtonMode: "full", // Options: "full", "go_work_only"
  firstDayOfWeek: "Mon",
  timeFormat: "24h",
  theme: "light", // Options: "light", "dark", "system"
  alarmSoundEnabled: true,
  alarmVibrationEnabled: true,
  hapticFeedbackEnabled: true,
  changeShiftReminderMode: "ask_weekly",
  weatherWarningEnabled: true,
  shiftReminderEnabled: true,
  language: "vi",
  weatherLocation: null,
  onlyGoWorkMode: false, // Setting for Go-Work-Only mode
};

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [notes, setNotes] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [dailyWorkStatus, setDailyWorkStatus] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [scheduledNotifications, setScheduledNotifications] = useState({});
  const [weatherAlerts, setWeatherAlerts] = useState({});
  const [weatherAlertsShown, setWeatherAlertsShown] = useState({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(
          STORAGE_KEYS.USER_SETTINGS
        );
        if (storedSettings) {
          setUserSettings(JSON.parse(storedSettings));
        } else {
          // Save default settings if none exist
          await AsyncStorage.setItem(
            STORAGE_KEYS.USER_SETTINGS,
            JSON.stringify(defaultUserSettings)
          );
          setUserSettings(defaultUserSettings);
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_SETTINGS,
          JSON.stringify(userSettings)
        );
      } catch (error) {
        console.error("Error saving user settings:", error);
      }
    };

    if (!isLoading) {
      saveData();
    }
  }, [userSettings, isLoading]);

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const storedShifts = await AsyncStorage.getItem(
          STORAGE_KEYS.SHIFT_LIST
        );
        if (storedShifts) {
          setShifts(JSON.parse(storedShifts));
        }
      } catch (error) {
        console.error("Error loading shifts:", error);
      }
    };

    loadShifts();
  }, []);

  useEffect(() => {
    const saveShifts = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SHIFT_LIST,
          JSON.stringify(shifts)
        );
      } catch (error) {
        console.error("Error saving shifts:", error);
      }
    };

    if (!isLoading) {
      saveShifts();
    }
  }, [shifts, isLoading]);

  useEffect(() => {
    const loadAttendanceRecords = async () => {
      try {
        const storedRecords = await AsyncStorage.getItem(
          STORAGE_KEYS.ATTENDANCE_RECORDS
        );
        if (storedRecords) {
          setAttendanceRecords(JSON.parse(storedRecords));
        }
      } catch (error) {
        console.error("Error loading attendance records:", error);
      }
    };

    loadAttendanceRecords();
  }, []);

  useEffect(() => {
    const saveAttendanceRecords = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.ATTENDANCE_RECORDS,
          JSON.stringify(attendanceRecords)
        );
      } catch (error) {
        console.error("Error saving attendance records:", error);
      }
    };

    if (!isLoading) {
      saveAttendanceRecords();
    }
  }, [attendanceRecords, isLoading]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
        if (storedNotes) {
          setNotes(JSON.parse(storedNotes));
        }
      } catch (error) {
        console.error("Error loading notes:", error);
      }
    };

    loadNotes();
  }, []);

  useEffect(() => {
    const saveNotes = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      } catch (error) {
        console.error("Error saving notes:", error);
      }
    };

    if (!isLoading) {
      saveNotes();
    }
  }, [notes, isLoading]);

  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        const storedData = await AsyncStorage.getItem(
          STORAGE_KEYS.WEATHER_DATA
        );
        if (storedData) {
          setWeatherData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error("Error loading weather data:", error);
      }
    };

    loadWeatherData();
  }, []);

  useEffect(() => {
    const saveWeatherData = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.WEATHER_DATA,
          JSON.stringify(weatherData)
        );
      } catch (error) {
        console.error("Error saving weather data:", error);
      }
    };

    if (!isLoading) {
      saveWeatherData();
    }
  }, [weatherData, isLoading]);

  // Thêm vào phần useEffect để load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load các dữ liệu khác...

        // Load attendance logs
        const storedLogs = await AsyncStorage.getItem(
          STORAGE_KEYS.ATTENDANCE_LOGS
        );
        if (storedLogs) {
          setAttendanceLogs(JSON.parse(storedLogs));
        }

        // Load daily work status
        const storedDailyStatus = await AsyncStorage.getItem(
          STORAGE_KEYS.DAILY_WORK_STATUS
        );
        if (storedDailyStatus) {
          setDailyWorkStatus(JSON.parse(storedDailyStatus));
        }
      } catch (error) {
        console.error("Error loading data from AsyncStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Thêm vào phần useEffect để save data
  useEffect(() => {
    const saveLogs = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.ATTENDANCE_LOGS,
          JSON.stringify(attendanceLogs)
        );
      } catch (error) {
        console.error("Error saving attendance logs to AsyncStorage:", error);
      }
    };

    if (!isLoading) {
      saveLogs();
    }
  }, [attendanceLogs, isLoading]);

  useEffect(() => {
    const saveDailyStatus = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.DAILY_WORK_STATUS,
          JSON.stringify(dailyWorkStatus)
        );
      } catch (error) {
        console.error("Error saving daily work status to AsyncStorage:", error);
      }
    };

    if (!isLoading) {
      saveDailyStatus();
    }
  }, [dailyWorkStatus, isLoading]);

  // Add this useEffect to handle theme changes
  useEffect(() => {
    if (userSettings.theme === "dark") {
      // Apply dark theme styling if needed
      // This could involve setting status bar style or other global theme settings
    } else {
      // Apply light theme styling if needed
    }
  }, [userSettings.theme]);

  const updateSettings = (newSettings) => {
    setUserSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, ...newSettings };

      // Không cần cập nhật i18next nữa vì đã sử dụng LocalizationContext

      return updatedSettings;
    });
  };

  const addShift = async (shiftData) => {
    const newShift = { id: `shift_${Date.now()}`, ...shiftData };

    // Add the new shift
    setShifts((prevShifts) => [...prevShifts, newShift]);

    // Schedule reminders if this is the active shift
    if (userSettings.shiftReminderEnabled) {
      await scheduleShiftReminders(newShift, new Date(), userSettings);
    }

    return newShift;
  };

  const updateShift = async (shiftId, shiftData) => {
    // Update the shift
    setShifts((prevShifts) => {
      const updatedShifts = prevShifts.map((shift) =>
        shift.id === shiftId ? { ...shift, ...shiftData } : shift
      );

      // Find the updated shift
      const updatedShift = updatedShifts.find((shift) => shift.id === shiftId);

      // If this is the active shift, reschedule reminders
      if (
        updatedShift &&
        shiftId === activeShiftId &&
        userSettings.shiftReminderEnabled
      ) {
        // Cancel existing reminders
        if (scheduledNotifications[shiftId]) {
          scheduledNotifications[shiftId].forEach((id) =>
            cancelNotification(id)
          );
        }

        // Schedule new reminders
        scheduleShiftReminders(updatedShift, new Date(), userSettings).then(
          (notificationIds) => {
            setScheduledNotifications((prev) => ({
              ...prev,
              [shiftId]: notificationIds,
            }));
          }
        );
      }

      return updatedShifts;
    });
  };

  const deleteShift = async (shiftId) => {
    // Cancel any scheduled reminders for this shift
    if (scheduledNotifications[shiftId]) {
      for (const notificationId of scheduledNotifications[shiftId]) {
        await cancelNotification(notificationId);
      }

      // Remove from scheduled notifications
      setScheduledNotifications((prev) => {
        const updated = { ...prev };
        delete updated[shiftId];
        return updated;
      });
    }

    // If this is the active shift, clear it
    if (shiftId === activeShiftId) {
      setActiveShiftId(null);
    }

    // Delete the shift
    setShifts((prevShifts) =>
      prevShifts.filter((shift) => shift.id !== shiftId)
    );
  };

  const addAttendanceRecord = (record) => {
    const newRecord = { id: `record_${Date.now()}`, ...record };
    setAttendanceRecords((prevRecords) => [...prevRecords, newRecord]);
  };

  const updateWeatherData = (data) => {
    const newData = { ...data, lastUpdated: new Date().toISOString() };
    setWeatherData(newData);
  };

  const addNote = async (noteData) => {
    const newNote = {
      id: `note_${Date.now()}`,
      title: noteData.title || "",
      content: noteData.content || "",
      reminderTime: noteData.reminderTime || "08:00",
      associatedShiftIds: noteData.associatedShiftIds || [],
      explicitReminderDays: noteData.explicitReminderDays || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add the note
    setNotes((prevNotes) => [...prevNotes, newNote]);

    // Schedule reminders if enabled
    if (userSettings.alarmSoundEnabled) {
      const notificationIds = await scheduleNoteReminders(
        newNote,
        shifts,
        userSettings
      );

      // Save notification IDs
      if (notificationIds.length > 0) {
        setScheduledNotifications((prev) => ({
          ...prev,
          [newNote.id]: notificationIds,
        }));
      }
    }

    return newNote;
  };

  const updateNote = async (noteId, noteData) => {
    // Cancel existing reminders
    if (scheduledNotifications[noteId]) {
      for (const notificationId of scheduledNotifications[noteId]) {
        await cancelNotification(notificationId);
      }
    }

    // Update the note
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((note) =>
        note.id === noteId
          ? { ...note, ...noteData, updatedAt: new Date().toISOString() }
          : note
      );

      // Find the updated note
      const updatedNote = updatedNotes.find((note) => note.id === noteId);

      // Schedule new reminders if enabled
      if (updatedNote && userSettings.alarmSoundEnabled) {
        scheduleNoteReminders(updatedNote, shifts, userSettings).then(
          (notificationIds) => {
            setScheduledNotifications((prev) => ({
              ...prev,
              [noteId]: notificationIds,
            }));
          }
        );
      }

      return updatedNotes;
    });
  };

  const deleteNote = async (noteId) => {
    // Cancel any scheduled reminders for this note
    if (scheduledNotifications[noteId]) {
      for (const notificationId of scheduledNotifications[noteId]) {
        await cancelNotification(notificationId);
      }

      // Remove from scheduled notifications
      setScheduledNotifications((prev) => {
        const updated = { ...prev };
        delete updated[noteId];
        return updated;
      });
    }

    // Delete the note
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
  };

  const getNotesForToday = (activeShiftId = null) => {
    const today = new Date();
    const dayOfWeek = getDayOfWeek(today);

    // Lọc ghi chú theo điều kiện
    const filteredNotes = notes.filter((note) => {
      // Điều kiện 1: Ghi chú có associatedShiftIds chứa ID của ca đang hoạt động
      if (
        activeShiftId &&
        note.associatedShiftIds &&
        note.associatedShiftIds.includes(activeShiftId)
      ) {
        return true;
      }

      // Điều kiện 2: Ghi chú có associatedShiftIds rỗng VÀ explicitReminderDays chứa ngày hiện tại
      if (
        (!note.associatedShiftIds || note.associatedShiftIds.length === 0) &&
        note.explicitReminderDays &&
        note.explicitReminderDays.includes(dayOfWeek)
      ) {
        return true;
      }

      return false;
    });

    // Sắp xếp theo thời gian nhắc nhở gần nhất
    return filteredNotes
      .sort((a, b) => {
        const nextReminderA = getNextReminderDate(a);
        const nextReminderB = getNextReminderDate(b);

        // Nếu không có ngày nhắc nhở, sắp xếp theo updatedAt
        if (!nextReminderA && !nextReminderB) {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        }
        if (!nextReminderA) return 1;
        if (!nextReminderB) return -1;

        return nextReminderA - nextReminderB;
      })
      .slice(0, 3); // Chỉ lấy 3 ghi chú đầu tiên
  };

  const getNextReminderDate = (note) => {
    const today = new Date();
    const dayOfWeek = getDayOfWeek(today);

    // Nếu có ca làm việc liên kết, không cần tính toán ngày nhắc nhở
    if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
      return null;
    }

    // Nếu không có ngày nhắc nhở cụ thể, trả về null
    if (!note.explicitReminderDays || note.explicitReminderDays.length === 0) {
      return null;
    }

    // Tìm ngày nhắc nhở gần nhất trong tương lai
    let nextReminderDate = null;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const currentDayOfWeek = getDayOfWeek(currentDate);

      if (note.explicitReminderDays.includes(currentDayOfWeek)) {
        nextReminderDate = currentDate;
        break;
      }
    }

    return nextReminderDate;
  };

  const isNoteDuplicate = (title, content, excludeNoteId = null) => {
    const normalizedTitle = title.trim().toLowerCase();
    const normalizedContent = content.trim().toLowerCase();

    return notes.some(
      (note) =>
        note.id !== excludeNoteId &&
        note.title.trim().toLowerCase() === normalizedTitle &&
        note.content.trim().toLowerCase() === normalizedContent
    );
  };

  const exportData = async () => {
    const data = {
      userSettings,
      shifts,
      attendanceRecords,
      notes,
      weatherData,
      attendanceLogs,
      dailyWorkStatus,
    };

    return JSON.stringify(data);
  };

  const importData = async (data) => {
    const parsedData = JSON.parse(data);

    setUserSettings(parsedData.userSettings || defaultUserSettings);
    setShifts(parsedData.shifts || []);
    setAttendanceRecords(parsedData.attendanceRecords || []);
    setNotes(parsedData.notes || []);
    setWeatherData(parsedData.weatherData || null);
    setAttendanceLogs(parsedData.attendanceLogs || []);
    setDailyWorkStatus(parsedData.dailyWorkStatus || {});
  };

  // Set active shift
  const setActiveShift = async (shiftId) => {
    // If there's already an active shift, cancel its reminders
    if (activeShiftId && scheduledNotifications[activeShiftId]) {
      for (const notificationId of scheduledNotifications[activeShiftId]) {
        await cancelNotification(notificationId);
      }
    }

    // Set the new active shift
    setActiveShiftId(shiftId);

    // Schedule reminders for the new active shift if enabled
    if (shiftId && userSettings.shiftReminderEnabled) {
      const shift = shifts.find((s) => s.id === shiftId);
      if (shift) {
        const notificationIds = await scheduleShiftReminders(
          shift,
          new Date(),
          userSettings
        );

        // Save notification IDs
        if (notificationIds.length > 0) {
          setScheduledNotifications((prev) => ({
            ...prev,
            [shiftId]: notificationIds,
          }));
        }

        // Check for weather alerts if enabled
        if (userSettings.weatherWarningEnabled && weatherData) {
          checkWeatherForShift(shift);
        }
      }
    }
  };

  // Check weather for a shift and show alerts if needed
  const checkWeatherForShift = useCallback(
    async (shift) => {
      if (!shift || !weatherData || !userSettings.weatherWarningEnabled) return;

      try {
        // Get departure time in minutes
        const departureTimeMinutes = timeToMinutes(shift.departureTime);

        // Get current time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;

        // Check if we're within 1 hour of departure time
        const timeUntilDeparture = departureTimeMinutes - currentTimeMinutes;

        // Only check if we're about 1 hour before departure (between 30-90 minutes)
        if (timeUntilDeparture >= 30 && timeUntilDeparture <= 90) {
          // Check for extreme weather conditions at departure time
          const departureAlerts = checkExtremeWeather(weatherData);

          // Check for extreme weather conditions at return time
          // This would require additional weather forecast data for the return time
          const returnAlerts = []; // Placeholder - would need forecast data

          // If we have alerts, show them
          if (
            (departureAlerts && departureAlerts.length > 0) ||
            (returnAlerts && returnAlerts.length > 0)
          ) {
            // Format alert message
            const alertMessage = formatWeatherAlertMessage(
              departureAlerts,
              returnAlerts,
              shift
            );

            // Check if we've already shown an alert for this shift today
            const today = now.toISOString().split("T")[0];
            const alertKey = `${shift.id}_${today}`;

            if (!weatherAlertsShown[alertKey]) {
              // Show notification
              await scheduleWeatherAlert(alertMessage);

              // Save alert
              setWeatherAlerts((prev) => ({
                ...prev,
                [alertKey]: {
                  message: alertMessage,
                  timestamp: now.toISOString(),
                  departureAlerts,
                  returnAlerts,
                  shift,
                },
              }));

              // Mark as shown
              setWeatherAlertsShown((prev) => ({
                ...prev,
                [alertKey]: true,
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error checking weather for shift:", error);
      }
    },
    [weatherData, userSettings.weatherWarningEnabled, weatherAlertsShown]
  );

  // Dismiss weather alert
  const dismissWeatherAlert = (alertKey) => {
    setWeatherAlerts((prev) => {
      const updated = { ...prev };
      delete updated[alertKey];
      return updated;
    });
  };

  // Add attendance log with validation
  const addAttendanceLog = (type, shiftId) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    // Get the shift
    const shift = shifts.find((s) => s.id === shiftId);

    // Validate log against shift if needed
    if (shift && type === "check_in") {
      const isValid = isLogValidForShift(
        { timestamp: now.toISOString() },
        shift
      );

      if (!isValid) {
        // This could trigger a confirmation dialog in the UI
        console.warn("Log may not be valid for this shift");
      }
    }

    const newLog = {
      id: `log_${Date.now()}`,
      type,
      shiftId,
      date: now.toISOString(),
      createdAt: now.toISOString(),
    };

    setAttendanceLogs((prev) => [...prev, newLog]);

    // Update daily work status
    updateDailyWorkStatus(dateStr, type, shiftId, now);

    // Calculate attendance status after check-out or complete
    if (type === "check_out" || type === "complete") {
      const logs = getLogsForDate(now);
      if (shift) {
        const status = calculateAttendanceStatus([...logs, newLog], shift);
        // This could be used to update UI or trigger notifications
        console.log("Calculated attendance status:", status);
      }
    }

    return newLog;
  };

  const updateDailyWorkStatus = (dateStr, type, shiftId, timestamp) => {
    setDailyWorkStatus((prev) => {
      const currentStatus = prev[dateStr] || {
        shiftId: null,
        status: "not_started",
        goWorkTime: null,
        checkInTime: null,
        punchTime: null,
        checkOutTime: null,
        completeTime: null,
      };

      const newStatus = { ...currentStatus };

      // Cập nhật trạng thái dựa trên loại log
      switch (type) {
        case "go_work":
          newStatus.shiftId = shiftId;
          newStatus.status = "waiting_check_in";
          newStatus.goWorkTime = timestamp.toISOString();
          break;
        case "check_in":
          newStatus.status = "working";
          newStatus.checkInTime = timestamp.toISOString();
          break;
        case "punch":
          newStatus.punchTime = timestamp.toISOString();
          break;
        case "check_out":
          newStatus.status = "ready_to_complete";
          newStatus.checkOutTime = timestamp.toISOString();
          break;
        case "complete":
          newStatus.status = "completed";
          newStatus.completeTime = timestamp.toISOString();
          break;
        default:
          break;
      }

      return { ...prev, [dateStr]: newStatus };
    });
  };

  const resetDailyWorkStatus = (date = new Date()) => {
    const dateStr = date.toISOString().split("T")[0];

    // Delete all logs for the current date
    setAttendanceLogs((prev) =>
      prev.filter((log) => !log.date.startsWith(dateStr))
    );

    // Reset status
    setDailyWorkStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[dateStr];
      return newStatus;
    });

    // If there's an active shift, reschedule its reminders
    if (activeShiftId) {
      const shift = shifts.find((s) => s.id === activeShiftId);
      if (shift && userSettings.shiftReminderEnabled) {
        // Cancel existing reminders
        if (scheduledNotifications[activeShiftId]) {
          scheduledNotifications[activeShiftId].forEach((id) =>
            cancelNotification(id)
          );
        }

        // Schedule new reminders
        scheduleShiftReminders(shift, date, userSettings).then(
          (notificationIds) => {
            setScheduledNotifications((prev) => ({
              ...prev,
              [activeShiftId]: notificationIds,
            }));
          }
        );
      }
    }
  };

  const getLogsForDate = (date = new Date()) => {
    const dateStr = date.toISOString().split("T")[0];
    return attendanceLogs
      .filter((log) => log.date.startsWith(dateStr))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getDailyStatusForDate = (date = new Date()) => {
    const dateStr = date.toISOString().split("T")[0];
    return (
      dailyWorkStatus[dateStr] || {
        shiftId: null,
        status: "not_started",
        goWorkTime: null,
        checkInTime: null,
        punchTime: null,
        checkOutTime: null,
        completeTime: null,
      }
    );
  };

  // Context value
  const value = {
    isLoading,
    isLoggedIn,
    userInfo,
    shifts,
    attendanceRecords,
    notes,
    weatherData,
    userSettings,
    attendanceLogs,
    dailyWorkStatus,
    activeShiftId,
    weatherAlerts,
    updateSettings,
    addShift,
    updateShift,
    deleteShift,
    addAttendanceRecord,
    updateWeatherData,
    addNote,
    updateNote,
    deleteNote,
    getNotesForToday,
    getNextReminderDate,
    isNoteDuplicate,
    exportData,
    importData,
    resetDailyWorkStatus,
    getLogsForDate,
    getDailyStatusForDate,
    addAttendanceLog,
    setActiveShift,
    checkWeatherForShift,
    dismissWeatherAlert,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
