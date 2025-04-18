import { COLORS } from "./colors"
import { DARK_COLORS } from "./darkColors"
import { FONTS, FONT_SIZES, LINE_HEIGHTS, FONT_WEIGHTS } from "./typography"
import { SPACING, RADIUS } from "./spacing"

export const getTheme = (isDarkMode = false) => {
  return {
    colors: isDarkMode ? DARK_COLORS : COLORS,
    fonts: FONTS,
    fontSizes: FONT_SIZES,
    lineHeights: LINE_HEIGHTS,
    fontWeights: FONT_WEIGHTS,
    spacing: SPACING,
    radius: RADIUS,
  }
}

export const getThemeColors = (isDarkMode = false) => {
  return isDarkMode ? DARK_COLORS : COLORS
}
