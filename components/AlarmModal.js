"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { View, Text, Modal, TouchableOpacity, Vibration } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { playAlarmSound, stopAlarmSound } from "../utils/alarmSoundUtils";
import { formatDate } from "../utils/dateUtils";
import { useLocalization } from "../localization/LocalizationContext";
import { alarmModalStyles } from "../styles/components/alarmModal";
import { useTheme } from "../context/ThemeContext";

// Hằng số
const AUTO_DISMISS_TIME = 300; // 5 phút = 300 giây
const VIBRATION_PATTERN = [500, 500]; // 500ms rung, 500ms nghỉ
const TIMER_INTERVAL = 1000; // 1 giây

const AlarmModal = memo(
  ({
    visible,
    onDismiss,
    title,
    message,
    alarmSound = "alarm_1",
    vibrationEnabled = true,
  }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const { t } = useLocalization();
    const { colors } = useTheme();

    // Reset elapsed time when modal closes
    useEffect(() => {
      if (!visible) {
        setElapsedTime(0);
      }
    }, [visible]);

    // Phát âm thanh và rung khi modal hiển thị
    useEffect(() => {
      let interval = null;

      if (visible) {
        // Phát âm thanh
        const setupSound = async () => {
          try {
            await playAlarmSound(alarmSound);
          } catch (error) {
            console.error("Error playing alarm sound:", error);
          }
        };

        setupSound();

        // Rung nếu được bật
        if (vibrationEnabled) {
          try {
            // Rung theo mẫu: 500ms rung, 500ms nghỉ, lặp lại
            Vibration.vibrate(VIBRATION_PATTERN, true);
          } catch (error) {
            console.error("Error with vibration:", error);
          }
        }

        // Đếm thời gian đã hiển thị
        interval = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, TIMER_INTERVAL);
      }

      // Cleanup function
      return () => {
        if (interval) {
          clearInterval(interval);
        }

        try {
          stopAlarmSound();
          Vibration.cancel();
        } catch (error) {
          console.error("Error stopping alarm:", error);
        }
      };
    }, [visible, alarmSound, vibrationEnabled]);

    // Tự động đóng sau 5 phút nếu không có tương tác
    useEffect(() => {
      if (elapsedTime >= AUTO_DISMISS_TIME && visible) {
        onDismiss();
      }
    }, [elapsedTime, onDismiss, visible]);

    // Định dạng thời gian đã hiển thị - tối ưu với useCallback
    const formatElapsedTime = useCallback(() => {
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }, [elapsedTime]);

    // Tối ưu hóa các giá trị hiển thị với useMemo
    const displayTitle = useMemo(() => title || t("alarm.alarm"), [title, t]);
    const displayMessage = useMemo(
      () => message || t("alarm.timeToWork"),
      [message, t]
    );
    const currentDateTime = useMemo(() => formatDate(new Date(), "full"), []);
    const displayTimeText = useMemo(
      () => `${t("alarm.displayTime")}: ${formatElapsedTime()}`,
      [t, formatElapsedTime]
    );
    const dismissButtonText = useMemo(() => t("alarm.dismissAlarm"), [t]);

    // Xử lý đóng modal
    const handleDismiss = useCallback(() => {
      onDismiss();
    }, [onDismiss]);

    // Xử lý khi nhấn nút back trên thiết bị
    const handleRequestClose = useCallback(() => {
      onDismiss();
      return true;
    }, [onDismiss]);

    if (!visible) {
      return null;
    }

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleRequestClose}
      >
        <View style={alarmModalStyles.modalOverlay}>
          <View
            style={[
              alarmModalStyles.modalContent,
              { backgroundColor: colors.card },
            ]}
          >
            <View
              style={[
                alarmModalStyles.alarmIcon,
                { backgroundColor: colors.accent + "20" },
              ]}
            >
              <MaterialIcons name="alarm-on" size={48} color={colors.primary} />
            </View>

            <Text style={[alarmModalStyles.title, { color: colors.text }]}>
              {displayTitle}
            </Text>
            <Text
              style={[alarmModalStyles.message, { color: colors.darkGray }]}
            >
              {displayMessage}
            </Text>
            <Text style={[alarmModalStyles.time, { color: colors.primary }]}>
              {currentDateTime}
            </Text>
            <Text
              style={[alarmModalStyles.elapsedTime, { color: colors.gray }]}
            >
              {displayTimeText}
            </Text>

            <TouchableOpacity
              style={[
                alarmModalStyles.dismissButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  alarmModalStyles.dismissButtonText,
                  { color: colors.white },
                ]}
              >
                {dismissButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
);

AlarmModal.displayName = "AlarmModal";

export default AlarmModal;
