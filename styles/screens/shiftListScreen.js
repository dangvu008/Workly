import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING, RADIUS } from "../theme/spacing"
import { FONT_SIZES, FONT_WEIGHTS } from "../theme/typography"

export const shiftListScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  shiftCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  shiftName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  shiftDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  shiftTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  shiftTimeText: {
    marginLeft: 4,
    color: COLORS.darkGray,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDayCircle: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  activeDayText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  emptySubText: {
    color: COLORS.gray,
    textAlign: "center",
  },
})
