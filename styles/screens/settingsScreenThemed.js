import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from "../theme"

/**
 * Creates themed styles for the settings screen
 * @param {Object} colors - The theme colors
 * @returns {Object} The styled object for the settings screen
 */
export const createSettingsScreenStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginVertical: SPACING.sm,
    backgroundColor: colors.card,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginHorizontal: SPACING.md,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    color: colors.text,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    color: colors.text,
  },
  settingDescription: {
    fontSize: FONT_SIZES.xs,
    color: colors.gray,
    marginTop: 4,
  },
  choiceValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  choiceText: {
    color: colors.primary,
    marginRight: 4,
  },
})
