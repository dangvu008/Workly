import { StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { FONT_SIZES } from "../theme/typography";

export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appDark,
  },
  header: {
    backgroundColor: COLORS.appDarkLight,
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  date: {
    color: COLORS.appDarkTextSecondary,
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
    backgroundColor: COLORS.appPurple,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.md,
    backgroundColor: COLORS.appDarkLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.appPurple,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    flex: 1,
    marginHorizontal: 4,
  },
  checkOutButton: {
    backgroundColor: COLORS.appStatusError,
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
    color: COLORS.white,
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllButton: {
    marginRight: SPACING.sm,
  },
  viewAllText: {
    color: COLORS.appPurple,
    fontWeight: "bold",
  },
  addNoteButton: {
    backgroundColor: COLORS.appPurple,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  shiftCard: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
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
    color: COLORS.white,
  },
  shiftTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shiftTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.appDarkTextSecondary,
  },
  emptyState: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.md,
    padding: 20,
    marginHorizontal: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  emptyText: {
    color: COLORS.appDarkTextSecondary,
    marginBottom: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.appPurple,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  weatherCard: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  weatherLocation: {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    marginBottom: SPACING.sm,
    textAlign: "center",
    color: COLORS.white,
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
    color: COLORS.white,
  },
  weatherDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.appDarkTextSecondary,
    textTransform: "capitalize",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)", // Amber-500 with opacity
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)", // Amber-500 with opacity
  },
  warningText: {
    color: COLORS.appDarkTextSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});
