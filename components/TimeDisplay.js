import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalization } from "../localization/LocalizationContext";
import { COLORS } from "../styles/theme/colors";
import { BlurView } from "expo-blur";

const TimeDisplay = () => {
  const { t } = useLocalization();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);

      // Format time: HH:MM (without seconds)
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setFormattedTime(`${hours}:${minutes}`);

      // Format date: Weekday, Day/Month
      try {
        // Get day of week in Vietnamese
        const weekday = now.toLocaleDateString(t("common.locale"), {
          weekday: "long",
        });
        // Format as "Thứ Ba, 24/12"
        const day = now.getDate().toString().padStart(2, "0");
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        setFormattedDate(`${weekday}, ${day}/${month}`);
      } catch (error) {
        // Fallback to default locale if the provided locale is invalid
        const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
        const day = now.getDate().toString().padStart(2, "0");
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        setFormattedDate(`${weekday}, ${day}/${month}`);
      }
    };

    // Update immediately
    updateTime();

    // Set interval for updates
    const interval = setInterval(updateTime, 1000);

    // Clean up interval
    return () => clearInterval(interval);
  }, [t]);

  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>{formattedTime}</Text>
      <Text style={styles.dateText}>{formattedDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    justifyContent: "center",
    marginVertical: 8,
  },
  timeText: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.white,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.appDarkTextSecondary,
    marginTop: 4,
  },
});

export default TimeDisplay;
