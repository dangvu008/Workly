"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Animated,
  ActivityIndicator,
  Dimensions,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDate, timeToMinutes, formatDuration } from "../utils/dateUtils";
import { useLocalization } from "../localization/LocalizationContext";
import { multiButtonStyles } from "../styles/components/multiButton";
import { useTheme } from "../context/ThemeContext";
// Import Haptics module from Expo
import * as Haptics from "expo-haptics";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Constants
const { width } = Dimensions.get("window");
const isSmallScreen = width < 375;
const ANIMATION_DURATION = {
  SHORT: 100,
  MEDIUM: 300,
  LONG: 500,
};
const HAPTIC_TYPES = {
  LIGHT: "light",
  MEDIUM: "medium",
  HEAVY: "heavy",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
};

// Memoized LogItem component
const LogItem = memo(({ item, colors, t, formatDate }) => {
  // Determine log type and icon
  const logInfo = useMemo(() => {
    let logTypeText = "";
    let logIcon = "";
    let iconContainerStyle = null;

    switch (item.type) {
      case "go_work":
        logTypeText = t("home.logGoWork");
        logIcon = "directions-walk";
        iconContainerStyle = multiButtonStyles.logIconContainerGoWork;
        break;
      case "check_in":
        logTypeText = t("home.logCheckIn");
        logIcon = "login";
        iconContainerStyle = multiButtonStyles.logIconContainerCheckIn;
        break;
      case "punch":
        logTypeText = t("home.logPunch");
        logIcon = "check-circle-outline";
        iconContainerStyle = multiButtonStyles.logIconContainer;
        break;
      case "check_out":
        logTypeText = t("home.logCheckOut");
        logIcon = "logout";
        iconContainerStyle = multiButtonStyles.logIconContainerCheckOut;
        break;
      case "complete":
        logTypeText = t("home.logComplete");
        logIcon = "check-circle";
        iconContainerStyle = multiButtonStyles.logIconContainer;
        break;
      default:
        logTypeText = item.type;
        logIcon = "info";
        iconContainerStyle = multiButtonStyles.logIconContainer;
    }

    return { logTypeText, logIcon, iconContainerStyle };
  }, [item.type, t]);

  return (
    <View style={multiButtonStyles.logItem}>
      <View
        style={[multiButtonStyles.logIconContainer, logInfo.iconContainerStyle]}
      >
        <MaterialIcons name={logInfo.logIcon} size={16} color={colors.white} />
      </View>
      <View style={multiButtonStyles.logContent}>
        <Text style={multiButtonStyles.logType}>{logInfo.logTypeText}</Text>
        <Text style={multiButtonStyles.logTime}>
          {formatDate(new Date(item.date), "time").slice(0, 5)}
        </Text>
      </View>
    </View>
  );
});

// Set display name for debugging
LogItem.displayName = "LogItem";

