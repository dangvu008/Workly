"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useAppContext } from "../context/AppContext";
import AlarmModal from "../components/AlarmModal";
import WeatherIcon from "../components/WeatherIcon";
import NoteItem from "../components/NoteItem";
import NoteForm from "../components/NoteForm";
import { formatDate, getDayOfWeek, timeToMinutes } from "../utils/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalization } from "../localization/LocalizationContext";
import MultiButton from "../components/MultiButton";
import { homeScreenStyles } from "../styles/screens/homeScreen";
import { COLORS } from "../styles/theme/colors";
import TimeDisplay from "../components/TimeDisplay";
import ShiftStatus from "../components/ShiftStatus";
import WeeklySchedule from "../components/WeeklySchedule";
import WorkNotes from "../components/WorkNotes";
import ShiftInfo from "../components/ShiftInfo";
import WeatherForecast from "../components/WeatherForecast";

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

  return (
    <View style={homeScreenStyles.container}>
      <ScrollView>
        <View style={homeScreenStyles.header}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Text
              style={{ color: COLORS.white, fontSize: 24, fontWeight: "bold" }}
            >
              Time Manager
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <MaterialIcons name="settings" size={24} color={COLORS.white} />
              <MaterialIcons name="bar-chart" size={24} color={COLORS.white} />
            </View>
          </View>

          {/* New TimeDisplay component */}
          <TimeDisplay />
        </View>

        {/* Today's Shift Info */}
        <ShiftInfo
          shift={{ name: "Ca Ngày", startTime: "08:00", endTime: "20:00" }}
        />

        {/* Main action button */}
        <MultiButton />

        <View style={homeScreenStyles.section}>
          <Text style={homeScreenStyles.sectionTitle}>
            {t("home.weeklyStatus")}
          </Text>
          <WeeklySchedule weekData={weeklyData} onDayPress={handleDayPress} />
        </View>

        {/* Khu vực ghi chú */}
        <WorkNotes
          notes={todayNotes}
          onAddNote={handleAddNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          onViewAll={handleViewAllNotes}
        />

        {/* Weather Forecast */}
        <WeatherForecast />
        {renderWeatherCard}
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
    </View>
  );
};

export default HomeScreen;
