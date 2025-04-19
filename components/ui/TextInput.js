import React from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { COLORS } from '../../styles/theme/colors';
import { FONT_SIZES } from '../../styles/theme/typography';
import { SPACING } from '../../styles/theme/spacing';

export const TextInput = ({ 
  style, 
  placeholderTextColor = COLORS.appDarkTextSecondary,
  ...props 
}) => {
  return (
    <RNTextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.appDarkLight,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
    borderRadius: 8,
    padding: SPACING.sm,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
});

export default TextInput;
