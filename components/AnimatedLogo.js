"use client"

import { useEffect, useRef } from "react"
import { Animated, View, StyleSheet, Easing } from "react-native"
import { COLORS } from "../constants/colors"
import Logo from "./Logo"

const AnimatedLogo = ({ size = "large", style }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Create a pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Create a subtle rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()

    return () => {
      // Clean up animations
      pulseAnim.stopAnimation()
      rotateAnim.stopAnimation()
    }
  }, [pulseAnim, rotateAnim])

  // Map rotation value to degrees
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: pulseAnim }, { rotate: rotate }],
        },
      ]}
    >
      <View style={styles.logoWrapper}>
        <Logo size={size} showText={false} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 60,
    padding: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
})

export default AnimatedLogo
