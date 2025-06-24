import React from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { commonStyles, ANIMATIONS } from '../constants/themes';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  animationType?: 'fadeIn' | 'slideUp' | 'scale';
  elevated?: boolean;
  onPress?: () => void;
  backgroundColor?: string; // Cho phép tùy chỉnh màu nền
}

/**
 * Component AnimatedCard với animation mượt mà khi mount
 * Tối ưu hóa performance với React.memo và useNativeDriver
 */
export const AnimatedCard = React.memo<AnimatedCardProps>(({
  children,
  style,
  delay = 0,
  animationType = 'fadeIn',
  elevated = false,
  onPress,
  backgroundColor
}) => {
  const theme = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: ANIMATIONS.timing.medium,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [animatedValue, delay]);

  // Tính toán style animation dựa trên type
  const getAnimatedStyle = (): ViewStyle => {
    switch (animationType) {
      case 'slideUp':
        return {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        };
      case 'scale':
        return {
          opacity: animatedValue,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        };
      default: // fadeIn
        return {
          opacity: animatedValue,
        };
    }
  };

  const cardStyle = elevated ? commonStyles.cardElevated : commonStyles.card;

  return (
    <Animated.View style={[getAnimatedStyle()]}>
      <Card
        style={[
          cardStyle,
          { backgroundColor: backgroundColor || theme.colors.surface },
          style
        ]}
        onPress={onPress}
      >
        {children}
      </Card>
    </Animated.View>
  );
});

AnimatedCard.displayName = 'AnimatedCard';
