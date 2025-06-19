import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme, Button } from 'react-native-paper';
import { notificationScheduler } from '../services/notificationScheduler';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/themes';

interface NotificationStatusBannerProps {
  onPress?: () => void;
  showDetails?: boolean;
}

interface DetailedStatus {
  status: {
    isSupported: boolean;
    isExpoGo: boolean;
    hasPermission: boolean;
    platform: string;
    message: string;
    canSchedule: boolean;
  };
  scheduledCount: number;
  environment: string;
  recommendations: string[];
}

export function NotificationStatusBanner({ onPress, showDetails = false }: NotificationStatusBannerProps) {
  const theme = useTheme();
  const [detailedStatus, setDetailedStatus] = useState<DetailedStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = async () => {
    try {
      setIsLoading(true);

      // Get status from notificationScheduler
      const status = notificationScheduler.getNotificationStatus();
      const scheduledNotifications = await notificationScheduler.getAllScheduledNotifications();

      // Create detailed status compatible with old interface
      const detailedStatus = {
        status: status || {
          isSupported: false,
          isExpoGo: false,
          hasPermission: false,
          platform: 'unknown',
          message: 'Chưa khởi tạo',
          canSchedule: false
        },
        scheduledCount: scheduledNotifications.length,
        environment: status?.isExpoGo ? 'Expo Go' : 'Development/Production Build',
        recommendations: status?.isExpoGo
          ? ['Sử dụng development build để có đầy đủ tính năng notifications']
          : !status?.hasPermission
            ? ['Cấp quyền notifications trong Settings của thiết bị']
            : []
      };

      setDetailedStatus(detailedStatus);
    } catch (error) {
      console.error('Error loading notification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Không hiển thị banner nếu notifications hoạt động bình thường
  if (isLoading || !detailedStatus || detailedStatus.status.isSupported) {
    return null;
  }

  const getStatusIcon = () => {
    if (detailedStatus.status.isExpoGo) {
      return '📱';
    } else if (!detailedStatus.status.hasPermission) {
      return '🔔';
    } else {
      return '⚠️';
    }
  };

  const getStatusColor = () => {
    if (detailedStatus.status.isExpoGo) {
      return theme.colors.primary;
    } else if (!detailedStatus.status.hasPermission) {
      return theme.colors.secondary;
    } else {
      return theme.colors.error;
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationScheduler.testNotification();
    } catch (error) {
      console.error('Test notification failed:', error);
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
              Trạng thái Notifications
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {detailedStatus.status.message}
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
              Môi trường:
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {detailedStatus.environment}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Platform:
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {detailedStatus.status.platform}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Notifications đã lập lịch:
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {detailedStatus.scheduledCount}
            </Text>
          </View>

          {detailedStatus.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={[styles.recommendationsTitle, { color: theme.colors.onSurface }]}>
                Khuyến nghị:
              </Text>
              {detailedStatus.recommendations.map((recommendation, index) => (
                <Text
                  key={index}
                  style={[styles.recommendation, { color: theme.colors.onSurfaceVariant }]}
                >
                  • {recommendation}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={loadNotificationStatus}
              style={styles.actionButton}
              icon="refresh"
            >
              Kiểm tra lại
            </Button>
            
            {detailedStatus.status.canSchedule && (
              <Button
                mode="contained"
                onPress={handleTestNotification}
                style={styles.actionButton}
                icon="bell-ring"
              >
                Test Notification
              </Button>
            )}
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
