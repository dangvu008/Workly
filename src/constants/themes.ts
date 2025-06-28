import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { StyleSheet, Dimensions } from 'react-native';

// Responsive design constants
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
export const SCREEN_DIMENSIONS = {
  width: screenWidth,
  height: screenHeight,
  isSmallScreen: screenWidth < 375,
  isMediumScreen: screenWidth >= 375 && screenWidth < 414,
  isLargeScreen: screenWidth >= 414,
  isTablet: screenWidth >= 768,
};

// Enhanced typography scale
export const TYPOGRAPHY = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '400' as const },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '400' as const },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '400' as const },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
};

// Enhanced spacing system
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Enhanced border radius system
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 9999,
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors - Modern blue palette
    primary: '#1976D2',
    primaryContainer: '#E3F2FD',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0D47A1',

    // Secondary colors - Success green
    secondary: '#388E3C',
    secondaryContainer: '#E8F5E8',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1B5E20',

    // Tertiary colors - Warning orange
    tertiary: '#F57C00',
    tertiaryContainer: '#FFF3E0',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#E65100',

    // Surface colors - Clean whites and grays
    surface: '#FFFFFF',
    surfaceVariant: '#F8F9FA',
    surfaceTint: '#1976D2',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#5F6368',

    // Background colors
    background: '#FEFEFE',
    onBackground: '#1A1A1A',

    // Error colors
    error: '#D32F2F',
    errorContainer: '#FFEBEE',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',

    // Outline colors
    outline: '#DADCE0',
    outlineVariant: '#E8EAED',

    // Other colors
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#2D2D2D',
    inverseOnSurface: '#F1F1F1',
    inversePrimary: '#90CAF9',

    // Custom colors for Workly
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',

    // Elevation levels with subtle shadows
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors - Bright blue for dark mode
    primary: '#90CAF9',
    primaryContainer: '#1565C0',
    onPrimary: '#0D47A1',
    onPrimaryContainer: '#E3F2FD',

    // Secondary colors - Bright green
    secondary: '#81C784',
    secondaryContainer: '#2E7D32',
    onSecondary: '#1B5E20',
    onSecondaryContainer: '#E8F5E8',

    // Tertiary colors - Bright orange
    tertiary: '#FFB74D',
    tertiaryContainer: '#E65100',
    onTertiary: '#E65100',
    onTertiaryContainer: '#FFF3E0',

    // Surface colors - Dark grays with better contrast
    surface: '#1A1A1A',
    surfaceVariant: '#2D2D2D',
    surfaceTint: '#90CAF9',
    onSurface: '#E8E8E8',
    onSurfaceVariant: '#C4C4C4',

    // Background colors
    background: '#121212',
    onBackground: '#E8E8E8',

    // Error colors
    error: '#EF5350',
    errorContainer: '#B71C1C',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',

    // Outline colors
    outline: '#5F5F5F',
    outlineVariant: '#404040',

    // Other colors
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#E8E8E8',
    inverseOnSurface: '#2D2D2D',
    inversePrimary: '#1976D2',

    // Custom colors for Workly dark mode
    success: '#66BB6A',
    warning: '#FFB74D',
    info: '#64B5F6',

    // Elevation levels with proper dark mode surfaces
    elevation: {
      level0: 'transparent',
      level1: '#1F1F1F',
      level2: '#232323',
      level3: '#252525',
      level4: '#272727',
      level5: '#2C2C2C',
    },
  },
};

