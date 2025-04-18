"use client"

import { useEffect, useRef } from "react"
import { View, StyleSheet, Animated, Dimensions } from "react-native"
import { COLORS } from "../constants/colors"
import { MaterialIcons } from "@expo/vector-icons"
import GradientBackground from "./GradientBackground"
import AnimatedLogo from "./AnimatedLogo"

const { width, height } = Dimensions.get("window")

const AnimatedSplashScreen = ({ onAnimationComplete }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const iconOpacity = useRef(new Animated.Value(0)).current
  const iconPosition = useRef(new Animated.Value(20)).current
  const backgroundOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Start the animation sequence
    Animated.sequence([
      // Fade in and scale up the logo
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),

      // Fade in the text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),

      // Animate the icons
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(iconPosition, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Hold for a moment
      Animated.delay(1200),

      // Fade out the entire splash screen
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animation complete callback
      if (onAnimationComplete) {
        onAnimationComplete()
      }
    })
  }, [logoScale, logoOpacity, textOpacity, iconOpacity, iconPosition, backgroundOpacity, onAnimationComplete])

  return (
    <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
      <GradientBackground>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <AnimatedLogo size="large" />
          </Animated.View>

          <Animated.Text style={[styles.title, { opacity: textOpacity }]}>Workly</Animated.Text>

          <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>
            Manage your work shifts with ease
          </Animated.Text>

          <Animated.View
            style={[
              styles.iconRow,
              {
                opacity: iconOpacity,
                transform: [{ translateY: iconPosition }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="access-time" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.iconCircle}>
              <MaterialIcons name="event" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.iconCircle}>
              <MaterialIcons name="notifications" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.iconCircle}>
              <MaterialIcons name="cloud" size={24} color={COLORS.primary} />
            </View>
          </Animated.View>
        </View>
      </GradientBackground>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
})

export default AnimatedSplashScreen
