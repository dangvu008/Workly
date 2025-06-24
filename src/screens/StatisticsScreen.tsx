import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
  Text,
  Card,
  IconButton,
  useTheme,
  DataTable,
  Button,
  Menu
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorklyBackground } from '../components/WorklyBackground';
import { StatusIcon } from '../components/WorklyIcon';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { WEEKLY_STATUS } from '../constants';
import { t } from '../i18n';
import { getDayNamesMapping } from '../services/sampleShifts';
import { TabParamList, RootStackParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type StatisticsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'StatisticsTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface StatisticsScreenProps {
  navigation: StatisticsScreenNavigationProp;
}

type TimePeriod = 'week' | 'month' | 'custom';

export function StatisticsScreen({ navigation }: StatisticsScreenProps) {
  const theme = useTheme();
  const { state } = useApp();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  const getDateRange = () => {
    const now = new Date();

    switch (timePeriod) {
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
          label: t(currentLanguage, 'statistics.thisWeek')
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: t(currentLanguage, 'statistics.thisMonth')
        };
      default:
        return {
          start: subWeeks(now, 4),
          end: now,
          label: t(currentLanguage, 'statistics.last4Weeks')
        };
    }
  };

  // ✅ Hàm lấy tên thứ viết tắt theo ngôn ngữ hiện tại sử dụng sampleShifts service
  const getDayAbbreviation = (date: Date): string => {
    const dayNumber = date.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
    const currentLanguage = state.settings?.language || 'vi';
    const dayNames = getDayNamesMapping(currentLanguage);
    return dayNames[dayNumber as keyof typeof dayNames];
  };

  const getFilteredData = () => {
    const { start, end } = getDateRange();
    const filtered = [];

    const current = new Date(start);
    while (current <= end) {
      const dateString = format(current, 'yyyy-MM-dd');
      const status = state.weeklyStatus[dateString];

      if (status) {
        filtered.push({
          date: dateString,
          dayName: getDayAbbreviation(current), // Sử dụng viết tắt theo ngôn ngữ (T2, T3... hoặc Mon, Tue...)
          ...status
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return filtered;
  };

  const calculateSummary = () => {
    const data = getFilteredData();

    const summary = {
      totalDays: data.length,
      completedDays: data.filter(d => d.status === 'completed').length,
      lateDays: data.filter(d => d.status === 'late').length,
      earlyDays: data.filter(d => d.status === 'early').length,
      absentDays: data.filter(d => d.status === 'absent').length,
      totalStandardHours: data.reduce((sum, d) => sum + d.standardHoursScheduled, 0),
      totalOtHours: data.reduce((sum, d) => sum + d.otHoursScheduled, 0),
      totalSundayHours: data.reduce((sum, d) => sum + d.sundayHoursScheduled, 0),
      totalNightHours: data.reduce((sum, d) => sum + d.nightHoursScheduled, 0),
      totalHours: data.reduce((sum, d) => sum + d.totalHoursScheduled, 0),
      totalLateMinutes: data.reduce((sum, d) => sum + d.lateMinutes, 0),
      totalEarlyMinutes: data.reduce((sum, d) => sum + d.earlyMinutes, 0),
    };

    return summary;
  };

  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Hàm lấy tên icon từ WEEKLY_STATUS để hiển thị với MaterialCommunityIcons
  const getStatusIcon = (status: string): string => {
    return WEEKLY_STATUS[status as keyof typeof WEEKLY_STATUS]?.icon || 'help-circle';
  };

  // Hàm lấy màu icon từ WEEKLY_STATUS
  const getStatusColor = (status: string): string => {
    return WEEKLY_STATUS[status as keyof typeof WEEKLY_STATUS]?.color || '#757575';
  };

  // Hàm lấy text trạng thái theo ngôn ngữ
  const getStatusText = (status: string): string => {
    const statusConfig = WEEKLY_STATUS[status as keyof typeof WEEKLY_STATUS];
    if (!statusConfig) return status;

    if (typeof statusConfig.text === 'string') {
      return statusConfig.text;
    } else {
      return statusConfig.text[currentLanguage as keyof typeof statusConfig.text] || statusConfig.text.vi;
    }
  };

  const data = getFilteredData();
  const summary = calculateSummary();
  const { label } = getDateRange();

  // 🔧 Handle row click để edit work status
  const handleRowPress = (item: any) => {
    const dateStr = format(new Date(item.date), 'dd/MM/yyyy');
    const confirmMessage = t(currentLanguage, 'statistics.editStatusConfirm')
      .replace('{date}', dateStr)
      .replace('{day}', item.dayName);

    Alert.alert(
      `✏️ ${t(currentLanguage, 'statistics.editStatus')}`,
      confirmMessage,
      [
        { text: t(currentLanguage, 'common.cancel'), style: 'cancel' },
        {
          text: t(currentLanguage, 'statistics.editStatus'),
          onPress: () => {
            // Navigate to ManualStatusUpdateScreen
            navigation.navigate('ManualStatusUpdate', {
              date: item.date,
              currentStatus: {
                status: item.status,
                standardHoursScheduled: item.standardHoursScheduled,
                otHoursScheduled: item.otHoursScheduled,
                sundayHoursScheduled: item.sundayHoursScheduled,
                nightHoursScheduled: item.nightHoursScheduled,
                totalHoursScheduled: item.totalHoursScheduled,
                lateMinutes: item.lateMinutes,
                earlyMinutes: item.earlyMinutes,
                checkInTime: item.checkInTime,
                checkOutTime: item.checkOutTime,
                workDuration: item.workDuration,
                breakDuration: item.breakDuration,
                actualWorkHours: item.actualWorkHours,
                notes: item.notes,
                appliedShiftIdForDay: item.appliedShiftIdForDay,
                isManualOverride: item.isManualOverride,
                manualOverrideReason: item.manualOverrideReason,
                vaoLogTime: item.vaoLogTime,
                raLogTime: item.raLogTime
              }
            });
          }
        }
      ]
    );
  };

  return (
    <WorklyBackground variant="default">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <View style={{ width: 48 }} />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {t(currentLanguage, 'statistics.title')}
        </Text>
        <Menu
          visible={periodMenuVisible}
          onDismiss={() => setPeriodMenuVisible(false)}
          anchor={
            <IconButton
              icon="calendar"
              size={24}
              onPress={() => setPeriodMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setTimePeriod('week');
              setPeriodMenuVisible(false);
            }}
            title={t(currentLanguage, 'statistics.thisWeek')}
          />
          <Menu.Item
            onPress={() => {
              setTimePeriod('month');
              setPeriodMenuVisible(false);
            }}
            title={t(currentLanguage, 'statistics.thisMonth')}
          />
          <Menu.Item
            onPress={() => {
              setTimePeriod('custom');
              setPeriodMenuVisible(false);
            }}
            title={t(currentLanguage, 'statistics.last4Weeks')}
          />
        </Menu>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Period Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Text style={[styles.periodTitle, { color: theme.colors.onPrimaryContainer }]}>
              {label}
            </Text>
            <Text style={[styles.periodSubtitle, { color: theme.colors.onPrimaryContainer }]}>
              {format(getDateRange().start, 'dd/MM/yyyy')} - {format(getDateRange().end, 'dd/MM/yyyy')}
            </Text>
          </Card.Content>
        </Card>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>
                {summary.totalDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'statistics.totalDays')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: theme.colors.secondary }]}>
                {summary.completedDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'statistics.completed')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: theme.colors.tertiary }]}>
                {formatHours(summary.totalHours)}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'statistics.totalHours')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: theme.colors.error }]}>
                {summary.lateDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'statistics.late')}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Hours Breakdown */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'statistics.dailyDetails')} - Phân loại giờ
            </Text>

            <View style={styles.hoursBreakdown}>
              <View style={styles.hoursItem}>
                <Text style={[styles.hoursLabel, { color: theme.colors.onSurface }]}>
                  {t(currentLanguage, 'statistics.standardHours')}:
                </Text>
                <Text style={[styles.hoursValue, { color: theme.colors.primary }]}>
                  {formatHours(summary.totalStandardHours)}
                </Text>
              </View>

              <View style={styles.hoursItem}>
                <Text style={[styles.hoursLabel, { color: theme.colors.onSurface }]}>
                  {t(currentLanguage, 'statistics.overtimeHours')}:
                </Text>
                <Text style={[styles.hoursValue, { color: theme.colors.secondary }]}>
                  {formatHours(summary.totalOtHours)}
                </Text>
              </View>

              <View style={styles.hoursItem}>
                <Text style={[styles.hoursLabel, { color: theme.colors.onSurface }]}>
                  {t(currentLanguage, 'statistics.sundayHours')}:
                </Text>
                <Text style={[styles.hoursValue, { color: theme.colors.tertiary }]}>
                  {formatHours(summary.totalSundayHours)}
                </Text>
              </View>

              <View style={styles.hoursItem}>
                <Text style={[styles.hoursLabel, { color: theme.colors.onSurface }]}>
                  {t(currentLanguage, 'statistics.nightHours')}:
                </Text>
                <Text style={[styles.hoursValue, { color: theme.colors.outline }]}>
                  {formatHours(summary.totalNightHours)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Detailed Table */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'statistics.dailyDetails')}
              </Text>
              <Text style={[styles.sectionHint, { color: theme.colors.onSurfaceVariant }]}>
                💡 {t(currentLanguage, 'statistics.editStatus')}
              </Text>
            </View>

            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={styles.dateColumn}>{t(currentLanguage, 'statistics.date')}</DataTable.Title>
                <DataTable.Title style={styles.dayColumn}>{t(currentLanguage, 'statistics.day')}</DataTable.Title>
                <DataTable.Title numeric style={styles.hoursColumn}>{t(currentLanguage, 'statistics.standardHours')}</DataTable.Title>
                <DataTable.Title numeric style={styles.otColumn}>{t(currentLanguage, 'statistics.overtimeHours')}</DataTable.Title>
                <DataTable.Title style={styles.statusColumn}>{t(currentLanguage, 'statistics.status')}</DataTable.Title>
              </DataTable.Header>

              {data.slice(0, 10).map((item) => (
                <TouchableOpacity
                  key={item.date}
                  onPress={() => handleRowPress(item)}
                  style={styles.clickableRow}
                  activeOpacity={0.7}
                >
                  <DataTable.Row style={styles.dataRow}>
                    <DataTable.Cell style={styles.dateColumn}>
                      {format(new Date(item.date), 'dd/MM')}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.dayColumn}>
                      {item.dayName}
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.hoursColumn}>
                      {item.standardHoursScheduled.toFixed(1)}
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.otColumn}>
                      {item.otHoursScheduled.toFixed(1)}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.statusColumn}>
                      <View style={styles.statusCellContent}>
                        <StatusIcon
                          icon={getStatusIcon(item.status) as any}
                          color={getStatusColor(item.status)}
                          size={20}
                        />
                        <IconButton
                          icon="pencil"
                          size={16}
                          iconColor={theme.colors.outline}
                          style={styles.editIcon}
                          onPress={() => handleRowPress(item)}
                        />
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                </TouchableOpacity>
              ))}
            </DataTable>

            {data.length > 10 && (
              <Text style={[styles.moreDataText, { color: theme.colors.onSurfaceVariant }]}>
                Và {data.length - 10} ngày khác...
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Export Button */}
        <Button
          mode="outlined"
          onPress={() => {
            // TODO: Implement export functionality
            Alert.alert('Thông báo', 'Tính năng xuất báo cáo sẽ được triển khai trong phiên bản tiếp theo.');
          }}
          style={styles.exportButton}
          icon="download"
        >
          {t(currentLanguage, 'statistics.exportReport')}
        </Button>
      </ScrollView>
      </SafeAreaView>
    </WorklyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  periodSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  summaryCard: {
    width: '48%',
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  hoursBreakdown: {
    gap: 12,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 14,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  moreDataText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  exportButton: {
    marginVertical: 16,
  },
  // Styles cho các cột trong DataTable để cải thiện layout
  dateColumn: {
    flex: 1.2, // Cột ngày chiếm 1.2 phần
  },
  dayColumn: {
    flex: 0.8, // Cột thứ chiếm 0.8 phần (nhỏ hơn vì chỉ hiển thị T2, T3...)
  },
  hoursColumn: {
    flex: 1, // Cột giờ HC chiếm 1 phần
  },
  otColumn: {
    flex: 1, // Cột giờ OT chiếm 1 phần
    paddingLeft: 8, // Thêm khoảng cách với cột trước đó
  },
  statusColumn: {
    flex: 0.8, // Tăng kích thước để chứa cả status icon và edit icon
    alignItems: 'center', // Căn giữa icon
    paddingLeft: 8, // Thêm khoảng cách với cột Giờ OT
  },
  statusCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  editIcon: {
    margin: 0,
    padding: 0,
  },
  clickableRow: {
    borderRadius: 8,
    marginVertical: 1,
  },
  dataRow: {
    backgroundColor: 'transparent',
  },
});
