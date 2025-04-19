import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { FONT_SIZES, FONT_WEIGHTS } from "../theme/typography";

const { width } = Dimensions.get("window");

export const weeklyStatusGridStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: COLORS.appDarkLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  headerCell: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: "center",
  },
  headerText: {
    fontWeight: "bold",
    color: COLORS.appDarkTextSecondary,
    fontSize: FONT_SIZES.sm,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: width / 7 - 2,
    aspectRatio: 0.9,
    margin: 1,
    padding: SPACING.xs,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.appDark,
  },
  dayName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.appDarkTextSecondary,
    marginBottom: 2,
  },
  dayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },
  statusIcon: {
    marginTop: 2,
  },
  currentDay: {
    backgroundColor: COLORS.appDarkLight,
    borderWidth: 2,
  },
  currentDayText: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.appPurple,
  },
  scheduledDay: {
    borderWidth: 1,
    borderColor: COLORS.appPurple,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: COLORS.appDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  statusSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
    marginLeft: SPACING.xs,
  },
  editButton: {
    backgroundColor: COLORS.appPurple,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  editButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },
  logsSection: {
    marginBottom: SPACING.md,
  },
  logsList: {
    maxHeight: 150,
  },
  logItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  logType: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },
  logTime: {
    color: COLORS.appDarkTextSecondary,
  },
  statusPicker: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  pickerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statusOption: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.appDark,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  statusOptionIcon: {
    marginRight: SPACING.sm,
  },
  statusOptionText: {
    color: COLORS.white,
    flex: 1,
  },
  cancelButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  cancelButtonText: {
    color: COLORS.appDarkTextSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
