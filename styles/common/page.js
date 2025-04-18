import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING } from "../theme/spacing"

const Page = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
})

export default Page
