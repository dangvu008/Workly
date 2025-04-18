"use client"

import { createContext, useContext } from "react"
import { useColorScheme } from "react-native"
import { useAppContext } from "./AppContext"
import { getThemeColors } from "../styles/theme/themeManager"

// Create a context for theme
const ThemeContext = createContext({
  isDarkMode: false,
  colors: {},
})

// Provider component
export const ThemeProvider = ({ children }) => {
  const { userSettings } = useAppContext()
  const systemColorScheme = useColorScheme()

  // Determine if dark mode is active based on user settings or system preference
  const isDarkMode = userSettings.theme === "dark" || (userSettings.theme === "system" && systemColorScheme === "dark")

  // Get the appropriate colors based on the theme
  const colors = getThemeColors(isDarkMode)

  return <ThemeContext.Provider value={{ isDarkMode, colors }}>{children}</ThemeContext.Provider>
}

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext)
