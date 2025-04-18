"use client"

import { useMemo } from "react"
import { StyleSheet } from "react-native"
import { useTheme } from "../context/ThemeContext"

/**
 * A hook that creates themed styles by applying the current theme colors
 * @param {Function} styleCreator - A function that takes colors and returns a StyleSheet
 * @returns {Object} The themed styles
 */
export const useThemedStyles = (styleCreator) => {
  const { colors } = useTheme()

  // Memoize the styles to avoid recreating them on every render
  const styles = useMemo(() => {
    return StyleSheet.create(styleCreator(colors))
  }, [colors, styleCreator])

  return styles
}
