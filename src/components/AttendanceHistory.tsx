import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Divider } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { FastIcon } from './WorklyIcon';
import { useApp } from '../contexts/AppContext';
import { AttendanceLog } from '../types';
import { BUTTON_STATES } from '../constants';
import { storageService } from '../services/storage';
import { t } from '../i18n';

interface AttendanceHistoryProps {
  visible?: boolean;
}

export function AttendanceHistory({ visible = true }: AttendanceHistoryProps) {
  const theme = useTheme();
  const { state } = useApp();
  const [todayLogs, setTodayLogs] = useState<AttendanceLog[]>([]);

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  useEffect(() => {
    loadTodayLogs();
  }, [state.currentButtonState]); // Refresh when button state changes

  const loadTodayLogs = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logs = await storageService.getAttendanceLogsForDate(today);
      setTodayLogs(logs);
    } catch (error) {
      console.error('Error loading today logs:', error);
    }
  };

  const getActionText = (type: AttendanceLog['type']): string => {
    const actionMap = {
      go_work: t(currentLanguage, 'attendanceHistory.actions.goWork'),
      check_in: t(currentLanguage, 'attendanceHistory.actions.checkIn'),
      punch: t(currentLanguage, 'attendanceHistory.actions.punch'),
      check_out: t(currentLanguage, 'attendanceHistory.actions.checkOut'),
      complete: t(currentLanguage, 'attendanceHistory.actions.complete'),
    };
    return actionMap[type] || type;
  };

  const getActionIcon = (type: AttendanceLog['type']): string => {
    const iconMap = {
      go_work: 'walk',
      check_in: 'login',
      punch: 'pencil',
      check_out: 'logout',
      complete: 'check-circle',
    };
    return iconMap[type] || 'pencil';
  };

  const getActionColor = (type: AttendanceLog['type']): string => {
    const colorMap = {
      go_work: '#4CAF50',
      check_in: '#2196F3',
      punch: '#9C27B0',
      check_out: '#FF5722',
      complete: '#4CAF50',
    };
    return colorMap[type] || theme.colors.primary;
  };

  const formatTime = (timeString: string): string => {
    try {
      return format(parseISO(timeString), 'HH:mm', { locale: currentLanguage === 'vi' ? vi : enUS });
    } catch {
      return '--:--';
    }
  };

  // Don't render if no logs or not visible
  if (!visible || todayLogs.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        {t(currentLanguage, 'attendanceHistory.title')}
      </Text>

      <ScrollView
        style={styles.logsList}
        contentContainerStyle={styles.logsContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
      >
        {todayLogs.map((log, index) => (
          <View key={`${log.type}-${log.time}-${index}`}>
            <View style={styles.logItem}>
              <View style={styles.logIcon}>
                <FastIcon
                  name={getActionIcon(log.type) as any}
                  size={20}
                  color={getActionColor(log.type)}
                />
              </View>

              <View style={styles.logContent}>
                <Text style={[
                  styles.actionText,
                  { color: theme.colors.onSurface }
                ]}>
                  {getActionText(log.type)}
                </Text>
                <Text style={[
                  styles.timeText,
                  { color: theme.colors.onSurfaceVariant }
                ]}>
                  {formatTime(log.time)}
                </Text>
              </View>

              <View style={styles.statusIndicator}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getActionColor(log.type) }
                ]} />
              </View>
            </View>

            {index < todayLogs.length - 1 && (
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            )}
          </View>
        ))}
      </ScrollView>

      <Text style={[styles.summary, { color: theme.colors.onSurfaceVariant }]}>
        {t(currentLanguage, 'attendanceHistory.totalActions').replace('{count}', todayLogs.length.toString())}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16, // Add padding since we removed Card.Content
    borderRadius: 12,
    overflow: 'hidden', // Ensure content doesn't overflow
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  logsList: {
    maxHeight: 180, // Slightly reduced height to prevent overlap
    minHeight: 60, // Minimum height for better layout
  },
  logsContent: {
    flexGrow: 1,
    paddingBottom: 4, // Small padding at bottom
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  logContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
  },
  statusIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    marginVertical: 4,
    marginLeft: 52, // Align with content, skip icon area
  },
  summary: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4, // Add bottom margin
    fontStyle: 'italic',
    paddingHorizontal: 8, // Add horizontal padding
  },
});
