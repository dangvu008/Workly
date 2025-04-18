import { Platform } from "react-native"

export const FONTS = {
  regular: Platform.OS === "ios" ? "System" : "Roboto",
  medium: Platform.OS === "ios" ? "System" : "Roboto-Medium",
  bold: Platform.OS === "ios" ? "System" : "Roboto-Bold",
}

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  title: 36,
}

export const LINE_HEIGHTS = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 36,
}

export const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  bold: "700",
}
