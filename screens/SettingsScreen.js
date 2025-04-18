"use client";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useCallback } from "react";

import { useAppContext } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useLocalization } from "../localization/LocalizationContext";
// Import the useThemedStyles hook and createSettingsScreenStyles
import { useThemedStyles } from "../hooks/useThemedStyles";
import { createSettingsScreenStyles } from "../styles/screens/settingsScreenThemed";
// Import the ThemePreview component
import ThemePreview from "../components/ThemePreview";
import Logo from "../components/Logo"; // Import the Logo component
import Constants from "expo-constants"; // Import Constants to get app version
import { useTheme } from "@react-navigation/native";

const SettingsScreen = ({ navigation }) => {
  const { userSettings, updateSettings, exportData, importData } =
    useAppContext();
  const { t } = useLocalization();
  const { colors } = useTheme();

  // Get app version from app.json via Constants
  const appVersion = Constants.manifest.version || "1.0.0";

  // Add this inside the SettingsScreen component, before the return statement:
  const styles = useThemedStyles(extendedCreateSettingsScreenStyles);

  // Tối ưu hóa các hàm xử lý sự kiện bằng useCallback
  // Thay thế hàm toggleSetting
  const toggleSetting = useCallback(
    (key) => {
      updateSettings({ [key]: !userSettings[key] });
    },
    [updateSettings, userSettings]
  );

  // Thay thế hàm handleMultiButtonModeChange
  const handleMultiButtonModeChange = useCallback(() => {
    const newMode = userSettings.multiButtonMode === "full" ? "simple" : "full";
    updateSettings({ multiButtonMode: newMode });
  }, [userSettings.multiButtonMode, updateSettings]);

  // Thay thế hàm handleFirstDayOfWeekChange
  const handleFirstDayOfWeekChange = useCallback(() => {
    const newDay = userSettings.firstDayOfWeek === "Mon" ? "Sun" : "Mon";
    updateSettings({ firstDayOfWeek: newDay });
  }, [userSettings.firstDayOfWeek, updateSettings]);

  // Thay thế hàm handleTimeFormatChange
  const handleTimeFormatChange = useCallback(() => {
    const newFormat = userSettings.timeFormat === "24h" ? "12h" : "24h";
    updateSettings({ timeFormat: newFormat });
  }, [userSettings.timeFormat, updateSettings]);

  // Thay thế hàm handleChangeShiftReminderModeChange
  const handleChangeShiftReminderModeChange = useCallback(() => {
    const modes = ["ask_weekly", "rotate", "disabled"];
    const currentIndex = modes.indexOf(userSettings.changeShiftReminderMode);
    const newIndex = (currentIndex + 1) % modes.length;
    updateSettings({ changeShiftReminderMode: modes[newIndex] });
  }, [userSettings.changeShiftReminderMode, updateSettings]);

  // Thay thế hàm handleLanguageChange
  const handleLanguageChange = useCallback(() => {
    const newLanguage = userSettings.language === "vi" ? "en" : "vi";
    updateSettings({ language: newLanguage });
  }, [userSettings.language, updateSettings]);

  // Thay thế hàm handleThemeChange
  const handleThemeChange = useCallback(() => {
    // Cycle through theme options: light -> dark -> system -> light
    const themeOptions = ["light", "dark", "system"];
    const currentIndex = themeOptions.indexOf(userSettings.theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    updateSettings({ theme: themeOptions[nextIndex] });
  }, [userSettings.theme, updateSettings]);

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

  // Tối ưu hóa các hàm render bằng useCallback
  // Thay thế hàm renderSwitchSetting
  const renderSwitchSetting = useCallback(
    (title, key, description = "") => (
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description ? (
            <Text style={styles.settingDescription}>{description}</Text>
          ) : null}
        </View>
        <Switch
          value={userSettings[key]}
          onValueChange={() => toggleSetting(key)}
          trackColor={{ false: colors.lightGray, true: colors.primary }}
          thumbColor={userSettings[key] ? colors.accent : colors.white}
        />
      </View>
    ),
    [userSettings, toggleSetting, styles, colors]
  );

  // Thay thế hàm renderChoiceSetting
  const renderChoiceSetting = useCallback(
    (title, value, onPress, description = "") => (
      <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description ? (
            <Text style={styles.settingDescription}>{description}</Text>
          ) : null}
        </View>
        <View style={styles.choiceValue}>
          <Text style={styles.choiceText}>{value}</Text>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
        </View>
      </TouchableOpacity>
    ),
    [styles]
  );

  // Thay thế hàm renderActionSetting
  const renderActionSetting = useCallback(
    (title, icon, onPress, description = "") => (
      <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description ? (
            <Text style={styles.settingDescription}>{description}</Text>
          ) : null}
        </View>
        <MaterialIcons name={icon} size={24} color={COLORS.primary} />
      </TouchableOpacity>
    ),
    [styles]
  );

  return (
    <ScrollView style={styles.container}>
      {/* Add app logo and version at the top */}
      <View style={styles.logoContainer}>
        <Logo size="medium" showText={true} />
        <Text style={styles.versionText}>Version {appVersion}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.interface")}</Text>

        {renderChoiceSetting(
          t("settings.multiButtonMode"),
          userSettings.multiButtonMode === "full"
            ? t("settings.options.full")
            : t("settings.options.simple"),
          handleMultiButtonModeChange,
          t("settings.descriptions.multiButton")
        )}

        {renderChoiceSetting(
          t("settings.firstDayOfWeek"),
          userSettings.firstDayOfWeek === "Mon"
            ? t("settings.options.monday")
            : t("settings.options.sunday"),
          handleFirstDayOfWeekChange
        )}

        {renderChoiceSetting(
          t("settings.timeFormat"),
          userSettings.timeFormat === "24h"
            ? t("settings.options.hour24")
            : t("settings.options.hour12"),
          handleTimeFormatChange
        )}

        {renderChoiceSetting(
          t("settings.theme"),
          userSettings.theme === "light"
            ? t("settings.options.light")
            : userSettings.theme === "dark"
            ? t("settings.options.dark")
            : t("settings.options.system"),
          handleThemeChange,
          t("settings.descriptions.theme")
        )}
        <ThemePreview />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.notifications")}</Text>

        {renderSwitchSetting(
          t("settings.alarmSound"),
          "alarmSoundEnabled",
          t("settings.descriptions.alarmSound")
        )}

        {renderSwitchSetting(
          t("settings.alarmVibration"),
          "alarmVibrationEnabled",
          t("settings.descriptions.alarmVibration")
        )}
        {renderSwitchSetting(
          t("settings.hapticFeedback"),
          "hapticFeedbackEnabled",
          t("settings.descriptions.hapticFeedback")
        )}

        {renderChoiceSetting(
          t("settings.shiftChangeReminder"),
          userSettings.changeShiftReminderMode === "ask_weekly"
            ? t("settings.options.askWeekly")
            : userSettings.changeShiftReminderMode === "rotate"
            ? t("settings.options.autoRotate")
            : t("settings.options.disabled"),
          handleChangeShiftReminderModeChange
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.weather")}</Text>

        {renderSwitchSetting(
          t("settings.weatherWarning"),
          "weatherWarningEnabled",
          t("settings.descriptions.weatherWarning")
        )}

        {renderActionSetting(
          t("settings.updateLocation"),
          "location-on",
          () => {
            // This would typically use geolocation
            Alert.alert(
              t("common.notification"),
              t("settings.descriptions.updateLocation")
            );
          },
          t("settings.descriptions.updateLocation")
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.data")}</Text>

        {renderActionSetting(
          t("settings.backupData"),
          "backup",
          handleExportData,
          t("settings.descriptions.backupData")
        )}

        {renderActionSetting(
          t("settings.restoreData"),
          "restore",
          handleImportData,
          t("settings.descriptions.restoreData")
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.other")}</Text>

        {renderChoiceSetting(
          t("settings.language"),
          userSettings.language === "vi"
            ? t("settings.options.vietnamese")
            : t("settings.options.english"),
          () => {
            // Show language options and demo
            navigation.navigate("TranslationDemo");
          },
          t("settings.descriptions.language")
        )}

        {renderActionSetting(t("settings.about"), "info", () => {
          Alert.alert(
            t("common.appName"),
            `Version ${appVersion}\n\nWorkly - Your personal work shift management app.`
          );
        })}
      </View>
    </ScrollView>
  );
};

// Mở rộng styles từ createSettingsScreenStyles
const extendedCreateSettingsScreenStyles = (colors) => {
  const baseStyles = createSettingsScreenStyles(colors);
  return {
    ...baseStyles,
    logoContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      marginBottom: 10,
    },
    versionText: {
      color: colors.gray,
      marginTop: 5,
      fontSize: 12,
    },
  };
};

export default SettingsScreen;
