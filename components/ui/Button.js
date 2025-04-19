import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../styles/theme/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../styles/theme/typography';
import { SPACING } from '../../styles/theme/spacing';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'default', 
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props 
}) => {
  // Determine button style based on variant and disabled state
  const getButtonStyle = () => {
    if (disabled) {
      return styles.buttonDisabled;
    }
    
    switch (variant) {
      case 'outline':
        return styles.buttonOutline;
      case 'destructive':
        return styles.buttonDestructive;
      default:
        return styles.buttonDefault;
    }
  };
  
  // Determine text style based on variant and disabled state
  const getTextStyle = () => {
    if (disabled) {
      return styles.textDisabled;
    }
    
    switch (variant) {
      case 'outline':
        return styles.textOutline;
      case 'destructive':
        return styles.textDestructive;
      default:
        return styles.textDefault;
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  buttonDefault: {
    backgroundColor: COLORS.appPurple,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  buttonDestructive: {
    backgroundColor: COLORS.appStatusError,
  },
  buttonDisabled: {
    backgroundColor: COLORS.appDarkBorder,
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
  },
  textDefault: {
    color: COLORS.white,
  },
  textOutline: {
    color: COLORS.appDarkTextSecondary,
  },
  textDestructive: {
    color: COLORS.white,
  },
  textDisabled: {
    color: COLORS.appDarkTextSecondary,
  },
});

export default Button;
