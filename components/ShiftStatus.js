import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalization } from "../localization/LocalizationContext";
import { COLORS } from "../constants/colors";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const ShiftStatus = ({ status, onCheckIn, onCheckOut }) => {
  const { t } = useLocalization();
  const [animation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  // Status colors
  const statusColors = {
    notCheckedIn: COLORS.primary,
    checkedIn: COLORS.success,
    checkedOut: COLORS.gray,
  };

  // Status icons
  const statusIcons = {
    notCheckedIn: "login",
    checkedIn: "timer",
    checkedOut: "check-circle",
  };

  // Get current status color
  const getStatusColor = useCallback(() => {
    switch (status) {
      case "notCheckedIn":
        return statusColors.notCheckedIn;
      case "checkedIn":
        return statusColors.checkedIn;
      case "checkedOut":
        return statusColors.checkedOut;
      default:
        return statusColors.notCheckedIn;
    }
  }, [status, statusColors]);

  // Get current status icon
  const getStatusIcon = useCallback(() => {
    switch (status) {
      case "notCheckedIn":
        return statusIcons.notCheckedIn;
      case "checkedIn":
        return statusIcons.checkedIn;
      case "checkedOut":
        return statusIcons.checkedOut;
      default:
        return statusIcons.notCheckedIn;
    }
  }, [status, statusIcons]);

  // Get current status text
  const getStatusText = useCallback(() => {
    switch (status) {
      case "notCheckedIn":
        return t("attendance.checkIn");
      case "checkedIn":
        return t("attendance.checkOut");
      case "checkedOut":
        return t("attendance.completed");
      default:
        return t("attendance.checkIn");
    }
  }, [status, t]);

  // Handle button press
  const handlePress = useCallback(() => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate button press
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Call appropriate function based on status
    if (status === "notCheckedIn") {
      onCheckIn();
    } else if (status === "checkedIn") {
      onCheckOut();
    }
  }, [status, animation, onCheckIn, onCheckOut]);

  // Pulse animation for checked in status
  useEffect(() => {
    if (status === "checkedIn") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [status, pulseAnimation]);

  // Animation interpolations
  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [
              { scale: status === "checkedIn" ? pulseAnimation : scale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: getStatusColor() },
            status === "checkedOut" && styles.disabledButton,
          ]}
          onPress={handlePress}
          disabled={status === "checkedOut"}
        >
          <BlurView intensity={20} tint="light" style={styles.blurView}>
            <MaterialIcons
              name={getStatusIcon()}
              size={40}
              color={COLORS.white}
            />
            <Text style={styles.buttonText}>{getStatusText()}</Text>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  buttonContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  button: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  blurView: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ShiftStatus;
