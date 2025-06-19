/**
 * ✅ SimpleIcon - Component icon đơn giản và ổn định
 * Sử dụng @expo/vector-icons để đảm bảo tương thích và hiệu suất tốt
 * Loại bỏ react-native-vector-icons để tránh conflict
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

interface SimpleIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color?: string;
  style?: any;
  testID?: string;
}

/**
 * ✅ SimpleIcon - Icon component đơn giản, ổn định
 * Không có logic phức tạp, chỉ render MaterialCommunityIcons trực tiếp
 */
export function SimpleIcon({
  name,
  size = 24,
  color,
  style,
  testID,
}: SimpleIconProps) {
  const theme = useTheme();
  const iconColor = color || theme.colors.onSurface;

  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={iconColor}
      style={style}
      testID={testID}
    />
  );
}

/**
 * ✅ SimpleIconButton - Button với SimpleIcon
 * Sử dụng TouchableOpacity để đảm bảo tương tác tốt hơn
 */
export function SimpleIconButton({
  icon,
  size = 24,
  color,
  onPress,
  disabled = false,
  style,
  testID,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  testID?: string;
}) {
  const theme = useTheme();
  const iconColor = color || (disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface);

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[{ padding: 4 }, style]}
        testID={testID}
        disabled={disabled}
      >
        <MaterialCommunityIcons
          name={icon}
          size={size}
          color={iconColor}
        />
      </TouchableOpacity>
    );
  }

  return (
    <MaterialCommunityIcons
      name={icon}
      size={size}
      color={iconColor}
      style={[style, { opacity: disabled ? 0.5 : 1 }]}
      testID={testID}
    />
  );
}

/**
 * ✅ TabIcon - Icon cho tab navigation
 */
export function TabIcon({
  focused,
  color,
  size,
  iconName,
}: {
  focused: boolean;
  color: string;
  size: number;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <MaterialCommunityIcons
      name={iconName}
      size={size}
      color={color}
      style={{
        opacity: focused ? 1 : 0.7,
      }}
    />
  );
}

/**
 * ✅ StatusIcon - Icon cho status display
 */
export function StatusIcon({
  icon,
  color,
  size = 20,
  style,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size?: number;
  style?: any;
}) {
  return (
    <MaterialCommunityIcons
      name={icon}
      size={size}
      color={color}
      style={style}
    />
  );
}

// Export default as SimpleIcon
export default SimpleIcon;
