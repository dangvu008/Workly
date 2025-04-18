import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalization } from "../localization/LocalizationContext";
import { COLORS } from "../constants/colors";
import { BlurView } from "expo-blur";

const WeeklySchedule = ({ weekData, onDayPress }) => {
  const { t } = useLocalization();

  // Get day names for the current locale
  const dayNames = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + i);

      let shortName, fullName;
      try {
        shortName = date.toLocaleDateString(t("common.locale"), {
          weekday: "short",
        });
        fullName = date.toLocaleDateString(t("common.locale"), {
          weekday: "long",
        });
      } catch (error) {
        // Fallback to default locale if the provided locale is invalid
        shortName = date.toLocaleDateString(undefined, { weekday: "short" });
        fullName = date.toLocaleDateString(undefined, { weekday: "long" });
      }

      days.push({
        short: shortName,
        full: fullName,
        date: new Date(date),
      });
    }
    return days;
  }, [t]);

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return { name: "check-circle", color: COLORS.success };
      case "warning":
        return { name: "warning", color: COLORS.warning };
      case "vacation":
        return { name: "beach-access", color: COLORS.info };
      case "sick":
        return { name: "healing", color: COLORS.danger };
      case "late":
        return { name: "schedule", color: COLORS.warning };
      default:
        return { name: "circle", color: COLORS.gray };
    }
  };

  // Get day data
  const getDayData = (date) => {
    if (!weekData) return { status: "none" };

    const dateStr = date.toISOString().split("T")[0];
    return weekData[dateStr] || { status: "none" };
  };

  // Render day item
  const renderDayItem = (day, index) => {
    const dayData = getDayData(day.date);
    const statusIcon = getStatusIcon(dayData.status);
    const isToday = new Date().toDateString() === day.date.toDateString();

    return (
      <TouchableOpacity
        key={index}
        style={[styles.dayItem, isToday && styles.todayItem]}
        onPress={() => onDayPress(day.date, dayData)}
      >
        <BlurView intensity={20} tint="dark" style={styles.dayItemContent}>
          <Text style={[styles.dayName, isToday && styles.todayText]}>
            {day.short}
          </Text>
          <View style={styles.statusIconContainer}>
            <MaterialIcons
              name={statusIcon.name}
              size={24}
              color={statusIcon.color}
            />
          </View>
          <Text style={[styles.dayDate, isToday && styles.todayText]}>
            {day.date.getDate()}
          </Text>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.daysContainer}>
        {dayNames.map((day, index) => renderDayItem(day, index))}
      </View>
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
    borderColor: COLORS.primary,
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
    color: COLORS.primary,
    fontWeight: "bold",
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
});

export default WeeklySchedule;
