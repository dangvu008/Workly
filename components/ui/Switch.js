import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../../styles/theme/colors';

export const Switch = ({ 
  value, 
  onValueChange, 
  disabled = false,
  style
}) => {
  // Animation value for thumb position
  const thumbPosition = new Animated.Value(value ? 1 : 0);
  
  // Handle switch toggle
  const toggleSwitch = () => {
    if (disabled) return;
    
    // Animate thumb position
    Animated.spring(thumbPosition, {
      toValue: value ? 0 : 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    // Call onValueChange callback
    onValueChange(!value);
  };
  
  // Interpolate thumb position
  const thumbTranslateX = thumbPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });
  
  // Determine colors based on state
  const trackColor = value ? COLORS.appPurple : COLORS.appDarkBorder;
  const thumbColor = COLORS.white;
  const opacity = disabled ? 0.5 : 1;
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleSwitch}
      disabled={disabled}
      style={[styles.container, style, { opacity }]}
    >
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View 
          style={[
            styles.thumb, 
            { 
              backgroundColor: thumbColor,
              transform: [{ translateX: thumbTranslateX }],
            }
          ]} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default Switch;