// Memoized ConfirmationDialog component
const ConfirmationDialog = memo(
  ({ visible, title, message, onConfirm, onCancel, colors, t }) => {
    if (!visible) return null;

    return (
      <View style={multiButtonStyles.confirmationOverlay}>
        <View
          style={[
            multiButtonStyles.confirmationDialog,
            {
              backgroundColor: colors.card,
            },
          ]}
        >
          <Text
            style={[
              multiButtonStyles.confirmationTitle,
              { color: colors.text },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              multiButtonStyles.confirmationMessage,
              { color: colors.darkGray },
            ]}
          >
            {message}
          </Text>

          <View style={multiButtonStyles.confirmationButtons}>
            <TouchableOpacity
              style={[
                multiButtonStyles.confirmationButton,
                multiButtonStyles.cancelButton,
              ]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={multiButtonStyles.confirmationButtonText}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                multiButtonStyles.confirmationButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  multiButtonStyles.confirmationButtonText,
                  { color: colors.white },
                ]}
              >
                {t("common.confirm")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
);

// Set display name for debugging
ConfirmationDialog.displayName = "ConfirmationDialog";

// Main MultiButton component
const MultiButton = () => {
  const {
    userSettings,
    shifts,
    addAttendanceLog,
    resetDailyWorkStatus,
    getLogsForDate,
    getDailyStatusForDate,
  } = useAppContext();
  const { t } = useLocalization();
  const { colors, isDarkMode } = useTheme();

  // State
  const [activeShift, setActiveShift] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("not_started");
  const [todayLogs, setTodayLogs] = useState([]);
  const [buttonEnabled, setButtonEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workDuration, setWorkDuration] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Animation values - memoized to avoid recreating on each render
  const animationValues = useMemo(
    () => ({
      scaleAnim: new Animated.Value(1),
      opacityAnim: new Animated.Value(1),
      rotateAnim: new Animated.Value(0),
      progressAnim: new Animated.Value(0),
      logsHeightAnim: new Animated.Value(0),
      buttonColorAnim: new Animated.Value(0),
      pulseAnim: new Animated.Value(1),
      slideAnim: new Animated.Value(-50),
      fadeAnim: new Animated.Value(0),
    }),
    []
  );

  const {
    scaleAnim,
    opacityAnim,
    rotateAnim,
    progressAnim,
    logsHeightAnim,
    buttonColorAnim,
    pulseAnim,
    slideAnim,
    fadeAnim,
  } = animationValues;

  // Refs
  const timerRef = useRef(null);
  const pulseTimerRef = useRef(null);
  const prevStatusRef = useRef(currentStatus);
  const confirmationActionsRef = useRef({ onConfirm: null, onCancel: null });

  // Function to trigger haptic feedback based on intensity - optimized with useCallback
  const triggerHapticFeedback = useCallback(
    (intensity = HAPTIC_TYPES.MEDIUM) => {
      // Only trigger haptic feedback if it's enabled in user settings
      if (userSettings.hapticFeedbackEnabled !== false) {
        try {
          switch (intensity) {
            case HAPTIC_TYPES.LIGHT:
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              break;
            case HAPTIC_TYPES.MEDIUM:
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              break;
            case HAPTIC_TYPES.HEAVY:
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              break;
            case HAPTIC_TYPES.SUCCESS:
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              break;
            case HAPTIC_TYPES.WARNING:
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
              break;
            case HAPTIC_TYPES.ERROR:
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              break;
            default:
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        } catch (error) {
          console.log("Haptic feedback error:", error);
          // Silently fail if haptics aren't available
        }
      }
    },
    [userSettings.hapticFeedbackEnabled]
  );

  // Animation functions - optimized with useCallback
  const animateButtonPress = useCallback(() => {
    // Trigger medium haptic feedback for main button press
    triggerHapticFeedback(HAPTIC_TYPES.MEDIUM);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: ANIMATION_DURATION.SHORT,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: ANIMATION_DURATION.SHORT,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION.SHORT,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION.SHORT,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [scaleAnim, opacityAnim, triggerHapticFeedback]);

  const animateResetButton = useCallback(() => {
    // Trigger warning haptic feedback for reset button
    triggerHapticFeedback(HAPTIC_TYPES.WARNING);

    Animated.timing(rotateAnim, {
      toValue: rotateAnim._value + 1,
      duration: ANIMATION_DURATION.LONG,
      useNativeDriver: true,
    }).start();
  }, [rotateAnim, triggerHapticFeedback]);

  // Start timer to track work duration - optimized with useCallback
  const startWorkDurationTimer = useCallback(
    (checkInTime) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const updateDuration = () => {
        const now = new Date();
        const durationMinutes = Math.floor((now - checkInTime) / 60000);
        setWorkDuration(durationMinutes);

        // Animate progress based on expected work duration (8 hours by default)
        const expectedDuration = 8 * 60; // 8 hours in minutes
        const progress = Math.min(durationMinutes / expectedDuration, 1);

        Animated.timing(progressAnim, {
          toValue: progress,
          duration: ANIMATION_DURATION.MEDIUM,
          useNativeDriver: false,
        }).start();
      };

      updateDuration(); // Initial update
      timerRef.current = setInterval(updateDuration, 60000); // Update every minute
    },
    [progressAnim]
  );

  // Pulse animation functions - optimized with useCallback
  const startPulseAnimation = useCallback(() => {
    if (pulseTimerRef.current) return;

    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    };

    pulse();
    pulseTimerRef.current = setInterval(pulse, 1600);
  }, [pulseAnim]);

  const stopPulseAnimation = useCallback(() => {
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;

      // Reset to normal size
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.SHORT,
        useNativeDriver: true,
      }).start();
    }
  }, [pulseAnim]);

  // Animate logs container - optimized with useCallback
  const animateLogsContainer = useCallback(
    (show) => {
      // Trigger light haptic feedback when toggling logs
      triggerHapticFeedback(HAPTIC_TYPES.LIGHT);

      const targetHeight = show ? 1 : 0;

      Animated.timing(logsHeightAnim, {
        toValue: targetHeight,
        duration: ANIMATION_DURATION.SHORT,
        useNativeDriver: false,
      }).start();
    },
    [logsHeightAnim, triggerHapticFeedback]
  );

  // Toggle logs visibility - optimized with useCallback
  const toggleLogs = useCallback(() => {
    // Trigger haptic feedback when toggling logs
    triggerHapticFeedback(HAPTIC_TYPES.LIGHT);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowLogs((prev) => !prev);
    animateLogsContainer(!showLogs);
  }, [showLogs, animateLogsContainer, triggerHapticFeedback]);

  // Animate status change - optimized with useCallback
  const animateStatusChange = useCallback(
    (newStatus) => {
      // Trigger appropriate haptic feedback based on the new status
      switch (newStatus) {
        case "waiting_check_in":
          triggerHapticFeedback(HAPTIC_TYPES.LIGHT);
          break;
        case "working":
          triggerHapticFeedback(HAPTIC_TYPES.SUCCESS);
          break;
        case "ready_to_complete":
          triggerHapticFeedback(HAPTIC_TYPES.MEDIUM);
          break;
        case "completed":
          triggerHapticFeedback(HAPTIC_TYPES.SUCCESS);
          break;
        default:
          triggerHapticFeedback(HAPTIC_TYPES.LIGHT);
      }

      // Animate button color change
      Animated.timing(buttonColorAnim, {
        toValue: getButtonColorValue(newStatus),
        duration: ANIMATION_DURATION.MEDIUM,
        useNativeDriver: false,
      }).start();

      // Slide in the status text
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: ANIMATION_DURATION.SHORT / 2,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION.SHORT / 2,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION.SHORT,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION.SHORT,
          useNativeDriver: true,
        }),
      ]).start();

      // Use LayoutAnimation for smooth transition
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    },
    [
      buttonColorAnim,
      slideAnim,
      fadeAnim,
      triggerHapticFeedback,
      getButtonColorValue,
    ]
  );

  // Get button color value for animation - memoized to avoid recalculation
  const getButtonColorValue = useCallback((status) => {
    switch (status) {
      case "not_started":
        return 0;
      case "waiting_check_in":
        return 1;
      case "working":
        return 2;
      case "ready_to_complete":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  }, []);

  // Find shift for today - optimized with useEffect
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today
      .toLocaleString("en-US", { weekday: "short" })
      .substring(0, 3);

    // Get current status
    const dailyStatus = getDailyStatusForDate(today);

    // Animate status change if status is different
    if (dailyStatus.status !== currentStatus) {
      animateStatusChange(dailyStatus.status);
    }

    setCurrentStatus(dailyStatus.status);
    prevStatusRef.current = dailyStatus.status;

    // If there's already a shiftId in the status, use it
    if (dailyStatus.shiftId) {
      const shift = shifts.find((s) => s.id === dailyStatus.shiftId);
      if (shift) {
        setActiveShift(shift);

        // Start timer if currently working
        if (dailyStatus.status === "working" && dailyStatus.checkInTime) {
          startWorkDurationTimer(new Date(dailyStatus.checkInTime));
        }

        return;
      }
    }

    // If not, find appropriate shift for today
    const todayShifts = shifts.filter((shift) =>
      shift.daysApplied.includes(dayOfWeek)
    );

    if (todayShifts.length === 1) {
      setActiveShift(todayShifts[0]);
    } else if (todayShifts.length > 1) {
      // If multiple shifts, choose the one closest to current time
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      todayShifts.sort((a, b) => {
        const startA = timeToMinutes(a.startTime);
        const startB = timeToMinutes(b.startTime);

        // Calculate distance to current time
        const distanceA = Math.abs(startA - currentMinutes);
        const distanceB = Math.abs(startB - currentMinutes);

        return distanceA - distanceB;
      });

      setActiveShift(todayShifts[0]);
    }
  }, [
    shifts,
    getDailyStatusForDate,
    animateStatusChange,
    startWorkDurationTimer,
    currentStatus,
  ]);

  // Get logs for today - optimized with useEffect
  useEffect(() => {
    try {
      const logs = getLogsForDate(new Date());

      // Use LayoutAnimation for smooth transition when logs change
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      setTodayLogs(logs);

      // If we have logs, animate the logs container
      if (logs.length > 0 && !showLogs) {
        setTimeout(() => {
          setShowLogs(true);
          animateLogsContainer(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
      setErrorMessage(t("errors.cannotLoadLogs"));
    }
  }, [getLogsForDate, animateLogsContainer, showLogs, t]);

  // Check if button should be enabled - optimized with useEffect
  useEffect(() => {
    if (!activeShift) {
      setButtonEnabled(false);
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    switch (currentStatus) {
      case "not_started":
        // Always allow "Go to Work"
        setButtonEnabled(true);
        break;
      case "waiting_check_in": {
        // Allow check-in when close to start time (within 30 minutes)
        const startMinutes = timeToMinutes(activeShift.startTime);
        setButtonEnabled(Math.abs(currentMinutes - startMinutes) <= 30);
        break;
      }
      case "working": {
        // Allow check-out when worked minimum time or close to end time
        const dailyStatus = getDailyStatusForDate(now);
        if (dailyStatus.checkInTime) {
          const checkInTime = new Date(dailyStatus.checkInTime);
          const workingMinutes = Math.floor((now - checkInTime) / 60000);

          // Minimum 30 minutes work or close to end time
          const officeEndMinutes = timeToMinutes(activeShift.officeEndTime);
          setButtonEnabled(
            workingMinutes >= 30 ||
              Math.abs(currentMinutes - officeEndMinutes) <= 30
          );

          // Start pulsing animation when close to end time
          if (Math.abs(currentMinutes - officeEndMinutes) <= 15) {
            startPulseAnimation();
          } else {
            stopPulseAnimation();
          }
        } else {
          setButtonEnabled(false);
        }
        break;
      }
      case "ready_to_complete":
        // Always allow completion
        setButtonEnabled(true);
        break;
      case "completed":
        // Already completed, disable main button
        setButtonEnabled(false);
        break;
      default:
        setButtonEnabled(true);
    }
  }, [
    currentStatus,
    activeShift,
    getDailyStatusForDate,
    startPulseAnimation,
    stopPulseAnimation,
  ]);

  // Cleanup timers on unmount - optimized with useEffect
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (pulseTimerRef.current) {
        clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
    };
  }, []);

  // Action handlers - optimized with useCallback
  const handleGoWork = useCallback(() => {
    if (!activeShift) return;

    try {
      // Trigger success haptic feedback when going to work
      triggerHapticFeedback(HAPTIC_TYPES.SUCCESS);
      addAttendanceLog("go_work", activeShift.id);
      setCurrentStatus("waiting_check_in");
    } catch (error) {
      console.error("Error handling go work:", error);
      setErrorMessage(t("errors.cannotStartShift"));
      triggerHapticFeedback(HAPTIC_TYPES.ERROR);
    }
  }, [activeShift, addAttendanceLog, triggerHapticFeedback, t]);

  const handleCheckIn = useCallback(() => {
    if (!activeShift) return;

    try {
      // Trigger success haptic feedback when checking in
      triggerHapticFeedback(HAPTIC_TYPES.SUCCESS);
      const now = new Date();
      addAttendanceLog("check_in", activeShift.id);
      setCurrentStatus("working");
      startWorkDurationTimer(now);
    } catch (error) {
      console.error("Error handling check in:", error);
      setErrorMessage(t("errors.cannotCheckIn"));
      triggerHapticFeedback(HAPTIC_TYPES.ERROR);
    }
  }, [
    activeShift,
    addAttendanceLog,
    triggerHapticFeedback,
    startWorkDurationTimer,
  ]);

  const handlePunch = useCallback(() => {
    if (!activeShift) return;

    try {
      // Trigger medium haptic feedback when punching
      triggerHapticFeedback(HAPTIC_TYPES.MEDIUM);
      animateButtonPress();
      addAttendanceLog("punch", activeShift.id);
    } catch (error) {
      console.error("Error handling punch:", error);
      setErrorMessage(t("errors.cannotPunch"));
      triggerHapticFeedback(HAPTIC_TYPES.ERROR);
    }
  }, [
    activeShift,
    animateButtonPress,
    addAttendanceLog,
    triggerHapticFeedback,
    t,
  ]);

  const handleCheckOut = useCallback(() => {
    if (!activeShift) return;

    try {
      // Trigger success haptic feedback when checking out
      triggerHapticFeedback(HAPTIC_TYPES.SUCCESS);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (pulseTimerRef.current) {
        clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }

      addAttendanceLog("check_out", activeShift.id);
      setCurrentStatus("ready_to_complete");
      setWorkDuration(null);
    } catch (error) {
      console.error("Error handling check out:", error);
      setErrorMessage(t("errors.cannotCheckOut"));
      triggerHapticFeedback(HAPTIC_TYPES.ERROR);
    }
  }, [activeShift, addAttendanceLog, triggerHapticFeedback, t]);

  const handleComplete = useCallback(() => {
    if (!activeShift) return;

    try {
      // Trigger success haptic feedback
      triggerHapticFeedback(HAPTIC_TYPES.SUCCESS);
      addAttendanceLog("complete", activeShift.id);
      setCurrentStatus("completed");
    } catch (error) {
      console.error("Error handling complete:", error);
      setErrorMessage(t("errors.cannotCompleteShift"));
      triggerHapticFeedback(HAPTIC_TYPES.ERROR);
    }
  }, [activeShift, addAttendanceLog, triggerHapticFeedback, t]);

  // Execute action after confirmation - optimized with useCallback
  const executeAction = useCallback(
    (action) => {
      if (!activeShift) return;

      setIsProcessing(true);

      // Simulate a short delay for better UX
      setTimeout(() => {
        try {
          switch (action) {
            case "go_work":
              handleGoWork();
              break;
            case "check_in":
              handleCheckIn();
              break;
            case "check_out":
              handleCheckOut();
              break;
            case "complete":
              handleComplete();
              break;
            case "punch":
              handlePunch();
              break;
          }
        } catch (error) {
          console.error("Error executing action:", error);
          setErrorMessage(t("errors.cannotPerformAction", { action }));
          triggerHapticFeedback(HAPTIC_TYPES.ERROR);
        } finally {
          setIsProcessing(false);
          setShowConfirmation(false);
          setPendingAction(null);
        }
      }, 300);
    },
    [
      activeShift,
      handleGoWork,
      handleCheckIn,
      handleCheckOut,
      handleComplete,
      handlePunch,
      triggerHapticFeedback,
      t,
    ]
  );

  // Handle button press - optimized with useCallback
  const handleButtonPress = useCallback(() => {
    if (!activeShift) {
      // Trigger error haptic feedback when there's no active shift
      triggerHapticFeedback(HAPTIC_TYPES.ERROR);
      Alert.alert(t("common.error"), t("home.noActiveShift"));
      return;
    }

    animateButtonPress();

    switch (currentStatus) {
      case "not_started":
        executeAction("go_work");
        break;
      case "waiting_check_in":
        executeAction("check_in");
        break;
      case "working":
        // Show confirmation for check-out
        setPendingAction("check_out");
        setShowConfirmation(true);
        // Trigger warning haptic feedback for confirmation dialog
        triggerHapticFeedback(HAPTIC_TYPES.WARNING);
        break;
      case "ready_to_complete":
        executeAction("complete");
        break;
      default:
        break;
    }
  }, [
    activeShift,
    currentStatus,
    animateButtonPress,
    executeAction,
    triggerHapticFeedback,
    t,
  ]);

  // Handle confirmation dialog - optimized with useCallback
  const handleConfirmation = useCallback(
    (confirmed) => {
      if (confirmed && pendingAction) {
        // Trigger success haptic feedback when confirming
        triggerHapticFeedback(HAPTIC_TYPES.SUCCESS);
        executeAction(pendingAction);
      } else {
        // Trigger light haptic feedback when canceling
        triggerHapticFeedback(HAPTIC_TYPES.LIGHT);
        setShowConfirmation(false);
        setPendingAction(null);
      }
    },
    [pendingAction, executeAction, triggerHapticFeedback]
  );

  // Handle reset - optimized with useCallback
  const handleReset = useCallback(() => {
    animateResetButton();

    Alert.alert(t("common.confirm"), t("home.resetConfirmation"), [
      {
        text: t("common.cancel"),
        style: "cancel",
        onPress: () => triggerHapticFeedback(HAPTIC_TYPES.LIGHT),
      },
      {
        text: t("common.confirm"),
        onPress: () => {
          // Trigger error haptic feedback when resetting
          triggerHapticFeedback(HAPTIC_TYPES.ERROR);

          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          if (pulseTimerRef.current) {
            clearInterval(pulseTimerRef.current);
            pulseTimerRef.current = null;
          }

          resetDailyWorkStatus();
          setCurrentStatus("not_started");
          setTodayLogs([]);
          setWorkDuration(null);

          // Animate logs container closing
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setShowLogs(false);
          animateLogsContainer(false);
        },
        style: "destructive",
      },
    ]);
  }, [
    animateResetButton,
    t,
    triggerHapticFeedback,
    resetDailyWorkStatus,
    animateLogsContainer,
  ]);

  // Memoized values
  // Button display info based on status - memoized to avoid recalculation
  const buttonDisplayInfo = useMemo(() => {
    switch (currentStatus) {
      case "not_started":
        return {
          text: t("home.goWork"),
          icon: "directions-walk",
          color: colors.primary,
          description: t("home.goWorkDescription") || "Start your workday",
        };
      case "waiting_check_in":
        return {
          text: t("home.waitingCheckIn"),
          icon: "schedule",
          color: colors.info,
          description:
            t("home.waitingCheckInDescription") || "Ready to check in",
        };
      case "working":
        return {
          text: t("home.checkOut"),
          icon: "logout",
          color: colors.error,
          description: workDuration
            ? t("home.workingFor", {
                duration: formatDuration(workDuration),
              }) || `Working for ${formatDuration(workDuration)}`
            : "",
        };
      case "ready_to_complete":
        return {
          text: t("home.complete"),
          icon: "check-circle",
          color: colors.success,
          description: t("home.completeDescription") || "Finish your workday",
        };
      case "completed":
        return {
          text: t("home.completed"),
          icon: "done-all",
          color: colors.gray,
          description: t("home.completedDescription") || "Workday completed",
        };
      default:
        return {
          text: t("home.goWork"),
          icon: "directions-walk",
          color: colors.primary,
          description: "",
        };
    }
  }, [currentStatus, t, colors, workDuration]);

  // Interpolate button color - memoized to avoid recalculation
  const buttonColor = useMemo(
    () =>
      buttonColorAnim.interpolate({
        inputRange: [0, 1, 2, 3, 4],
        outputRange: [
          colors.primary,
          colors.info,
          colors.error,
          colors.success,
          colors.gray,
        ],
      }),
    [buttonColorAnim, colors]
  );

  // Rotate interpolation for reset button - memoized to avoid recalculation
  const spin = useMemo(
    () =>
      rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [rotateAnim]
  );

  // Progress bar width interpolation - memoized to avoid recalculation
  const progressWidth = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      }),
    [progressAnim]
  );

  // Optimized render item function for FlatList
  const renderLogItem = useCallback(
    ({ item }) => (
      <LogItem item={item} colors={colors} t={t} formatDate={formatDate} />
    ),
    [colors, t]
  );

  // Memoized confirmation dialog props
  const confirmationDialogProps = useMemo(() => {
    if (!showConfirmation) return { visible: false };

    let title = "";
    let message = "";

    switch (pendingAction) {
      case "check_out":
        title = t("home.confirmCheckOut") || "Confirm Check Out";
        message =
          t("home.confirmCheckOutMessage") ||
          "Are you sure you want to check out now?";
        break;
      default:
        return { visible: false };
    }

    return {
      visible: true,
      title,
      message,
      onConfirm: () => handleConfirmation(true),
      onCancel: () => handleConfirmation(false),
      colors,
      t,
    };
  }, [showConfirmation, pendingAction, t, colors, handleConfirmation]);

  // Check if punch button should be shown - memoized to avoid recalculation
  const showPunchButton = useMemo(
    () => currentStatus === "working" && activeShift && activeShift.showPunch,
    [currentStatus, activeShift]
  );

  // Check if reset button should be shown - memoized to avoid recalculation
  const showResetButton = useMemo(
    () => todayLogs.length > 0,
    [todayLogs.length]
  );

  // Get button info
  const buttonInfo = buttonDisplayInfo;

  // Error handling
  useEffect(() => {
    if (errorMessage) {
      Alert.alert(t("common.error"), errorMessage, [
        {
          text: t("common.ok"),
          onPress: () => setErrorMessage(null),
        },
      ]);
    }
  }, [errorMessage, t]);

  return (
    <View style={multiButtonStyles.container}>
      <View style={multiButtonStyles.buttonContainer}>
        {/* Main button */}
        <Animated.View
          style={{
            transform: [
              { scale: scaleAnim },
              ...(currentStatus === "working" ? [{ scale: pulseAnim }] : []),
            ],
            opacity: opacityAnim,
          }}
        >
          <TouchableOpacity
            style={[
              multiButtonStyles.mainButton,
              { backgroundColor: buttonColor },
              !buttonEnabled && multiButtonStyles.disabledButton,
            ]}
            onPress={handleButtonPress}
            disabled={!buttonEnabled || isProcessing}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={buttonInfo.text}
            accessibilityHint={buttonInfo.description}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color={colors.white} />
            ) : (
              <>
                <MaterialIcons name="check" size={32} color={colors.white} />
                <Text
                  style={[
                    multiButtonStyles.buttonText,
                    { color: colors.white },
                  ]}
                >
                  {t("home.punch")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Progress bar for working time */}
          {currentStatus === "working" && workDuration > 0 && (
            <View style={multiButtonStyles.progressBarContainer}>
              <Animated.View
                style={[
                  multiButtonStyles.progressBar,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
          )}

          {buttonInfo.description ? (
            <Animated.Text
              style={[
                multiButtonStyles.buttonDescription,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {buttonInfo.description}
            </Animated.Text>
          ) : null}
        </Animated.View>

        {/* Reset button */}
        {showResetButton && (
          <Animated.View
            style={[
              multiButtonStyles.resetButton,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleReset}
              disabled={isProcessing}
              style={multiButtonStyles.resetButtonTouchable}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t("common.reset")}
            >
              <MaterialIcons name="refresh" size={16} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Punch button (if needed) */}
      {showPunchButton && (
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={multiButtonStyles.punchButton}
            onPress={handlePunch}
            disabled={isProcessing}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t("home.punch")}
          >
            <MaterialIcons name="touch-app" size={20} color={colors.white} />
            <Text
              style={[
                multiButtonStyles.punchButtonText,
                { color: colors.white },
              ]}
            >
              {t("home.punch")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Display current shift */}
      {activeShift && (
        <Animated.View
          style={[
            multiButtonStyles.activeShiftContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text
            style={multiButtonStyles.activeShiftText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t("home.activeShift")}: {activeShift.name} ({activeShift.startTime}{" "}
            - {activeShift.endTime})
          </Text>
        </Animated.View>
      )}

      {/* Working time display */}
      <Text
        style={{
          color: colors.appDarkTextSecondary,
          textAlign: "center",
          marginTop: 8,
        }}
      >
        Đã đi làm 22:41
      </Text>

      {/* Logs history - always visible */}
      {todayLogs.length > 0 && (
        <View style={multiButtonStyles.logsContainer}>
          {todayLogs.slice(0, 3).map((item, index) => (
            <LogItem
              key={item.id || index}
              item={item}
              colors={colors}
              t={t}
              formatDate={formatDate}
            />
          ))}
        </View>
      )}

      {/* Confirmation Dialog as Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={multiButtonStyles.confirmationOverlay}>
          <View style={multiButtonStyles.confirmationDialog}>
            <Text style={multiButtonStyles.confirmationTitle}>
              {confirmationDialogProps.title || t("common.confirm")}
            </Text>
            <Text style={multiButtonStyles.confirmationMessage}>
              {confirmationDialogProps.message || ""}
            </Text>
            <View style={multiButtonStyles.confirmationButtons}>
              <TouchableOpacity
                style={[
                  multiButtonStyles.confirmationButton,
                  multiButtonStyles.cancelButton,
                ]}
                onPress={() => handleConfirmation(false)}
              >
                <Text style={multiButtonStyles.confirmationButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  multiButtonStyles.confirmationButton,
                  { backgroundColor: colors.appPurple },
                ]}
                onPress={() => handleConfirmation(true)}
              >
                <Text
                  style={[
                    multiButtonStyles.confirmationButtonText,
                    { color: colors.white },
                  ]}
                >
                  {t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default memo(MultiButton);
