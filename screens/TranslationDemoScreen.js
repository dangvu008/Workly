"use client"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTranslation } from "../i18n/useTranslation"
import { COLORS } from "../constants/colors"
import TranslationExamples from "../components/TranslationExamples"

const TranslationDemoScreen = ({ navigation }) => {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation()

  const toggleLanguage = () => {
    const currentLang = getCurrentLanguage()
    changeLanguage(currentLang === "en" ? "vi" : "en")
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t("common.appName")} - {t("settings.language")}
        </Text>
        <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
          <Text style={styles.languageButtonText}>
            {getCurrentLanguage() === "en" ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
          </Text>
        </TouchableOpacity>
      </View>

      <TranslationExamples navigation={navigation} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
  },
  languageButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  languageButtonText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
})

export default TranslationDemoScreen
