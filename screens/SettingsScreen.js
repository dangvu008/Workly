"use client";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useCallback, useState } from "react";

import { useAppContext } from "../context/AppContext";
import { COLORS } from "../styles/theme/colors";
import { FONT_SIZES, FONT_WEIGHTS } from "../styles/theme/typography";
import { SPACING } from "../styles/theme/spacing";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useLocalization } from "../localization/LocalizationContext";
// Import UI components
import { Switch } from "../components/ui/Switch";
import { Dropdown } from "../components/ui/Dropdown";
import Constants from "expo-constants"; // Import Constants to get app version
import { useTheme } from "@react-navigation/native";

const SettingsScreen = ({ navigation }) => {
  const { userSettings, updateSettings, exportData, importData } =
    useAppContext();
  const { t } = useLocalization();
  const theme = useTheme();

  // Get app version from app.json via Constants
  const appVersion = Constants.manifest.version || "1.0.0";

  // Local state for settings
  const [darkMode, setDarkMode] = useState(userSettings.theme === "dark");
  const [language, setLanguage] = useState(userSettings.language || "vi");
  const [notificationSound, setNotificationSound] = useState(
    userSettings.alarmSoundEnabled || true
  );
  const [notificationVibration, setNotificationVibration] = useState(
    userSettings.alarmVibrationEnabled || true
  );
  const [weatherAlerts, setWeatherAlerts] = useState(
    userSettings.weatherWarningEnabled || true
  );
  const [multiButtonMode, setMultiButtonMode] = useState(
    userSettings.multiButtonMode || "full"
  );
  const [shiftReminderMode, setShiftReminderMode] = useState(
    userSettings.changeShiftReminderMode || "ask_weekly"
  );
  const [timeFormat, setTimeFormat] = useState(
    userSettings.timeFormat || "24h"
  );
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(
    userSettings.firstDayOfWeek || "Mon"
  );

  // Thay thế hàm handleExportData
  const handleExportData = useCallback(async () => {
    try {
      const data = await exportData();
      const fileName = `workly_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert(
          t("backup.sharingNotAvailable"),
          t("backup.sharingNotAvailableMessage")
        );
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert(t("common.error"), t("backup.exportError"));
    }
  }, [exportData, t]);

  // Thay thế hàm handleImportData
  const handleImportData = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        const fileContent = await FileSystem.readAsStringAsync(result.uri);

        Alert.alert(
          t("backup.confirmRestore"),
          t("backup.confirmRestoreMessage"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("backup.importData"),
              onPress: async () => {
                try {
                  await importData(fileContent);
                  Alert.alert(t("common.success"), t("backup.importSuccess"));
                } catch (error) {
                  console.error("Error importing data:", error);
                  Alert.alert(t("common.error"), t("backup.importError"));
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert(t("common.error"), t("backup.importError"));
    }
  }, [t, importData]);

  // Language options
  const languageOptions = [
    { label: "Tiếng Việt", value: "vi" },
    { label: "English", value: "en" },
  ];

  // Multi-button mode options
  const buttonModeOptions = [
    { label: "Đầy đủ", value: "full" },
    { label: "Đơn giản", value: "simple" },
  ];

  // Shift reminder mode options
  const reminderModeOptions = [
    { label: "Hỏi hàng tuần", value: "ask_weekly" },
    { label: "Tự động xoay ca", value: "rotate" },
    { label: "Tắt", value: "disabled" },
  ];

  // First day of week options
  const weekStartOptions = [
    { label: "Thứ 2", value: "Mon" },
    { label: "Chủ nhật", value: "Sun" },
  ];

  // Handle language change
  const handleLanguageChange = useCallback(
    (value) => {
      setLanguage(value);
      updateSettings({ language: value });
    },
    [updateSettings]
  );

  // Handle dark mode toggle
  const handleDarkModeToggle = useCallback(
    (value) => {
      setDarkMode(value);
      updateSettings({ theme: value ? "dark" : "light" });
    },
    [updateSettings]
  );

  // Handle notification sound toggle
  const handleNotificationSoundToggle = useCallback(
    (value) => {
      setNotificationSound(value);
      updateSettings({ alarmSoundEnabled: value });
    },
    [updateSettings]
  );

  // Handle notification vibration toggle
  const handleNotificationVibrationToggle = useCallback(
    (value) => {
      setNotificationVibration(value);
      updateSettings({ alarmVibrationEnabled: value });
    },
    [updateSettings]
  );

  // Handle weather alerts toggle
  const handleWeatherAlertsToggle = useCallback(
    (value) => {
      setWeatherAlerts(value);
      updateSettings({ weatherWarningEnabled: value });
    },
    [updateSettings]
  );

  // Handle multi-button mode change
  const handleButtonModeChange = useCallback(
    (value) => {
      setMultiButtonMode(value);
      updateSettings({ multiButtonMode: value });
    },
    [updateSettings]
  );

  // Handle shift reminder mode change
  const handleReminderModeChange = useCallback(
    (value) => {
      setShiftReminderMode(value);
      updateSettings({ changeShiftReminderMode: value });
    },
    [updateSettings]
  );

  // Handle time format toggle
  const handleTimeFormatToggle = useCallback(
    (value) => {
      const newFormat = value ? "24h" : "12h";
      setTimeFormat(newFormat);
      updateSettings({ timeFormat: newFormat });
    },
    [updateSettings]
  );

  // Handle first day of week change
  const handleWeekStartChange = useCallback(
    (value) => {
      setFirstDayOfWeek(value);
      updateSettings({ firstDayOfWeek: value });
    },
    [updateSettings]
  );

  // Navigate to location settings
  const navigateToLocationSettings = useCallback(() => {
    // TODO: Implement location settings screen
    Alert.alert(
      t("common.notification"),
      t("settings.descriptions.updateLocation")
    );
  }, [t]);

  // Navigate to weather threshold settings
  const navigateToWeatherThresholds = useCallback(() => {
    // TODO: Implement weather threshold settings screen
    Alert.alert(t("common.notification"), "Tính năng đang phát triển");
  }, [t]);

  // Navigate to shift management
  const navigateToShiftManagement = useCallback(() => {
    navigation.navigate("ShiftList");
  }, [navigation]);

  return (
    <ScrollView style={newStyles.container}>
      <View style={newStyles.header}>
        <Text style={newStyles.headerTitle}>Cài đặt chung</Text>
      </View>

      {/* Theme Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Chế độ tối</Text>
        <View style={newStyles.settingRow}>
          <View>
            <Text style={newStyles.settingLabel}>Bật chế độ tối</Text>
            <Text style={newStyles.settingDescription}>
              Để có trải nghiệm xem tốt hơn trong điều kiện ánh sáng yếu
            </Text>
          </View>
          <Switch value={darkMode} onValueChange={handleDarkModeToggle} />
        </View>
      </View>

      {/* Language Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Ngôn ngữ</Text>
        <Dropdown
          value={language}
          options={languageOptions}
          onValueChange={handleLanguageChange}
        />
      </View>

      {/* Notifications Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Thông báo</Text>

        <View style={newStyles.settingRow}>
          <View>
            <Text style={newStyles.settingLabel}>Âm thanh thông báo</Text>
            <Text style={newStyles.settingDescription}>
              Phát âm thanh khi có thông báo
            </Text>
          </View>
          <Switch
            value={notificationSound}
            onValueChange={handleNotificationSoundToggle}
          />
        </View>

        <View style={newStyles.settingRow}>
          <View>
            <Text style={newStyles.settingLabel}>Rung thông báo</Text>
            <Text style={newStyles.settingDescription}>
              Rung khi có thông báo
            </Text>
          </View>
          <Switch
            value={notificationVibration}
            onValueChange={handleNotificationVibrationToggle}
          />
        </View>
      </View>

      {/* Weather Alerts Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Cảnh báo thời tiết</Text>

        <View style={newStyles.settingRow}>
          <View>
            <Text style={newStyles.settingLabel}>
              Nhận cảnh báo về thời tiết
            </Text>
            <Text style={newStyles.settingDescription}>
              Nhận cảnh báo về thời tiết cực đoan có thể ảnh hưởng đến lịch làm
              việc
            </Text>
          </View>
          <Switch
            value={weatherAlerts}
            onValueChange={handleWeatherAlertsToggle}
          />
        </View>

        {weatherAlerts && (
          <>
            <TouchableOpacity
              style={newStyles.actionButton}
              onPress={navigateToLocationSettings}
            >
              <Text style={newStyles.actionButtonText}>Cài đặt vị trí</Text>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.appDarkTextSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={newStyles.actionButton}
              onPress={navigateToWeatherThresholds}
            >
              <Text style={newStyles.actionButtonText}>
                Cài đặt ngưỡng cảnh báo
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.appDarkTextSecondary}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Multi-function Button Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Nút đa năng</Text>
        <Text style={newStyles.settingLabel}>Chế độ nút đa năng</Text>
        <Dropdown
          value={multiButtonMode}
          options={buttonModeOptions}
          onValueChange={handleButtonModeChange}
        />
      </View>

      {/* Shift Reminder Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Nhắc nhở ca làm việc</Text>
        <Text style={newStyles.settingLabel}>Chế độ nhắc nhở đổi ca</Text>
        <Dropdown
          value={shiftReminderMode}
          options={reminderModeOptions}
          onValueChange={handleReminderModeChange}
        />

        <TouchableOpacity
          style={newStyles.actionButton}
          onPress={navigateToShiftManagement}
        >
          <Text style={newStyles.actionButtonText}>Quản lý ca làm việc</Text>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={COLORS.appDarkTextSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Display Settings Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Hiển thị</Text>

        <View style={newStyles.settingRow}>
          <View>
            <Text style={newStyles.settingLabel}>Định dạng 24 giờ</Text>
            <Text style={newStyles.settingDescription}>
              Hiển thị giờ theo định dạng 24 giờ (13:00) thay vì 12 giờ (1:00
              PM)
            </Text>
          </View>
          <Switch
            value={timeFormat === "24h"}
            onValueChange={handleTimeFormatToggle}
          />
        </View>

        <Text style={newStyles.settingLabel}>Ngày bắt đầu tuần</Text>
        <Dropdown
          value={firstDayOfWeek}
          options={weekStartOptions}
          onValueChange={handleWeekStartChange}
        />
      </View>

      {/* Backup & Restore Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Sao lưu & Khôi phục</Text>
        <TouchableOpacity
          style={newStyles.actionButton}
          onPress={handleExportData}
        >
          <Text style={newStyles.actionButtonText}>Sao lưu dữ liệu</Text>
          <MaterialIcons
            name="backup"
            size={24}
            color={COLORS.appDarkTextSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={newStyles.actionButton}
          onPress={handleImportData}
        >
          <Text style={newStyles.actionButtonText}>Khôi phục dữ liệu</Text>
          <MaterialIcons
            name="restore"
            size={24}
            color={COLORS.appDarkTextSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View style={newStyles.section}>
        <Text style={newStyles.sectionTitle}>Thông tin ứng dụng</Text>
        <View style={newStyles.infoRow}>
          <Text style={newStyles.infoLabel}>Phiên bản</Text>
          <Text style={newStyles.infoValue}>{appVersion}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// New styles for updated design
const newStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appDark,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  section: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: SPACING.sm,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.appDarkTextSecondary,
    maxWidth: "90%",
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 8,
    padding: SPACING.sm,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: SPACING.xs,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.appDarkTextSecondary,
  },
});

export default SettingsScreen;
