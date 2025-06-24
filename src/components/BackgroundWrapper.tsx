import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  style?: any;
  useGradient?: boolean;
  opacity?: number;
}

/**
 * Component BackgroundWrapper để thêm hình nền cho ứng dụng
 * Tự động thích ứng với theme sáng/tối
 */
export function BackgroundWrapper({ 
  children, 
  style, 
  useGradient = true, 
  opacity = 0.05 
}: BackgroundWrapperProps) {
  const theme = useTheme();
  const isDarkMode = theme.dark;

  // Gradient colors dựa trên theme
  const getGradientColors = () => {
    if (isDarkMode) {
      return [
        'rgba(25, 118, 210, 0.08)', // Primary blue với opacity thấp
        'rgba(18, 18, 18, 0.95)',   // Dark background
        'rgba(45, 45, 45, 0.9)',    // Surface variant
        'rgba(18, 18, 18, 1)',      // Pure dark
      ];
    } else {
      return [
        'rgba(25, 118, 210, 0.05)', // Primary blue với opacity thấp
        'rgba(254, 254, 254, 0.95)', // Light background
        'rgba(248, 249, 250, 0.9)',  // Surface variant
        'rgba(255, 255, 255, 1)',    // Pure white
      ];
    }
  };

  // Subtle geometric pattern overlay cho texture
  const getPatternOverlay = () => {
    if (isDarkMode) {
      return {
        backgroundColor: 'transparent',
        opacity: 0.4,
      };
    } else {
      return {
        backgroundColor: 'transparent',
        opacity: 0.3,
      };
    }
  };

  // Tạo pattern SVG cho background
  const getPatternSVG = () => {
    if (isDarkMode) {
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="rgba(144, 202, 249, 0.08)"/>
              <circle cx="10" cy="10" r="0.5" fill="rgba(129, 199, 132, 0.06)"/>
              <circle cx="50" cy="50" r="0.5" fill="rgba(255, 183, 77, 0.04)"/>
              <path d="M0 30 L60 30 M30 0 L30 60" stroke="rgba(144, 202, 249, 0.02)" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      `)}`;
    } else {
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="rgba(25, 118, 210, 0.06)"/>
              <circle cx="10" cy="10" r="0.5" fill="rgba(56, 142, 60, 0.04)"/>
              <circle cx="50" cy="50" r="0.5" fill="rgba(245, 124, 0, 0.03)"/>
              <path d="M0 30 L60 30 M30 0 L30 60" stroke="rgba(25, 118, 210, 0.015)" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      `)}`;
    }
  };

  if (useGradient) {
    return (
      <View style={[styles.container, style]}>
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Subtle pattern overlay với SVG pattern */}
          <View
            style={[
              styles.patternOverlay,
              getPatternOverlay(),
              {
                backgroundImage: `url("${getPatternSVG()}")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '60px 60px',
              }
            ]}
          />

          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Fallback với background color đơn giản
  return (
    <View style={[
      styles.container, 
      { backgroundColor: theme.colors.background },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    pointerEvents: 'none', // Không chặn touch events
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});
