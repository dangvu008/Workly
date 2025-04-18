import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING, RADIUS } from "../theme/spacing"
import { FONT_SIZES } from "../theme/typography"

export const settingsScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    marginVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginHorizontal: SPACING.md,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    color: COLORS.text,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  settingDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    marginTop: 4,
  },
  choiceValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  choiceText: {
    color: COLORS.primary,
    marginRight: 4,
  },
})
