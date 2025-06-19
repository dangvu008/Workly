import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme, Divider } from 'react-native-paper';
import { useApp } from '../contexts/AppContext';
import { workManager } from '../services/workManager';
import { storageService } from '../services/storage';
import { format } from 'date-fns';

export function ButtonStateDebugFixed() {
  const theme = useTheme();
  const { state } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testButtonStateLogic = async () => {
    if (!state.activeShift) {
      Alert.alert('Lỗi', 'Không có ca làm việc đang hoạt động');
      return;
    }

    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // 1. Get current logs
      const logs = await storageService.getAttendanceLogsForDate(today);
      
      // 2. Get current button state
      const buttonState = await workManager.getCurrentButtonState(today);
      
      // 3. Calculate daily work status
      const dailyStatus = await workManager.calculateDailyWorkStatusNew(today, logs, state.activeShift);
      
      // 4. Get saved status from storage
      const savedStatus = await storageService.getDailyWorkStatusForDate(today);
      
      // 5. Get weekly status
      const weeklyStatus = state.weeklyStatus[today];

      setDebugInfo({
        date: today,
        logs: logs.map(log => ({
          type: log.type,
          time: log.time
        })),
        buttonState,
        calculatedStatus: dailyStatus,
        savedStatus: savedStatus ? {
          status: savedStatus.status,
          vaoLogTime: savedStatus.vaoLogTime,
          raLogTime: savedStatus.raLogTime,
          isManualOverride: savedStatus.isManualOverride
        } : null,
        weeklyStatus: weeklyStatus ? {
          status: weeklyStatus.status,
          vaoLogTime: weeklyStatus.vaoLogTime,
          raLogTime: weeklyStatus.raLogTime
        } : null,
        hasCompleteLog: logs.some(log => log.type === 'complete'),
        hasCheckOutLog: logs.some(log => log.type === 'check_out'),
        hasCheckInLog: logs.some(log => log.type === 'check_in'),
        hasGoWorkLog: logs.some(log => log.type === 'go_work'),
      });

      Alert.alert(
        '✅ Debug hoàn tất',
        `Button State: ${buttonState}\nCalculated Status: ${dailyStatus.status}\nSaved Status: ${savedStatus?.status || 'None'}`
      );

    } catch (error) {
      console.error('Test button state error:', error);
      Alert.alert('❌ Lỗi', `Không thể test: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const forceRecalculateStatus = async () => {
    if (!state.activeShift) {
      Alert.alert('Lỗi', 'Không có ca làm việc đang hoạt động');
      return;
    }

    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Force recalculate from logs
      await workManager.recalculateFromAttendanceLogs(today);
      
      // Trigger refresh in AppContext
      // This should be done through the context action
      Alert.alert('✅ Hoàn tất', 'Đã tính lại trạng thái từ logs');
      
      // Refresh debug info
      await testButtonStateLogic();

    } catch (error) {
      Alert.alert('❌ Lỗi', `Không thể tính lại: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addCompleteLog = async () => {
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();
      
      // Add complete log manually
      const logs = await storageService.getAttendanceLogsForDate(today);
      logs.push({ type: 'complete', time: now });
      await storageService.setAttendanceLogsForDate(today, logs);
      
      // Force recalculate
      await workManager.recalculateFromAttendanceLogs(today);
      
      Alert.alert('✅ Hoàn tất', 'Đã thêm complete log và tính lại trạng thái');
      
      // Refresh debug info
      await testButtonStateLogic();

    } catch (error) {
      Alert.alert('❌ Lỗi', `Không thể thêm complete log: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTodayLogs = async () => {
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Clear logs
      await storageService.clearAttendanceLogsForDate(today);
      
      // Clear status
      const allStatus = await storageService.getDailyWorkStatus();
      delete allStatus[today];
      await storageService.setDailyWorkStatus(allStatus);
      
      Alert.alert('✅ Hoàn tất', 'Đã xóa tất cả logs và status hôm nay');
      
      setDebugInfo(null);

    } catch (error) {
      Alert.alert('❌ Lỗi', `Không thể xóa: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            🔘 Button State Debug (Fixed)
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Ca hiện tại: {state.activeShift?.name || 'Không có'}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={testButtonStateLogic}
              loading={isLoading}
              style={styles.button}
            >
              🧪 Test Button State Logic
            </Button>

            <Button
              mode="outlined"
              onPress={forceRecalculateStatus}
              loading={isLoading}
              style={styles.button}
            >
              🔄 Force Recalculate Status
            </Button>

            <Button
              mode="outlined"
              onPress={addCompleteLog}
              loading={isLoading}
              style={styles.button}
            >
              ✅ Add Complete Log
            </Button>

            <Button
              mode="outlined"
              onPress={clearTodayLogs}
              loading={isLoading}
              style={styles.button}
            >
              🗑️ Clear Today's Logs
            </Button>
          </View>

          {debugInfo && (
            <>
              <Divider style={styles.divider} />
              <Text style={[styles.debugTitle, { color: theme.colors.primary }]}>
                📊 Debug Information ({debugInfo.date})
              </Text>
              
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                Button State: {debugInfo.buttonState}
              </Text>
              
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                Calculated Status: {debugInfo.calculatedStatus.status}
              </Text>
              
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                Saved Status: {debugInfo.savedStatus?.status || 'None'}
              </Text>
              
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                Weekly Status: {debugInfo.weeklyStatus?.status || 'None'}
              </Text>

              <Text style={[styles.debugSubtitle, { color: theme.colors.primary }]}>
                Logs Analysis:
              </Text>
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                • Go Work: {debugInfo.hasGoWorkLog ? '✅' : '❌'}
              </Text>
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                • Check In: {debugInfo.hasCheckInLog ? '✅' : '❌'}
              </Text>
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                • Check Out: {debugInfo.hasCheckOutLog ? '✅' : '❌'}
              </Text>
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                • Complete: {debugInfo.hasCompleteLog ? '✅' : '❌'}
              </Text>

              {debugInfo.logs.length > 0 && (
                <>
                  <Text style={[styles.debugSubtitle, { color: theme.colors.primary }]}>
                    Logs ({debugInfo.logs.length}):
                  </Text>
                  {debugInfo.logs.map((log: any, index: number) => (
                    <Text key={index} style={[styles.debugText, { color: theme.colors.onSurface }]}>
                      • {log.type} at {new Date(log.time).toLocaleTimeString()}
                    </Text>
                  ))}
                </>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
  divider: {
    marginVertical: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
