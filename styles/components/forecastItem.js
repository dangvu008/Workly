import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING, RADIUS } from "../theme/spacing"
import { FONT_SIZES, FONT_WEIGHTS } from "../theme/typography"

export const forecastItemStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  dayContainer: {
    width: 80,
  },
  dayText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  iconContainer: {
    width: 50,
    alignItems: "center",
  },
  tempContainer: {
    flexDirection: "row",
    width: 80,
    justifyContent: "space-around",
    marginHorizontal: SPACING.sm,
  },
  maxTemp: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  minTemp: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  description: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.darkGray,
    textTransform: "capitalize",
  },
})
