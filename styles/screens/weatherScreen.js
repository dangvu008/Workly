import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING, RADIUS } from "../theme/spacing"
import { FONT_SIZES } from "../theme/typography"

export const weatherScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    marginTop: SPACING.md,
    color: COLORS.darkGray,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  weatherContainer: {
    padding: SPACING.md,
  },
  weatherHeader: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  locationText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "bold",
    color: COLORS.text,
  },
  updateText: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
  weatherMain: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  temperatureText: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  descriptionText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.darkGray,
    textTransform: "capitalize",
  },
  weatherDetails: {
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
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  detailText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  warningContainer: {
    backgroundColor: COLORS.warning + "20",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  warningText: {
    marginLeft: SPACING.sm,
    color: COLORS.darkGray,
    flex: 1,
  },
  forecastSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  forecastTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    marginLeft: SPACING.sm,
  },
})
