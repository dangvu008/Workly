import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING, RADIUS } from "../theme/spacing"
import { FONT_SIZES } from "../theme/typography"

export const noteItemStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: "row",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    marginHorizontal: SPACING.md,
  },
  content: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  noteContent: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  reminderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  reminderText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginLeft: 4,
  },
  shiftInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  shiftText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  actions: {
    justifyContent: "space-between",
  },
  actionButton: {
    padding: 4,
  },
})
