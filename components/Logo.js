import { View, Text, Image, StyleSheet } from "react-native"
import { COLORS } from "../constants/colors"

const Logo = ({ size = "medium", showText = true, style }) => {
  // Determine dimensions based on size
  let dimensions
  let fontSize

  switch (size) {
    case "small":
      dimensions = 32
      fontSize = 14
      break
    case "large":
      dimensions = 96
      fontSize = 24
      break
    case "medium":
    default:
      dimensions = 64
      fontSize = 18
      break
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require("../assets/icon.png")}
        style={[styles.logo, { width: dimensions, height: dimensions }]}
        resizeMode="contain"
      />
      {showText && <Text style={[styles.text, { fontSize }]}>Workly</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    marginBottom: 8,
  },
  text: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
})

export default Logo
