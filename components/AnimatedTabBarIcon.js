import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme/colors';
import { FONT_SIZES } from '../styles/theme/typography';

const AnimatedTabBarIcon = ({ label, iconName, isFocused, onPress, accessibilityState }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;
  
  // Run animation when tab focus changes
  useEffect(() => {
    if (isFocused) {
      // Scale up and increase opacity when focused
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Scale down and decrease opacity when not focused
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused, scaleAnim, opacityAnim]);

  // Icon color based on focus state
  const iconColor = isFocused ? COLORS.appPurple : COLORS.appDarkTextSecondary;
  const textColor = isFocused ? COLORS.appPurple : COLORS.appDarkTextSecondary;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            backgroundColor: isFocused ? 'rgba(147, 51, 234, 0.1)' : 'transparent',
          },
        ]}
      >
        <MaterialIcons name={iconName} size={24} color={iconColor} />
      </Animated.View>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
    fontWeight: '500',
  },
});

export default AnimatedTabBarIcon;