// Enhanced common styles with responsive design
export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  containerSmall: {
    flex: 1,
    padding: SPACING.sm,
  },
  containerLarge: {
    flex: 1,
    padding: SPACING.lg,
  },

  // Card styles with enhanced shadows and responsive sizing
  card: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardElevated: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4.65,
  },

  // Button styles
  button: {
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.xs,
  },
  buttonLarge: {
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.sm,
    minHeight: 48, // Accessibility touch target
  },

  // Multi-function button with responsive sizing
  multiButton: {
    height: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    width: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    borderRadius: SCREEN_DIMENSIONS.isSmallScreen ? 50 : 60,
    marginVertical: SPACING.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },

  // Grid layouts
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  weeklyGridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44, // Accessibility touch target
  },

  // Note and content items
  noteItem: {
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },

  // Weather widget
  weatherWidget: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },

  // Statistics and tables
  statisticsTable: {
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.sm,
  },

  // Floating action button
  fab: {
    position: 'absolute',
    margin: SPACING.md,
    right: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.xl,
    elevation: 6,
  },

  // Layout components
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    minHeight: 56, // Standard header height
  },
  section: {
    marginVertical: SPACING.sm,
  },
  sectionLarge: {
    marginVertical: SPACING.md,
  },

  // Typography styles using enhanced scale
  sectionTitle: {
    ...TYPOGRAPHY.titleLarge,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.titleMedium,
    marginBottom: SPACING.xs,
  },
  bodyText: {
    ...TYPOGRAPHY.bodyMedium,
  },
  captionText: {
    ...TYPOGRAPHY.bodySmall,
  },

  // Row layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    minHeight: 44, // Accessibility touch target
  },
  rowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },

  // Alignment utilities
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerHorizontal: {
    alignItems: 'center',
  },
  centerVertical: {
    justifyContent: 'center',
  },

  // Text alignment
  textCenter: {
    textAlign: 'center',
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },

  // Font weights
  textBold: {
    fontWeight: 'bold',
  },
  textMediumWeight: {
    fontWeight: '500',
  },
  textLight: {
    fontWeight: '300',
  },

  // Spacing utilities using enhanced spacing system
  paddingXS: {
    padding: SPACING.xs,
  },
  paddingSmall: {
    padding: SPACING.sm,
  },
  paddingMedium: {
    padding: SPACING.md,
  },
  paddingLarge: {
    padding: SPACING.lg,
  },
  paddingXL: {
    padding: SPACING.xl,
  },

  // Margin utilities
  marginXS: {
    margin: SPACING.xs,
  },
  marginSmall: {
    margin: SPACING.sm,
  },
  marginMedium: {
    margin: SPACING.md,
  },
  marginLarge: {
    margin: SPACING.lg,
  },
  marginXL: {
    margin: SPACING.xl,
  },

  // Responsive text sizes
  textXS: {
    ...TYPOGRAPHY.labelSmall,
  },
  textSmall: {
    ...TYPOGRAPHY.bodySmall,
  },
  textMedium: {
    ...TYPOGRAPHY.bodyMedium,
  },
  textLarge: {
    ...TYPOGRAPHY.bodyLarge,
  },
  textXLarge: {
    ...TYPOGRAPHY.titleMedium,
  },
  textXXLarge: {
    ...TYPOGRAPHY.titleLarge,
  },

  // Loading and state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.sm,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },

  // Accessibility helpers
  accessibleTouchTarget: {
    minHeight: 44,
    minWidth: 44,
  },
  screenReaderOnly: {
    position: 'absolute',
    left: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});

// Animation configurations - Tối ưu hóa cho tốc độ
export const ANIMATIONS = {
  // Timing configurations - Giảm thời gian animation
  timing: {
    short: 100,  // Giảm từ 200ms xuống 100ms
    medium: 150, // Giảm từ 300ms xuống 150ms
    long: 250,   // Giảm từ 500ms xuống 250ms
  },

  // Easing functions
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    linear: 'linear',
  },

  // Common animation presets
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { transform: [{ translateY: 50 }], opacity: 0 },
    to: { transform: [{ translateY: 0 }], opacity: 1 },
  },
  scale: {
    from: { transform: [{ scale: 0.8 }], opacity: 0 },
    to: { transform: [{ scale: 1 }], opacity: 1 },
  },
};

// Utility functions for responsive design
export const getResponsiveSize = (small: number, medium: number, large: number): number => {
  if (SCREEN_DIMENSIONS.isSmallScreen) return small;
  if (SCREEN_DIMENSIONS.isMediumScreen) return medium;
  return large;
};

export const getResponsivePadding = (): number => {
  return getResponsiveSize(SPACING.sm, SPACING.md, SPACING.lg);
};

export const getResponsiveFontSize = (baseSize: number): number => {
  const scale = SCREEN_DIMENSIONS.isSmallScreen ? 0.9 :
                SCREEN_DIMENSIONS.isLargeScreen ? 1.1 : 1;
  return Math.round(baseSize * scale);
};
