import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../styles/theme/typography';
import { SPACING } from '../styles/theme/spacing';
import { format, parseISO } from 'date-fns';

// Map log type to icon and color
const getLogTypeInfo = (type) => {
  switch (type) {
    case 'go_work':
      return {
        icon: 'directions-walk',
        color: COLORS.appYellow,
        label: 'Đi làm',
      };
    case 'check_in':
      return {
        icon: 'login',
        color: COLORS.appBlue,
        label: 'Chấm công vào',
      };
    case 'punch':
      return {
        icon: 'touch-app',
        color: COLORS.appOrange,
        label: 'Ký công',
      };
    case 'check_out':
      return {
        icon: 'logout',
        color: COLORS.appRed,
        label: 'Chấm công ra',
      };
    case 'complete':
      return {
        icon: 'check-circle',
        color: COLORS.appGreen,
        label: 'Hoàn tất',
      };
    default:
      return {
        icon: 'event',
        color: COLORS.appDarkTextSecondary,
        label: 'Sự kiện',
      };
  }
};

const AttendanceLogList = ({ logs = [] }) => {
  if (!logs || logs.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {logs.map((log, index) => {
        const { icon, color, label } = getLogTypeInfo(log.type);
        const time = format(parseISO(log.time), 'HH:mm:ss');
        
        return (
          <View 
            key={index} 
            style={[
              styles.logItem,
              { borderLeftColor: color }
            ]}
          >
            <MaterialIcons name={icon} size={20} color={color} style={styles.icon} />
            <View style={styles.logContent}>
              <Text style={styles.logLabel}>{label}</Text>
              <Text style={styles.logTime}>{time}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.appPurple,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  logContent: {
    flex: 1,
  },
  logLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  logTime: {
    color: COLORS.appDarkTextSecondary,
    fontSize: FONT_SIZES.xs,
  },
});

export default AttendanceLogList;
