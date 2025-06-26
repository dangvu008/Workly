import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { commonStyles, SPACING, TYPOGRAPHY } from '../constants/themes';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  overlay?: boolean;
  color?: string;
}

/**
 * Component LoadingSpinner tối ưu hóa với animation mượt mà
 * Sử dụng React.memo để tránh re-render không cần thiết
 */
export const LoadingSpinner = React.memo<LoadingSpinnerProps>(({
  size = 'large',
  message,
  overlay = false,
  color
}) => {
  const theme = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // ✅ Animation fade in đơn giản - tránh lỗi easing
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const containerStyle = overlay ? styles.overlayContainer : styles.container;
  const spinnerColor = color || theme.colors.primary;

  return (
    <Animated.View style={[containerStyle, { opacity: fadeAnim }]}>
      <View style={[
        styles.content,
        { backgroundColor: overlay ? theme.colors.surfaceVariant : 'transparent' }
      ]}>
        <ActivityIndicator
          size={size}
          color={spinnerColor}
          style={styles.spinner}
        />
        {message && (
          <Text
            style={[
              styles.message,
              { color: theme.colors.onSurface }
            ]}
          >
            {message}
          </Text>
        )}
      </View>
    </Animated.View>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

const styles = StyleSheet.create({
  container: {
    ...commonStyles.centerContent,
    padding: SPACING.xl,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    ...commonStyles.centerContent,
    zIndex: 1000,
  },
  content: {
    ...commonStyles.centerContent,
    padding: SPACING.lg,
    borderRadius: 12,
    minWidth: 120,
  },
  spinner: {
    marginBottom: SPACING.sm,
  },
  message: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
