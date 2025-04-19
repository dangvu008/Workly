"use client";

import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { memo, useMemo, useCallback, useState } from "react";
import { useAppContext } from "../context/AppContext";
import {
  getDayOfWeek,
  isToday,
  getWeekDates,
  formatDate,
} from "../utils/dateUtils";
import { weeklyStatusGridStyles } from "../styles/components/weeklyStatusGrid";
import { useTheme } from "../context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalization } from "../localization/LocalizationContext";
import { COLORS } from "../styles/theme/colors";

const WeeklyStatusGrid = memo(({ onDayPress }) => {
  const {
    userSettings,
    shifts,
    attendanceRecords,
    dailyWorkStatus,
    attendanceLogs,
  } = useAppContext();
  const { colors } = useTheme();
  const { t } = useLocalization();

  // State for detail modal
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Tối ưu hóa tính toán ngày trong tuần
  const { weekDays, dayNames } = useMemo(() => {
    const today = new Date();
    const { startOfWeek } = getWeekDates(today, userSettings.firstDayOfWeek);

    // Generate array of dates for the current week
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    // Get short day names based on first day of week
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayNames =
      userSettings.firstDayOfWeek === "Mon"
        ? [...days.slice(1), days[0]]
        : days;

    return { weekDays, dayNames };
  }, [userSettings.firstDayOfWeek]);

  // Tạo cache cho các ngày có ca làm việc
  const scheduledDays = useMemo(() => {
    const daysMap = {};
    shifts.forEach((shift) => {
      if (shift.daysApplied && Array.isArray(shift.daysApplied)) {
        shift.daysApplied.forEach((day) => {
          daysMap[day] = true;
        });
      }
    });
    return daysMap;
  }, [shifts]);

  // Tạo cache cho trạng thái chấm công và trạng thái ngày
  const dayStatusMap = useMemo(() => {
    const statusMap = {};
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Lấy trạng thái từ dailyWorkStatus
    Object.entries(dailyWorkStatus).forEach(([dateStr, status]) => {
      statusMap[dateStr] = {
        type: "unknown",
        iconName: "remove",
        color: COLORS.appDarkTextSecondary,
        details: {},
      };

      // Xác định trạng thái dựa trên thông tin trong status
      if (status.completeTime) {
        // Đủ công - đã hoàn thành đầy đủ
        statusMap[dateStr].type = "complete";
        statusMap[dateStr].iconName = "check-circle";
        statusMap[dateStr].color = COLORS.success;
        statusMap[dateStr].details = {
          goWorkTime: status.goWorkTime,
          checkInTime: status.checkInTime,
          checkOutTime: status.checkOutTime,
          completeTime: status.completeTime,
          punchTime: status.punchTime,
        };
      } else if (status.checkInTime && !status.checkOutTime) {
        // Thiếu chấm công - chỉ có check-in
        statusMap[dateStr].type = "incomplete";
        statusMap[dateStr].iconName = "error";
        statusMap[dateStr].color = COLORS.warning;
        statusMap[dateStr].details = {
          goWorkTime: status.goWorkTime,
          checkInTime: status.checkInTime,
        };
      } else if (status.goWorkTime && !status.checkInTime) {
        // Thiếu chấm công - chỉ có go-work
        statusMap[dateStr].type = "incomplete";
        statusMap[dateStr].iconName = "error";
        statusMap[dateStr].color = COLORS.warning;
        statusMap[dateStr].details = {
          goWorkTime: status.goWorkTime,
        };
      }
    });

    // Xử lý các ngày trong quá khứ không có dữ liệu
    const pastDates = [];
    for (let i = 30; i >= 1; i--) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const pastDateStr = pastDate.toISOString().split("T")[0];
      pastDates.push(pastDateStr);
    }

    pastDates.forEach((dateStr) => {
      if (!statusMap[dateStr] && dateStr < todayStr) {
        // Kiểm tra xem có ca làm việc nào được lên lịch cho ngày này không
        const date = new Date(dateStr);
        const dayOfWeek = getDayOfWeek(date);
        const hasScheduledShift = shifts.some(
          (shift) => shift.daysApplied && shift.daysApplied.includes(dayOfWeek)
        );

        if (hasScheduledShift) {
          // Vắng không lý do - có ca làm việc nhưng không có dữ liệu chấm công
          statusMap[dateStr] = {
            type: "absent",
            iconName: "cancel",
            color: COLORS.appStatusError,
            details: {},
          };
        }
      }
    });

    return statusMap;
  }, [dailyWorkStatus, shifts]);

  // Tối ưu hóa kiểm tra ca làm việc
  const isShiftScheduled = useCallback(
    (date) => {
      const dayOfWeek = getDayOfWeek(date);
      return !!scheduledDays[dayOfWeek];
    },
    [scheduledDays]
  );

  // Tối ưu hóa kiểm tra trạng thái ngày
  const getDayStatus = useCallback(
    (date) => {
      const dateStr = date.toISOString().split("T")[0];
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Nếu là ngày tương lai, hiển thị --
      if (dateStr > todayStr) {
        return {
          type: "future",
          iconName: "remove",
          color: COLORS.appDarkTextSecondary,
          details: {},
        };
      }

      // Nếu có trong dayStatusMap, trả về trạng thái đó
      if (dayStatusMap[dateStr]) {
        return dayStatusMap[dateStr];
      }

      // Mặc định cho ngày không có dữ liệu
      return {
        type: "unknown",
        iconName: "help",
        color: COLORS.appDarkTextSecondary,
        details: {},
      };
    },
    [dayStatusMap]
  );

  // Tối ưu hóa render header
  const renderHeaderCells = useMemo(() => {
    return dayNames.map((day, index) => (
      <View key={`header-${index}`} style={weeklyStatusGridStyles.headerCell}>
        <Text
          style={[
            weeklyStatusGridStyles.headerText,
            { color: colors.darkGray },
          ]}
        >
          {day}
        </Text>
      </View>
    ));
  }, [dayNames, colors.darkGray]);

  // Tối ưu hóa xử lý khi nhấn vào ngày
  const handleDayPress = useCallback(
    (date) => {
      onDayPress(date);
    },
    [onDayPress]
  );

  // Tối ưu hóa render các ô ngày
  const renderDayCells = useMemo(() => {
    return weekDays.map((date, index) => {
      const scheduled = isShiftScheduled(date);
      const dayStatus = getDayStatus(date);
      const isCurrentDay = isToday(date);
      const dayNumber = date.getDate();
      const dayName = dayNames[index];

      return (
        <TouchableOpacity
          key={`day-${index}`}
          style={[
            weeklyStatusGridStyles.dayCell,
            isCurrentDay && weeklyStatusGridStyles.currentDay,
            scheduled && weeklyStatusGridStyles.scheduledDay,
            { borderColor: dayStatus.color },
          ]}
          onPress={() => {
            setSelectedDate(date);
            setShowDetailModal(true);
          }}
        >
          <Text style={weeklyStatusGridStyles.dayName}>{dayName}</Text>
          <Text
            style={[
              weeklyStatusGridStyles.dayText,
              isCurrentDay && weeklyStatusGridStyles.currentDayText,
            ]}
          >
            {dayNumber}
          </Text>
          <MaterialIcons
            name={dayStatus.iconName}
            size={18}
            style={[
              weeklyStatusGridStyles.statusIcon,
              { color: dayStatus.color },
            ]}
          />
        </TouchableOpacity>
      );
    });
  }, [weekDays, isShiftScheduled, getDayStatus, dayNames]);

  // Xử lý cập nhật trạng thái thủ công
  const handleStatusUpdate = useCallback(
    (newStatus) => {
      if (!selectedDate) return;

      const dateStr = selectedDate.toISOString().split("T")[0];
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Chỉ cho phép cập nhật trạng thái cho ngày hiện tại hoặc trong quá khứ
      if (dateStr > todayStr) {
        // Cho ngày tương lai, chỉ cho phép cập nhật một số trạng thái nhất định
        if (!["leave", "sick", "holiday", "absent"].includes(newStatus)) {
          Alert.alert(t("common.error"), t("attendance.cannotUpdateFutureDay"));
          return;
        }
      }

      // TODO: Cập nhật trạng thái trong dailyWorkStatus
      // Đây là nơi bạn sẽ thêm logic để cập nhật trạng thái

      setShowStatusPicker(false);
      setShowDetailModal(false);
    },
    [selectedDate, t]
  );

  // Render modal chi tiết
  const renderDetailModal = useCallback(() => {
    if (!selectedDate) return null;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const dayStatus = getDayStatus(selectedDate);
    const formattedDate = formatDate(selectedDate, "date");
    const dayOfWeek = getDayOfWeek(selectedDate);

    // Lấy logs cho ngày được chọn
    const dayLogs = attendanceLogs
      .filter((log) => log.date.startsWith(dateStr))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={weeklyStatusGridStyles.modalOverlay}>
          <View style={weeklyStatusGridStyles.modalContent}>
            <View style={weeklyStatusGridStyles.modalHeader}>
              <Text style={weeklyStatusGridStyles.modalTitle}>
                {formattedDate} ({dayOfWeek})
              </Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={weeklyStatusGridStyles.closeButton}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={COLORS.appDarkTextSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={weeklyStatusGridStyles.statusSection}>
              <Text style={weeklyStatusGridStyles.sectionTitle}>
                {t("attendance.status")}
              </Text>
              <View style={weeklyStatusGridStyles.statusRow}>
                <View
                  style={[
                    weeklyStatusGridStyles.statusBadge,
                    { backgroundColor: dayStatus.color },
                  ]}
                >
                  <MaterialIcons
                    name={dayStatus.iconName}
                    size={18}
                    color="white"
                  />
                  <Text style={weeklyStatusGridStyles.statusBadgeText}>
                    {getStatusText(dayStatus.type)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={weeklyStatusGridStyles.editButton}
                  onPress={() => setShowStatusPicker(true)}
                >
                  <Text style={weeklyStatusGridStyles.editButtonText}>
                    {t("common.edit")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {dayLogs.length > 0 && (
              <View style={weeklyStatusGridStyles.logsSection}>
                <Text style={weeklyStatusGridStyles.sectionTitle}>
                  {t("attendance.logs")}
                </Text>
                <ScrollView style={weeklyStatusGridStyles.logsList}>
                  {dayLogs.map((log, index) => (
                    <View
                      key={log.id || index}
                      style={weeklyStatusGridStyles.logItem}
                    >
                      <Text style={weeklyStatusGridStyles.logType}>
                        {getLogTypeText(log.type)}
                      </Text>
                      <Text style={weeklyStatusGridStyles.logTime}>
                        {formatDate(log.date, "time")}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {showStatusPicker && (
              <View style={weeklyStatusGridStyles.statusPicker}>
                <Text style={weeklyStatusGridStyles.pickerTitle}>
                  {t("attendance.selectStatus")}
                </Text>
                <View style={weeklyStatusGridStyles.statusOptions}>
                  <TouchableOpacity
                    style={weeklyStatusGridStyles.statusOption}
                    onPress={() => handleStatusUpdate("complete")}
                  >
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color={COLORS.success}
                      style={weeklyStatusGridStyles.statusOptionIcon}
                    />
                    <Text style={weeklyStatusGridStyles.statusOptionText}>
                      {t("attendance.statusComplete")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={weeklyStatusGridStyles.statusOption}
                    onPress={() => handleStatusUpdate("incomplete")}
                  >
                    <MaterialIcons
                      name="error"
                      size={24}
                      color={COLORS.warning}
                      style={weeklyStatusGridStyles.statusOptionIcon}
                    />
                    <Text style={weeklyStatusGridStyles.statusOptionText}>
                      {t("attendance.statusIncomplete")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={weeklyStatusGridStyles.statusOption}
                    onPress={() => handleStatusUpdate("leave")}
                  >
                    <MaterialIcons
                      name="mail"
                      size={24}
                      color={COLORS.appPurple}
                      style={weeklyStatusGridStyles.statusOptionIcon}
                    />
                    <Text style={weeklyStatusGridStyles.statusOptionText}>
                      {t("attendance.statusLeave")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={weeklyStatusGridStyles.statusOption}
                    onPress={() => handleStatusUpdate("sick")}
                  >
                    <MaterialIcons
                      name="sick"
                      size={24}
                      color={COLORS.appStatusWarning}
                      style={weeklyStatusGridStyles.statusOptionIcon}
                    />
                    <Text style={weeklyStatusGridStyles.statusOptionText}>
                      {t("attendance.statusSick")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={weeklyStatusGridStyles.statusOption}
                    onPress={() => handleStatusUpdate("holiday")}
                  >
                    <MaterialIcons
                      name="celebration"
                      size={24}
                      color={COLORS.appStatusInfo}
                      style={weeklyStatusGridStyles.statusOptionIcon}
                    />
                    <Text style={weeklyStatusGridStyles.statusOptionText}>
                      {t("attendance.statusHoliday")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={weeklyStatusGridStyles.statusOption}
                    onPress={() => handleStatusUpdate("absent")}
                  >
                    <MaterialIcons
                      name="cancel"
                      size={24}
                      color={COLORS.appStatusError}
                      style={weeklyStatusGridStyles.statusOptionIcon}
                    />
                    <Text style={weeklyStatusGridStyles.statusOptionText}>
                      {t("attendance.statusAbsent")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={weeklyStatusGridStyles.statusOption}
                    onPress={() => handleStatusUpdate("rv")}
                  >
                    <MaterialIcons
                      name="schedule"
                      size={24}
                      color={COLORS.appStatusWarning}
                      style={weeklyStatusGridStyles.statusOptionIcon}
                    />
                    <Text style={weeklyStatusGridStyles.statusOptionText}>
                      {t("attendance.statusRV")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={weeklyStatusGridStyles.cancelButton}
                  onPress={() => setShowStatusPicker(false)}
                >
                  <Text style={weeklyStatusGridStyles.cancelButtonText}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }, [
    selectedDate,
    showDetailModal,
    showStatusPicker,
    getDayStatus,
    attendanceLogs,
    t,
    handleStatusUpdate,
  ]);

  // Helper function để lấy text cho loại trạng thái
  const getStatusText = useCallback(
    (statusType) => {
      switch (statusType) {
        case "complete":
          return t("attendance.statusComplete");
        case "incomplete":
          return t("attendance.statusIncomplete");
        case "absent":
          return t("attendance.statusAbsent");
        case "leave":
          return t("attendance.statusLeave");
        case "sick":
          return t("attendance.statusSick");
        case "holiday":
          return t("attendance.statusHoliday");
        case "rv":
          return t("attendance.statusRV");
        case "future":
          return t("attendance.statusFuture");
        default:
          return t("attendance.statusUnknown");
      }
    },
    [t]
  );

  // Helper function để lấy text cho loại log
  const getLogTypeText = useCallback(
    (logType) => {
      switch (logType) {
        case "go_work":
          return t("home.logGoWork");
        case "check_in":
          return t("home.logCheckIn");
        case "punch":
          return t("home.logPunch");
        case "check_out":
          return t("home.logCheckOut");
        case "complete":
          return t("home.logComplete");
        default:
          return logType;
      }
    },
    [t]
  );

  return (
    <View
      style={[
        weeklyStatusGridStyles.container,
        { backgroundColor: colors.card },
      ]}
    >
      <View style={weeklyStatusGridStyles.daysRow}>{renderDayCells}</View>
      {renderDetailModal()}
    </View>
  );
});

WeeklyStatusGrid.displayName = "WeeklyStatusGrid";

export default WeeklyStatusGrid;
