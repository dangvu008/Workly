"use client";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalization } from "../localization/LocalizationContext";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

const TranslationExamples = ({ navigation }) => {
  const { t } = useLocalization(); // Chỉ cần lấy hàm t để dịch

  // Sample data for dynamic content
  const weatherData = {
    temperature: 28,
    condition: "Sunny",
  };

  const reminderCount = 3;
  const breakDuration = 60;

  // Helper component for styled text
  const StyledText = ({ children, style }) => (
    <Text style={[styles.styledText, style]}>{children}</Text>
  );

  // Helper component for links
  const TextLink = ({ children, onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.link}>{children}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("common.appName")}</Text>

        {/* Welcome message with styled app name */}
        <View style={styles.card}>
          <Text>{t("home.welcomeMessage")}</Text>
        </View>

        {/* Weather alert with dynamic data */}
        <View style={styles.card}>
          <MaterialIcons
            name="cloud"
            size={24}
            color={COLORS.primary}
            style={styles.icon}
          />
          <Text>
            {t("home.weatherAlert", {
              temperature: weatherData.temperature,
              condition: weatherData.condition,
            })}
          </Text>
        </View>

        {/* Instructions with button names */}
        <View style={styles.card}>
          <MaterialIcons
            name="info"
            size={24}
            color={COLORS.primary}
            style={styles.icon}
          />
          <Text>{t("home.shiftInstructions")}</Text>
        </View>

        {/* Reminder note with count and link */}
        <View style={styles.card}>
          <MaterialIcons
            name="notifications"
            size={24}
            color={COLORS.primary}
            style={styles.icon}
          />
          <Text>{t("home.reminderNote", { count: reminderCount })}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Notes")}>
            <Text style={styles.link}>{t("common.viewAll")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("shifts.shiftList")}</Text>

        {/* Shift tip with formatting */}
        <View style={styles.card}>
          <MaterialIcons
            name="lightbulb"
            size={24}
            color={COLORS.accent}
            style={styles.icon}
          />
          <Text>{t("shifts.shiftTip")}</Text>
        </View>

        {/* Break explanation with dynamic duration */}
        <View style={styles.card}>
          <MaterialIcons
            name="free-breakfast"
            size={24}
            color={COLORS.primary}
            style={styles.icon}
          />
          <Text>
            {t("shifts.breakExplanation", { duration: breakDuration })}
          </Text>
        </View>

        {/* Help text with links */}
        <View style={styles.card}>
          <MaterialIcons
            name="help"
            size={24}
            color={COLORS.info}
            style={styles.icon}
          />
          <Text>{t("home.helpText")}</Text>
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <TouchableOpacity onPress={() => alert("Opening help center...")}>
              <Text style={styles.link}>{t("common.helpCenter")}</Text>
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 4 }}> | </Text>
            <TouchableOpacity onPress={() => alert("Opening support...")}>
              <Text style={styles.link}>{t("common.support")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  styledText: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  temperature: {
    fontWeight: "bold",
    color: COLORS.error,
  },
  condition: {
    fontStyle: "italic",
    color: COLORS.primary,
  },
  buttonName: {
    fontWeight: "bold",
    color: COLORS.accent,
  },
  count: {
    fontWeight: "bold",
    color: COLORS.info,
  },
  highlight: {
    fontWeight: "bold",
    backgroundColor: COLORS.accent + "30",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  duration: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  link: {
    color: COLORS.info,
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
});

export default TranslationExamples;
