import { View, StyleSheet, Dimensions, useColorScheme } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";
import { useAppContext } from "../context/AppContext";

const { width, height } = Dimensions.get("window");

const GradientBackground = ({ children, style }) => {
  const { userSettings } = useAppContext();
  const systemColorScheme = useColorScheme();

  // Use user preference if set, otherwise use system preference
  const isDarkMode =
    userSettings.theme === "auto"
      ? systemColorScheme === "dark"
      : userSettings.theme === "dark";

  // Different gradient colors based on theme
  const gradientColors = isDarkMode
    ? [
        COLORS.darkBackground,
        COLORS.darkBackgroundSecondary,
        COLORS.darkBackgroundAccent,
      ]
    : [COLORS.primary + "20", COLORS.white, COLORS.accent + "10"];

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default GradientBackground;
