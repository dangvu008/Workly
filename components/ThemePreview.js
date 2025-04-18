"use client"
import { View, Text, StyleSheet } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { SPACING, RADIUS, FONT_SIZES } from "../styles/theme"

const ThemePreview = () => {
  const { colors, isDarkMode } = useTheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{isDarkMode ? "Dark Theme" : "Light Theme"}</Text>

      <View style={styles.colorsContainer}>
        <ColorSwatch name="Primary" color={colors.primary} textColor={colors.white} />
        <ColorSwatch name="Accent" color={colors.accent} textColor={colors.text} />
        <ColorSwatch name="Background" color={colors.background} textColor={colors.text} />
        <ColorSwatch name="Card" color={colors.card} textColor={colors.text} />
        <ColorSwatch name="Text" color={colors.text} textColor={colors.background} />
      </View>
    </View>
  )
}

const ColorSwatch = ({ name, color, textColor }) => (
  <View style={[styles.swatch, { backgroundColor: color }]}>
    <Text style={[styles.swatchText, { color: textColor }]}>{name}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  colorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  swatch: {
    width: "48%",
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  swatchText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "bold",
  },
})

export default ThemePreview
