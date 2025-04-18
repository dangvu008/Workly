import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalization } from "../localization/LocalizationContext";
import { COLORS } from "../constants/colors";
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
      
      // Format time: HH:MM:SS
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      setFormattedTime(`${hours}:${minutes}:${seconds}`);
      
      // Format date: Weekday, Month Day, Year
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setFormattedDate(now.toLocaleDateString(t('common.locale'), options));
    };

    // Update immediately
    updateTime();
    
    // Set interval for updates
    const interval = setInterval(updateTime, 1000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, [t]);

  return (
    <BlurView intensity={30} tint="dark" style={styles.container}>
      <Text style={styles.timeText}>{formattedTime}</Text>
      <Text style={styles.dateText}>{formattedDate}</Text>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.white,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  dateText: {
    fontSize: 18,
    color: COLORS.white,
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
});

export default TimeDisplay;
