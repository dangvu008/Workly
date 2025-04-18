import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalization } from "../localization/LocalizationContext";
import { COLORS } from "../constants/colors";
import { BlurView } from "expo-blur";

// Day labels mapping
const DAY_LABELS = {
  Sun: "CN",
  Mon: "T2",
  Tue: "T3",
  Wed: "T4",
  Thu: "T5",
  Fri: "T6",
  Sat: "T7",
};

const WeeklySchedule = ({ weekData, onDayPress }) => {
  const { t } = useLocalization();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Get day names for the current locale
  const dayNames = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + i);

      let shortName, fullName;
      try {
        shortName = date.toLocaleDateString("en-US", {
          weekday: "short",
        });
        fullName = date.toLocaleDateString(t("common.locale"), {
          weekday: "long",
        });
      } catch (error) {
        // Fallback to default locale if the provided locale is invalid
        shortName = date.toLocaleDateString("en-US", { weekday: "short" });
        fullName = date.toLocaleDateString(undefined, { weekday: "long" });
      }

      days.push({
        short: DAY_LABELS[shortName] || shortName,
        full: fullName,
        date: new Date(date),
      });
    }
    return days;
  }, [t]);

  // Get status icon and color
  const getStatusConfig = (status) => {
    switch (status) {
      case "completed":
        return {
          icon: <MaterialIcons name="check" size={24} color={COLORS.white} />,
          bgColor: COLORS.appStatusSuccess,
          textColor: COLORS.white,
        };
      case "warning":
        return {
          icon: <MaterialIcons name="warning" size={24} color={COLORS.white} />,
          bgColor: COLORS.appStatusWarning,
          textColor: COLORS.white,
        };
      case "vacation":
        return {
          icon: (
            <MaterialIcons name="beach-access" size={24} color={COLORS.white} />
          ),
          bgColor: COLORS.appPurpleLight,
          textColor: COLORS.white,
        };
      case "sick":
        return {
          icon: <MaterialIcons name="healing" size={24} color={COLORS.white} />,
          bgColor: COLORS.appStatusError,
          textColor: COLORS.white,
        };
      case "late":
        return {
          icon: (
            <MaterialIcons name="schedule" size={24} color={COLORS.white} />
          ),
          bgColor: COLORS.appStatusWarning,
          textColor: COLORS.white,
        };
      case "working":
        return {
          icon: (
            <MaterialIcons name="access-time" size={24} color={COLORS.white} />
          ),
          bgColor: COLORS.appStatusInfo,
          textColor: COLORS.white,
        };
      default:
        return {
          icon: null,
          bgColor: COLORS.appDarkLight,
          textColor: COLORS.appDarkTextMuted,
        };
    }
  };

  // Get day data
  const getDayData = (date) => {
    if (!weekData) return { status: "none" };

    const dateStr = date.toISOString().split("T")[0];
    return weekData[dateStr] || { status: "none" };
  };

  // Handle cell click
  const handleCellClick = (date, dayData) => {
    setSelectedDate(date.toISOString().split("T")[0]);
    setShowDetails(true);
    if (onDayPress) {
      onDayPress(date, dayData);
    }
  };

  // Render day item
  const renderDayItem = (day, index) => {
    const dayData = getDayData(day.date);
    const statusConfig = getStatusConfig(dayData.status);
    const isToday = new Date().toDateString() === day.date.toDateString();
    const dateStr = day.date.toISOString().split("T")[0];

    return (
      <TouchableOpacity
        key={index}
        style={[styles.dayItem, isToday && styles.todayItem]}
        onPress={() => handleCellClick(day.date, dayData)}
      >
        <BlurView intensity={20} tint="dark" style={styles.dayItemContent}>
          <Text style={[styles.dayName, isToday && styles.todayText]}>
            {day.short}
          </Text>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            {statusConfig.icon}
          </View>
          <Text style={[styles.dayDate, isToday && styles.todayText]}>
            {day.date.getDate()}
          </Text>
        </BlurView>
      </TouchableOpacity>
    );
  };

  // Get selected day data
  const selectedDayData = selectedDate
    ? getDayData(new Date(selectedDate))
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.daysContainer}>
        {dayNames.map((day, index) => renderDayItem(day, index))}
      </View>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={0.9}
          onPress={() => setShowDetails(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("home.dayDetails")}</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {selectedDayData && (
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>
                  {t("home.date")}:{" "}
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString(
                        t("common.locale")
                      )
                    : ""}
                </Text>
                <Text style={styles.modalText}>
                  {t("home.status")}: {selectedDayData.status}
                </Text>
                {selectedDayData.notes && (
                  <Text style={styles.modalText}>
                    {t("home.notes")}: {selectedDayData.notes}
                  </Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayItem: {
    flex: 1,
    aspectRatio: 0.8,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  dayItemContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  todayItem: {
    borderWidth: 2,
    borderColor: COLORS.appPurple,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.white,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  dayDate: {
    fontSize: 16,
    color: COLORS.white,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  todayText: {
    color: COLORS.appPurple,
    fontWeight: "bold",
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  modalBody: {
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.appDarkTextSecondary,
    marginBottom: 8,
  },
});

export default WeeklySchedule;
