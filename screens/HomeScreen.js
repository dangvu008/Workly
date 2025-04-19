"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import AlarmModal from "../components/AlarmModal";
import NoteForm from "../components/NoteForm";
import { formatDate, getDayOfWeek, timeToMinutes } from "../utils/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalization } from "../localization/LocalizationContext";
import MultiButton from "../components/MultiButton";
import { homeScreenStyles } from "../styles/screens/homeScreen";
import { COLORS } from "../styles/theme/colors";
import { FONT_SIZES } from "../styles/theme/typography";
import { SPACING } from "../styles/theme/spacing";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import WorkNotes from "../components/WorkNotes";
import WeatherForecastHourly from "../components/WeatherForecastHourly";
import AttendanceLogList from "../components/AttendanceLogList";
import WeeklyStatusGrid from "../components/WeeklyStatusGrid";
import BottomNav from "../components/BottomNav";

const HomeScreen = ({ navigation }) => {
  const {
    userSettings,
    shifts,
    attendanceRecords,
    weatherData,
    addAttendanceRecord,
    notes,
    deleteNote,
    getNotesForToday,
    getNextReminderDate,
  } = useAppContext();
  const { t } = useLocalization();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAlarm, setShowAlarm] = useState(false);
  const [alarmData, setAlarmData] = useState({
    title: "",
    message: "",
    alarmSound: "alarm_1",
  });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  const [todayNotes, setTodayNotes] = useState([]);

  // Tối ưu hóa triggerAlarm
  const triggerAlarm = useCallback((title, message, alarmSound) => {
    setAlarmData({
      title,
      message,
      alarmSound,
    });
    setShowAlarm(true);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Tối ưu hóa activeShifts
  const activeShifts = useMemo(() => {
    const today = getDayOfWeek(new Date());
    return shifts.filter((shift) => shift.daysApplied.includes(today));
  }, [shifts]);

  // Lấy danh sách ghi chú cho ngày hôm nay
  useEffect(() => {
    const fetchTodayNotes = () => {
      // Lấy tất cả ghi chú cho ngày hôm nay
      const allTodayNotes = getNotesForToday();

      // Sắp xếp theo thời gian nhắc nhở gần nhất
      allTodayNotes.sort((a, b) => {
        const dateA = getNextReminderDate(a);
        const dateB = getNextReminderDate(b);

        // Nếu không có ngày nhắc nhở, sắp xếp theo updatedAt
        if (!dateA && !dateB) {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        }
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA.getTime() - dateB.getTime();
      });

      // Chỉ lấy tối đa 3 ghi chú
      setTodayNotes(allTodayNotes.slice(0, 3));
    };

    fetchTodayNotes();
  }, [notes, shifts, getNotesForToday, getNextReminderDate]);

  // Check for shift reminders
  useEffect(() => {
    if (activeShifts.length === 0 || !userSettings.alarmSoundEnabled) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    activeShifts.forEach((shift) => {
      const startMinutes = timeToMinutes(shift.startTime);
      const endMinutes = timeToMinutes(shift.endTime);

      // Check for start reminder
      if (Math.abs(currentMinutes - startMinutes) === shift.remindBeforeStart) {
        triggerAlarm(
          t("alarm.timeToWork"),
          t("alarm.shiftStartingSoon", {
            name: shift.name,
            minutes: shift.remindBeforeStart,
          }),
          "alarm_1"
        );
      }

      // Check for end reminder
      if (Math.abs(currentMinutes - endMinutes) === shift.remindAfterEnd) {
        triggerAlarm(
          t("alarm.timeToWork"),
          t("alarm.shiftEndingSoon", {
            name: shift.name,
            minutes: shift.remindAfterEnd,
          }),
          "alarm_2"
        );
      }
    });
  }, [currentTime, activeShifts, userSettings, t, triggerAlarm]);

  // Record attendance
  const recordAttendance = useCallback(
    (shiftId, type) => {
      const record = {
        shiftId,
        type,
        date: new Date().toISOString(),
      };

      addAttendanceRecord(record);

      Alert.alert(
        type === "check-in"
          ? t("attendance.checkInSuccess")
          : t("attendance.checkOutSuccess"),
        `${
          type === "check-in"
            ? t("attendance.checkInSuccess")
            : t("attendance.checkOutSuccess")
        } ${formatDate(new Date(), "time")}`
      );
    },
    [addAttendanceRecord, t]
  );

  // Handle check-in
  const handleCheckIn = useCallback(() => {
    if (activeShifts.length === 0) {
      Alert.alert(
        t("attendance.noShiftsToCheckIn"),
        t("attendance.noShiftsToCheckIn") + " " + t("shifts.addShiftPrompt"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("shifts.addShift"),
            onPress: () =>
              navigation.navigate("Shifts", {
                screen: "ShiftDetail",
                params: { isNew: true },
              }),
          },
        ]
      );
      return;
    }

    // If there's only one shift, use it directly
    if (activeShifts.length === 1) {
      recordAttendance(activeShifts[0].id, "check-in");
      return;
    }

    // If there are multiple shifts, let the user choose
    Alert.alert(
      t("attendance.chooseShift"),
      t("attendance.multipleShiftsPrompt"),
      activeShifts.map((shift) => ({
        text: shift.name,
        onPress: () => recordAttendance(shift.id, "check-in"),
      }))
    );
  }, [activeShifts, t, navigation, recordAttendance]);

  // Handle check-out
  const handleCheckOut = useCallback(() => {
    // Find shifts that have been checked in but not checked out
    const checkedInShifts = activeShifts.filter((shift) => {
      const today = new Date().toISOString().split("T")[0];

      const checkIns = attendanceRecords.filter(
        (record) =>
          record.shiftId === shift.id &&
          record.date.startsWith(today) &&
          record.type === "check-in"
      );

      const checkOuts = attendanceRecords.filter(
        (record) =>
          record.shiftId === shift.id &&
          record.date.startsWith(today) &&
          record.type === "check-out"
      );

      return checkIns.length > 0 && checkOuts.length === 0;
    });

    if (checkedInShifts.length === 0) {
      Alert.alert(t("common.error"), t("attendance.needCheckInFirst"));
      return;
    }

    // If there's only one shift, use it directly
    if (checkedInShifts.length === 1) {
      recordAttendance(checkedInShifts[0].id, "check-out");
      return;
    }

    // If there are multiple shifts, let the user choose
    Alert.alert(
      t("attendance.chooseShift"),
      t("attendance.multipleCheckInsPrompt"),
      checkedInShifts.map((shift) => ({
        text: shift.name,
        onPress: () => recordAttendance(shift.id, "check-out"),
      }))
    );
  }, [activeShifts, attendanceRecords, t, recordAttendance]);

  // Handle day press on weekly grid
  const handleDayPress = useCallback(
    (date, dayData) => {
      navigation.navigate("CheckInOut", { date: date.toISOString() });
    },
    [navigation]
  );

  // Generate weekly data for the schedule
  const weeklyData = useMemo(() => {
    const data = {};
    const today = new Date();

    // Get the start of the week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Generate data for each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      // Check if there are shifts for this day
      const dayOfWeek = getDayOfWeek(date);
      const shiftsForDay = shifts.filter((shift) =>
        shift.daysApplied.includes(dayOfWeek)
      );

      // Check if there are attendance records for this day
      const checkInsForDay = attendanceRecords.filter(
        (record) =>
          record.date.startsWith(dateStr) && record.type === "check-in"
      );

      const checkOutsForDay = attendanceRecords.filter(
        (record) =>
          record.date.startsWith(dateStr) && record.type === "check-out"
      );

      // Determine status based on shifts and attendance
      let status = "none";
      if (shiftsForDay.length > 0) {
        if (checkInsForDay.length > 0 && checkOutsForDay.length > 0) {
          status = "completed";
        } else if (checkInsForDay.length > 0) {
          status = "warning";
        } else if (date < today) {
          status = "late";
        }
      }

      data[dateStr] = { status };
    }

    return data;
  }, [shifts, attendanceRecords]);

  // Get today's attendance status
  const getTodayAttendanceStatus = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];

    const checkIns = attendanceRecords.filter(
      (record) => record.date.startsWith(today) && record.type === "check-in"
    );

    const checkOuts = attendanceRecords.filter(
      (record) => record.date.startsWith(today) && record.type === "check-out"
    );

    if (checkIns.length === 0) {
      return {
        text: t("home.checkInStatus.notCheckedIn"),
        status: "notCheckedIn",
      };
    } else if (checkOuts.length === 0) {
      return {
        text: t("home.checkInStatus.checkedInNotOut"),
        status: "checkedIn",
      };
    } else {
      return {
        text: t("home.checkInStatus.checkedInAndOut"),
        status: "checkedOut",
      };
    }
  }, [attendanceRecords, t]);

  // Xử lý thêm ghi chú mới
  const handleAddNote = useCallback(() => {
    setNoteToEdit(null);
    setShowNoteForm(true);
  }, []);

  // Xử lý sửa ghi chú
  const handleEditNote = useCallback((note) => {
    setNoteToEdit(note);
    setShowNoteForm(true);
  }, []);

  // Xử lý xóa ghi chú
  const handleDeleteNote = useCallback(
    (note) => {
      Alert.alert(t("common.confirm"), t("notes.deleteNoteConfirm"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          onPress: () => deleteNote(note.id),
          style: "destructive",
        },
      ]);
    },
    [t, deleteNote]
  );

  // Xử lý xem tất cả ghi chú
  const handleViewAllNotes = useCallback(() => {
    navigation.navigate("Notes");
  }, [navigation]);

  // Tối ưu hóa render danh sách activeShifts
  const renderActiveShifts = useMemo(() => {
    if (activeShifts.length === 0) {
      return (
        <View style={homeScreenStyles.emptyState}>
          <Text style={homeScreenStyles.emptyText}>
            {t("home.noShiftsToday")}
          </Text>
          <TouchableOpacity
            style={homeScreenStyles.addButton}
            onPress={() =>
              navigation.navigate("Shifts", {
                screen: "ShiftDetail",
                params: { isNew: true },
              })
            }
          >
            <Text style={homeScreenStyles.addButtonText}>
              {t("home.addNewShift")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return activeShifts.map((shift) => (
      <TouchableOpacity
        key={shift.id}
        style={homeScreenStyles.shiftCard}
        onPress={() =>
          navigation.navigate("Shifts", {
            screen: "ShiftDetail",
            params: { shiftId: shift.id },
          })
        }
      >
        <View style={homeScreenStyles.shiftHeader}>
          <Text style={homeScreenStyles.shiftName}>{shift.name}</Text>
          <MaterialIcons name="access-time" size={18} color="#4A6572" />
        </View>
        <View style={homeScreenStyles.shiftTimes}>
          <Text style={homeScreenStyles.shiftTime}>
            <MaterialIcons name="login" size={16} color="#4CAF50" />{" "}
            {shift.startTime}
          </Text>
          <Text style={homeScreenStyles.shiftTime}>
            <MaterialIcons name="logout" size={16} color="#F44336" />{" "}
            {shift.endTime}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  }, [activeShifts, t, navigation]);

  // Tối ưu hóa render danh sách todayNotes
  const renderTodayNotes = useMemo(() => {
    if (todayNotes.length === 0) {
      return (
        <View style={homeScreenStyles.emptyState}>
          <Text style={homeScreenStyles.emptyText}>{t("notes.noNotes")}</Text>
          <TouchableOpacity
            style={homeScreenStyles.addButton}
            onPress={handleAddNote}
          >
            <Text style={homeScreenStyles.addButtonText}>
              {t("notes.addNotePrompt")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return todayNotes.map((note) => (
      <NoteItem
        key={note.id}
        note={note}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
      />
    ));
  }, [todayNotes, t, handleAddNote, handleEditNote, handleDeleteNote]);

  // Tối ưu hóa render weather card
  const renderWeatherCard = useMemo(() => {
    if (!weatherData || !userSettings.weatherWarningEnabled) {
      return null;
    }

    return (
      <View style={homeScreenStyles.section}>
        <Text style={homeScreenStyles.sectionTitle}>{t("home.weather")}</Text>
        <View style={homeScreenStyles.weatherCard}>
          <Text style={homeScreenStyles.weatherLocation}>
            {weatherData.location}
          </Text>
          <View style={homeScreenStyles.weatherInfo}>
            <WeatherIcon iconCode={weatherData.icon} size={50} />
            <View style={homeScreenStyles.weatherTextInfo}>
              <Text style={homeScreenStyles.weatherTemp}>
                {weatherData.temperature}°C
              </Text>
              <Text style={homeScreenStyles.weatherDesc}>
                {weatherData.description}
              </Text>
            </View>
          </View>
          {weatherData.warning && (
            <View style={homeScreenStyles.warningBox}>
              <MaterialIcons name="warning" size={20} color="#FFC107" />
              <Text style={homeScreenStyles.warningText}>
                {weatherData.warning}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [weatherData, userSettings.weatherWarningEnabled, t]);

  // Mock data for 3-hour weather forecast
  const mockWeatherForecast = [
    { time: "15:00", temp: 28, condition: "partly-cloudy" },
    { time: "16:00", temp: 27, condition: "cloudy" },
    { time: "17:00", temp: 26, condition: "rainy" },
  ];

  // Mock data for attendance logs
  const mockAttendanceLogs = [
    { type: "go_work", time: new Date().toISOString() },
    { type: "check_in", time: new Date(Date.now() - 5 * 60000).toISOString() },
    {
      type: "check_out",
      time: new Date(Date.now() - 10 * 60000).toISOString(),
    },
    { type: "complete", time: new Date(Date.now() - 15 * 60000).toISOString() },
  ];

  // Format current date and time
  const currentTime = new Date();
  const formattedTime = format(currentTime, "HH:mm");
  const formattedDate = format(currentTime, "EEEE, dd/MM", { locale: vi });

  return (
    <View style={homeScreenStyles.container}>
      <ScrollView>
        {/* Header with app title and date */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.appTitle}>Time Manager</Text>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Statistics")}
              >
                <MaterialIcons
                  name="bar-chart"
                  size={24}
                  color={COLORS.white}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
                <MaterialIcons name="settings" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Current time */}
        <Text style={styles.currentTime}>{formattedTime}</Text>

        {/* Weather forecast for next 3 hours */}
        <WeatherForecastHourly forecast={mockWeatherForecast} />

        {/* Shift selection (or "No shift selected" message) */}
        <View style={styles.shiftSection}>
          <Text style={styles.shiftText}>
            {activeShifts.length > 0
              ? activeShifts[0].name
              : "Chưa chọn ca làm việc"}
          </Text>
        </View>

        {/* Multi-function button */}
        <View style={styles.buttonContainer}>
          <MultiButton />
          <Text style={styles.workingTimeText}>
            {state.todayLogs.length > 0 ? "Đã đi làm 1:36" : ""}
          </Text>
        </View>

        {/* Attendance logs */}
        <AttendanceLogList logs={mockAttendanceLogs} />

        {/* Weekly status grid */}
        <WeeklyStatusGrid dailyStatuses={weeklyData} />

        {/* Notes section */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <WorkNotes
            notes={todayNotes}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onViewAll={handleViewAllNotes}
          />
        </View>
      </ScrollView>

      <AlarmModal
        visible={showAlarm}
        onDismiss={() => setShowAlarm(false)}
        title={alarmData.title}
        message={alarmData.message}
        alarmSound={alarmData.alarmSound}
        vibrationEnabled={userSettings.alarmVibrationEnabled}
      />

      <NoteForm
        visible={showNoteForm}
        onClose={() => {
          setShowNoteForm(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
};

// New styles for updated design
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.white,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.appDarkTextSecondary,
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  currentTime: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginVertical: SPACING.md,
  },
  shiftSection: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  shiftText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.appDarkTextSecondary,
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
    marginVertical: SPACING.md,
  },
  workingTimeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.appDarkTextSecondary,
    marginTop: SPACING.sm,
  },
  notesSection: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
});

export default HomeScreen;
