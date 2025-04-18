import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { FONT_SIZES, FONT_WEIGHTS } from "../theme/typography"

export const typographyStyles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    marginBottom: 8,
  },
  body: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  error: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: 4,
  },
  link: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
})
