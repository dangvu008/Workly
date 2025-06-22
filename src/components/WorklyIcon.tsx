/**
 * ✅ WorklyIcon - Component icon chính thống cho toàn bộ ứng dụng Workly
 * Sử dụng @expo/vector-icons để đảm bảo tương thích và hiệu suất tốt
 * Thay thế tất cả các icon component khác để tránh conflict
 */

import React from 'react';
import { TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Type cho icon names từ MaterialCommunityIcons
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface WorklyIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
  testID?: string;
}

interface WorklyIconButtonProps extends WorklyIconProps {
  onPress?: () => void;
  disabled?: boolean;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
}

/**
 * ✅ WorklyIcon - Icon component cơ bản với fallback
 * Render trực tiếp MaterialCommunityIcons, có fallback nếu icon không load
 */
export function WorklyIcon({
  name,
  size = 24,
  color,
  style,
  testID,
}: WorklyIconProps) {
  const theme = useTheme();
  const iconColor = color || theme.colors.onSurface;

  try {
    return (
      <MaterialCommunityIcons
        name={name}
        size={size}
        color={iconColor}
        style={style}
        testID={testID}
        suppressHighlighting={true}
      />
    );
  } catch (error) {
    // Fallback nếu icon không load được
    console.warn(`⚠️ WorklyIcon: Không thể load icon "${name}"`);
    return (
      <MaterialCommunityIcons
        name="help-circle-outline"
        size={size}
        color={iconColor}
        style={style}
        testID={testID}
      />
    );
  }
}

/**
 * ✅ WorklyIconButton - Icon button với TouchableOpacity
 * Đảm bảo tương tác tốt và accessible
 */
export function WorklyIconButton({
  name,
  size = 24,
  color,
  style,
  testID,
  onPress,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}: WorklyIconButtonProps) {
  const theme = useTheme();
  const iconColor = color || (disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface);

  if (!onPress || disabled) {
    return (
      <WorklyIcon
        name={name}
        size={size}
        color={iconColor}
        style={[style, { opacity: disabled ? 0.5 : 1 }]}
        testID={testID}
      />
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ padding: 4 }, style]}
      testID={testID}
      disabled={disabled}
      hitSlop={hitSlop}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={name}
        size={size}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}

/**
 * ✅ TabIcon - Icon cho tab navigation
 * Tối ưu cho bottom tab navigation
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
  iconName: IconName;
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
 * ✅ StatusIcon - Icon cho hiển thị trạng thái
 * Sử dụng trong WeeklyStatusGrid và các component status
 */
export function StatusIcon({
  icon,
  color,
  size = 20,
  style,
}: {
  icon: IconName;
  color: string;
  size?: number;
  style?: ViewStyle | TextStyle;
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

/**
 * ✅ FastIcon - Icon siêu nhanh cho critical UI elements
 * Memoized để tối ưu performance
 */
export const FastIcon = React.memo<{
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
}>(({ name, size = 24, color, style }) => (
  <MaterialCommunityIcons
    name={name}
    size={size}
    color={color}
    style={style}
  />
));

FastIcon.displayName = 'FastIcon';

// Export default as WorklyIcon
export default WorklyIcon;

// Export các icon names thường dùng để dễ sử dụng
export const COMMON_ICONS = {
  // Navigation
  home: 'home' as IconName,
  homeOutline: 'home-outline' as IconName,
  clock: 'clock' as IconName,
  clockOutline: 'clock-outline' as IconName,
  note: 'note-text' as IconName,
  noteOutline: 'note-text-outline' as IconName,
  chart: 'chart-line' as IconName,
  settings: 'cog' as IconName,
  settingsOutline: 'cog-outline' as IconName,
  
  // Actions
  add: 'plus' as IconName,
  edit: 'pencil' as IconName,
  delete: 'delete' as IconName,
  save: 'content-save' as IconName,
  cancel: 'close' as IconName,
  back: 'arrow-left' as IconName,
  forward: 'arrow-right' as IconName,
  
  // Status
  checkCircle: 'check-circle' as IconName,
  alert: 'alert' as IconName,
  closeCircle: 'close-circle' as IconName,
  
  // Work Status
  work: 'run' as IconName,
  checkIn: 'login' as IconName,
  checkOut: 'logout' as IconName,
  complete: 'target' as IconName,
  present: 'account-check' as IconName,
  absent: 'sleep' as IconName,
  holiday: 'flag' as IconName,
  vacation: 'beach' as IconName,
  sick: 'hospital-box' as IconName,
  business: 'airplane' as IconName,
  
  // UI
  chevronDown: 'chevron-down' as IconName,
  chevronRight: 'chevron-right' as IconName,
  eye: 'eye' as IconName,
  eyeOff: 'eye-off' as IconName,
  star: 'star' as IconName,
  starOutline: 'star-outline' as IconName,
} as const;
