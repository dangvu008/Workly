import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

interface WorklyBackgroundProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'home' | 'minimal' | 'form';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Component WorklyBackground với pattern đặc biệt cho ứng dụng Workly
 * Tối ưu hóa cho theme sáng/tối với pattern công việc
 */
export function WorklyBackground({ 
  children, 
  style, 
  variant = 'default' 
}: WorklyBackgroundProps) {
  const theme = useTheme();
  const isDarkMode = theme.dark;

  // Gradient colors đồng bộ với surface colors
  const getGradientColors = () => {
    if (variant === 'home') {
      // Home screen sử dụng gradient nhẹ từ surface
      if (isDarkMode) {
        return [
          theme.colors.surface,
          theme.colors.background,
          theme.colors.surface,
        ];
      } else {
        return [
          theme.colors.surface,
          theme.colors.background,
          theme.colors.surface,
        ];
      }
    } else if (variant === 'minimal') {
      // Minimal chỉ dùng background đơn sắc
      return [theme.colors.background, theme.colors.background];
    } else if (variant === 'form') {
      // Form variant cho các màn hình form/detail
      return [
        theme.colors.surface,
        theme.colors.surface,
      ];
    } else {
      // Default variant sử dụng surface làm chủ đạo
      return [
        theme.colors.surface,
        theme.colors.surfaceVariant,
        theme.colors.surface,
      ];
    }
  };

  // Render pattern đơn giản thay thế SVG phức tạp
  const renderSimplePattern = () => {
    if (variant === 'minimal') return null;

    // Sử dụng pattern đơn giản với opacity thấp
    const patternOpacity = isDarkMode ? 0.02 : 0.01;

    return (
      <View
        style={[
          styles.simplePattern,
          {
            backgroundColor: theme.colors.primary,
            opacity: patternOpacity,
          }
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Simple Pattern overlay */}
        {renderSimplePattern()}
        
        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </LinearGradient>
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
  simplePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});
