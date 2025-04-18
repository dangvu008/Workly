"use client"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { useTranslation } from "../i18n/useTranslation"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"

const TranslationExamples = ({ navigation }) => {
  const { t, Trans } = useTranslation() // Lấy Trans từ useTranslation

  // Sample data for dynamic content
  const weatherData = {
    temperature: 28,
    condition: "Sunny",
  }

  const reminderCount = 3
  const breakDuration = 60

  // Helper component for styled text
  const StyledText = ({ children, style }) => <Text style={[styles.styledText, style]}>{children}</Text>

  // Helper component for links
  const TextLink = ({ children, onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.link}>{children}</Text>
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("common.appName")}</Text>

        {/* Welcome message with styled app name */}
        <View style={styles.card}>
          <Trans i18nKey="home.welcomeMessage">
            Welcome to <StyledText>Workly</StyledText>, your personal shift management app!
          </Trans>
        </View>

        {/* Weather alert with dynamic data */}
        <View style={styles.card}>
          <MaterialIcons name="cloud" size={24} color={COLORS.primary} style={styles.icon} />
          <Trans
            i18nKey="home.weatherAlert"
            values={{ temperature: weatherData.temperature, condition: weatherData.condition }}
          >
            Current weather: <StyledText style={styles.temperature}>{weatherData.temperature}°C</StyledText> -
            <Text style={styles.condition}>{weatherData.condition}</Text>
          </Trans>
        </View>

        {/* Instructions with button names */}
        <View style={styles.card}>
          <MaterialIcons name="info" size={24} color={COLORS.primary} style={styles.icon} />
          <Trans i18nKey="home.shiftInstructions">
            Tap <StyledText style={styles.buttonName}>Go to Work</StyledText> to start your shift, then use{" "}
            <StyledText style={styles.buttonName}>Check In</StyledText> when you arrive.
          </Trans>
        </View>

        {/* Reminder note with count and link */}
        <View style={styles.card}>
          <MaterialIcons name="notifications" size={24} color={COLORS.primary} style={styles.icon} />
          <Trans i18nKey="home.reminderNote" values={{ count: reminderCount }}>
            You have <StyledText style={styles.count}>{reminderCount}</StyledText> reminder(s) scheduled for today.{" "}
            <TextLink onPress={() => navigation.navigate("Notes")}>View all</TextLink>.
          </Trans>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("shifts.shiftList")}</Text>

        {/* Shift tip with formatting */}
        <View style={styles.card}>
          <MaterialIcons name="lightbulb" size={24} color={COLORS.accent} style={styles.icon} />
          <Trans i18nKey="shifts.shiftTip">
            For <StyledText style={styles.highlight}>overnight shifts</StyledText>, set the end time to be{" "}
            <StyledText style={styles.highlight}>after midnight</StyledText>.
          </Trans>
        </View>

        {/* Break explanation with dynamic duration */}
        <View style={styles.card}>
          <MaterialIcons name="free-breakfast" size={24} color={COLORS.primary} style={styles.icon} />
          <Trans i18nKey="shifts.breakExplanation" values={{ duration: breakDuration }}>
            A <StyledText style={styles.duration}>{breakDuration}</StyledText> minute break is{" "}
            <StyledText style={styles.highlight}>automatically deducted</StyledText> from your work hours.
          </Trans>
        </View>

        {/* Help text with links */}
        <View style={styles.card}>
          <MaterialIcons name="help" size={24} color={COLORS.info} style={styles.icon} />
          <Trans i18nKey="home.helpText">
            Need help? Visit our <TextLink onPress={() => alert("Opening help center...")}>help center</TextLink> or
            contact <TextLink onPress={() => alert("Opening support...")}>support</TextLink>.
          </Trans>
        </View>
      </View>
    </ScrollView>
  )
}

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
})

export default TranslationExamples
