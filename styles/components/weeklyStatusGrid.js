import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING, RADIUS } from "../theme/spacing"
import { FONT_SIZES } from "../theme/typography"

export const weeklyStatusGridStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGray,
  },
  headerCell: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: "center",
  },
  headerText: {
    fontWeight: "bold",
    color: COLORS.darkGray,
    fontSize: FONT_SIZES.sm,
  },
  daysRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: COLORS.lightGray,
  },
  dayText: {
    fontSize: FONT_SIZES.md,
  },
  currentDay: {
    backgroundColor: COLORS.lightGray,
  },
  currentDayText: {
    fontWeight: "bold",
  },
  scheduledDay: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  completeDay: {
    backgroundColor: COLORS.success + "33", // 20% opacity
  },
  partialDay: {
    backgroundColor: COLORS.warning + "33", // 20% opacity
  },
  activeDayText: {
    color: COLORS.black,
    fontWeight: "500",
  },
})
