import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme, Button } from 'react-native-paper';
import { alarmService } from '../services/alarmService';
import { useApp } from '../contexts/AppContext';
import { t } from '../i18n';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/themes';

interface AlarmStatusBannerProps {
  onPress?: () => void;
  showDetails?: boolean;
}

interface AlarmStatus {
  isSupported: boolean;
  hasAudioPermission: boolean;
  isBackgroundEnabled: boolean;
  scheduledCount: number;
  message: string;
}

export function AlarmStatusBanner({ onPress, showDetails = false }: AlarmStatusBannerProps) {
  const theme = useTheme();
  const { state } = useApp();
  const [alarmStatus, setAlarmStatus] = useState<AlarmStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Lấy ngôn ngữ hiện tại
  const currentLanguage = state.settings?.language || 'vi';

  useEffect(() => {
    loadAlarmStatus();
  }, []);

  const loadAlarmStatus = async () => {
    try {
      setIsLoading(true);
      const status = await alarmService.getAlarmStatus();
      setAlarmStatus(status);
    } catch (error) {
      console.error('Error loading alarm status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAlarm = async () => {
    try {
      await alarmService.testAlarm();
    } catch (error) {
      console.error('Test alarm failed:', error);
    }
  };

  // Không hiển thị banner nếu đang loading hoặc không có dữ liệu
  if (isLoading || !alarmStatus) {
    return null;
  }

  const getStatusIcon = () => {
    if (alarmStatus.isSupported && alarmStatus.scheduledCount > 0) {
      return '🔔';
    } else if (alarmStatus.isSupported) {
      return '🔕';
    } else {
      return '⚠️';
    }
  };

  const getStatusColor = () => {
    if (alarmStatus.isSupported && alarmStatus.scheduledCount > 0) {
      return theme.colors.primary;
    } else if (alarmStatus.isSupported) {
      return theme.colors.secondary;
    } else {
      return theme.colors.error;
    }
  };

  const getStatusTitle = () => {
    if (alarmStatus.isSupported && alarmStatus.scheduledCount > 0) {
      return currentLanguage === 'vi' ? 'Hệ thống báo thức hoạt động' : 'Alarm System Active';
    } else if (alarmStatus.isSupported) {
      return currentLanguage === 'vi' ? 'Hệ thống báo thức sẵn sàng' : 'Alarm System Ready';
    } else {
      return currentLanguage === 'vi' ? 'Hệ thống báo thức lỗi' : 'Alarm System Error';
    }
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.icon}>{getStatusIcon()}</Text>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: getStatusColor() }]}>
              {getStatusTitle()}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {alarmStatus.message}
            </Text>
          </View>
        </View>
        <IconButton
          icon={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {isExpanded && (
        <Card.Content style={styles.expandedContent}>
          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              {currentLanguage === 'vi' ? 'Hỗ trợ báo thức:' : 'Alarm Support:'}
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {alarmStatus.isSupported 
                ? (currentLanguage === 'vi' ? 'Có' : 'Yes')
                : (currentLanguage === 'vi' ? 'Không' : 'No')
              }
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              {currentLanguage === 'vi' ? 'Quyền âm thanh:' : 'Audio Permission:'}
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {alarmStatus.hasAudioPermission 
                ? (currentLanguage === 'vi' ? 'Có' : 'Yes')
                : (currentLanguage === 'vi' ? 'Không' : 'No')
              }
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              {currentLanguage === 'vi' ? 'Chạy nền:' : 'Background:'}
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {alarmStatus.isBackgroundEnabled 
                ? (currentLanguage === 'vi' ? 'Hoạt động' : 'Active')
                : (currentLanguage === 'vi' ? 'Tắt' : 'Disabled')
              }
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              {currentLanguage === 'vi' ? 'Lịch nhắc nhở:' : 'Scheduled Alarms:'}
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {alarmStatus.scheduledCount}
            </Text>
          </View>

          {alarmStatus.scheduledCount === 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={[styles.recommendationsTitle, { color: theme.colors.onSurface }]}>
                {currentLanguage === 'vi' ? 'Khuyến nghị:' : 'Recommendations:'}
              </Text>
              <Text style={[styles.recommendation, { color: theme.colors.onSurfaceVariant }]}>
                • {currentLanguage === 'vi' 
                  ? 'Chọn ca làm việc để tự động lập lịch nhắc nhở'
                  : 'Select a work shift to automatically schedule reminders'
                }
              </Text>
              <Text style={[styles.recommendation, { color: theme.colors.onSurfaceVariant }]}>
                • {currentLanguage === 'vi' 
                  ? 'Tạo ghi chú với thời gian nhắc nhở'
                  : 'Create notes with reminder times'
                }
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={loadAlarmStatus}
              style={styles.actionButton}
              icon="refresh"
            >
              {currentLanguage === 'vi' ? 'Kiểm tra lại' : 'Refresh'}
            </Button>
            
            <Button
              mode="contained"
              onPress={handleTestAlarm}
              style={styles.actionButton}
              icon="bell-ring"
            >
              {currentLanguage === 'vi' ? 'Test Báo thức' : 'Test Alarm'}
            </Button>
          </View>
        </Card.Content>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  header: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '600',
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 2,
  },
  expandedContent: {
    paddingTop: 0,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    flex: 1,
  },
  value: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  recommendationsSection: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  recommendationsTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  recommendation: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },
});
