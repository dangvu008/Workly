import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING, RADIUS } from "../theme/spacing"
import { FONT_SIZES } from "../theme/typography"

export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: "center",
  },
  date: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  time: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: SPACING.sm,
  },
  status: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    flex: 1,
    marginHorizontal: 4,
  },
  checkOutButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    marginLeft: SPACING.sm,
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllButton: {
    marginRight: SPACING.sm,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  addNoteButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  shiftCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
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
    marginBottom: SPACING.sm,
  },
  shiftName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    color: COLORS.text,
  },
  shiftTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shiftTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 20,
    marginHorizontal: SPACING.md,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  weatherCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weatherLocation: {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  weatherInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  weatherTextInfo: {
    marginLeft: SPACING.md,
  },
  weatherTemp: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "bold",
  },
  weatherDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
    textTransform: "capitalize",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warning + "20",
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  warningText: {
    color: COLORS.darkGray,
    marginLeft: SPACING.sm,
    flex: 1,
  },
})
