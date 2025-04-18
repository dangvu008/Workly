# Attendo Style Guide

This document outlines the style system for the Attendo application, providing guidelines on how to use and extend the styling architecture.

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Theme Variables](#theme-variables)
3. [Common Styles](#common-styles)
4. [Component Styles](#component-styles)
5. [Screen Styles](#screen-styles)
6. [Usage Guidelines](#usage-guidelines)
7. [Dark Mode](#dark-mode)
8. [Responsive Design](#responsive-design)
9. [Best Practices](#best-practices)

## Directory Structure

The styles are organized into the following directory structure:

\`\`\`
styles/
├── theme/              # Theme variables
│   ├── colors.js       # Light theme colors
│   ├── darkColors.js   # Dark theme colors
│   ├── typography.js   # Font families, sizes, weights
│   ├── spacing.js      # Spacing and radius values
│   ├── index.js        # Exports all theme variables
│   └── themeManager.js # Theme switching utilities
├── common/             # Common/shared styles
│   ├── layout.js       # Layout styles (container, row, etc.)
│   ├── typography.js   # Text styles (title, body, etc.)
│   ├── buttons.js      # Button styles
│   ├── forms.js        # Form element styles
│   └── index.js        # Exports all common styles
├── components/         # Component-specific styles
│   ├── alarmModal.js   # Styles for AlarmModal component
│   ├── multiButton.js  # Styles for MultiButton component
│   └── ...             # Other component styles
├── screens/            # Screen-specific styles
│   ├── homeScreen.js   # Styles for HomeScreen
│   ├── settingsScreen.js # Styles for SettingsScreen
│   └── ...             # Other screen styles
└── index.js            # Main entry point that exports all styles
\`\`\`

## Theme Variables

Theme variables are the foundation of the style system. They define the basic design tokens used throughout the application.

### Colors

Colors are defined in `theme/colors.js` for light mode and `theme/darkColors.js` for dark mode:

\`\`\`javascript
// Example from colors.js
export const COLORS = {
  primary: "#4A6572",
  primaryDark: "#344955",
  accent: "#F9AA33",
  // ...
}
\`\`\`

### Typography

Typography variables are defined in `theme/typography.js`:

\`\`\`javascript
export const FONTS = {
  regular: Platform.OS === "ios" ? "System" : "Roboto",
  medium: Platform.OS === "ios" ? "System" : "Roboto-Medium",
  bold: Platform.OS === "ios" ? "System" : "Roboto-Bold",
}

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  // ...
}
\`\`\`

### Spacing

Spacing and radius values are defined in `theme/spacing.js`:

\`\`\`javascript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  // ...
}

export const RADIUS = {
  xs: 2,
  sm: 4,
  md: 8,
  // ...
}
\`\`\`

## Common Styles

Common styles are reusable styles that can be applied across multiple components:

### Layout Styles

\`\`\`javascript
// Example from common/layout.js
export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  // ...
})
\`\`\`

### Typography Styles

\`\`\`javascript
// Example from common/typography.js
export const typographyStyles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: 8,
  },
  // ...
})
\`\`\`

## Component Styles

Component styles are specific to individual components:

\`\`\`javascript
// Example from components/alarmModal.js
export const alarmModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  // ...
})
\`\`\`

## Screen Styles

Screen styles are specific to individual screens:

\`\`\`javascript
// Example from screens/homeScreen.js
export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: "center",
  },
  // ...
})
\`\`\`

## Usage Guidelines

### Importing Styles

Import styles from the appropriate files:

\`\`\`javascript
// Import theme variables
import { COLORS, FONT_SIZES } from "../styles/theme"

// Import common styles
import { layoutStyles, typographyStyles } from "../styles/common"

// Import component-specific styles
import { alarmModalStyles } from "../styles/components/alarmModal"

// Import screen-specific styles
import { homeScreenStyles } from "../styles/screens/homeScreen"
\`\`\`

### Applying Styles

Apply styles to components:

\`\`\`javascript
// Basic style application
<View style={layoutStyles.container}>
  <Text style={typographyStyles.title}>Title</Text>
</View>

// Combining styles
<TouchableOpacity 
  style={[buttonStyles.button, buttonStyles.primaryButton]}
>
  <Text style={buttonStyles.buttonText}>Button</Text>
</TouchableOpacity>

// Conditional styles
<View style={[
  styles.dayCell,
  isCurrentDay && styles.currentDay,
  isSelected && styles.selectedDay
]}>
\`\`\`

### Creating New Component Styles

When creating styles for a new component:

1. Create a new file in the appropriate directory (e.g., `styles/components/newComponent.js`)
2. Import theme variables
3. Define styles using `StyleSheet.create()`
4. Export the styles
5. Update the index file to export the new styles

\`\`\`javascript
// styles/components/newComponent.js
import { StyleSheet } from "react-native"
import { COLORS } from "../theme/colors"
import { SPACING, RADIUS } from "../theme/spacing"
import { FONT_SIZES } from "../theme/typography"

export const newComponentStyles = StyleSheet.create({
  container: {
    // ...
  },
  // ...
})
\`\`\`

## Dark Mode

The style system supports dark mode through the `themeManager.js` file:

\`\`\`javascript
// Using theme manager to get current theme colors
import { getThemeColors } from "../styles/theme/themeManager"

const colors = getThemeColors(isDarkMode)
\`\`\`

To create styles that support both light and dark mode:

1. Use the `getThemeColors` function to get the appropriate color set
2. Create dynamic styles based on the current theme

\`\`\`javascript
// Example of dynamic styles for dark mode
const getDynamicStyles = (isDarkMode) => {
  const colors = getThemeColors(isDarkMode)
  
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      // ...
    },
    // ...
  })
}
\`\`\`

## Responsive Design

For responsive design, consider using:

1. Percentage values for widths and heights
2. Flex layouts for adaptable UI
3. Device dimension utilities from React Native

\`\`\`javascript
import { Dimensions } from "react-native"

const { width, height } = Dimensions.get("window")

// Create responsive styles
const styles = StyleSheet.create({
  container: {
    width: width * 0.9, // 90% of screen width
    maxHeight: height * 0.7, // 70% of screen height
  },
})
\`\`\`

## Best Practices

1. **Use Theme Variables**: Always use theme variables instead of hardcoded values
2. **Consistent Naming**: Follow the established naming convention
3. **Component Organization**: Keep component styles in separate files
4. **Avoid Inline Styles**: Use the style system instead of inline styles
5. **Style Composition**: Compose styles using arrays for flexibility
6. **Comments**: Add comments for complex style rules
7. **Avoid Duplication**: Reuse common styles when possible
8. **Keep Files Small**: Split large style files into logical groups
9. **Update Index Files**: Always update index files when adding new style files
10. **Test on Multiple Devices**: Ensure styles work well on different screen sizes
\`\`\`

## Let's update the main index.js file to export everything:
