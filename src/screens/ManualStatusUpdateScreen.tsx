import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorklyBackground } from '../components/WorklyBackground';
import { ManualStatusUpdateModal } from '../components/ManualStatusUpdateModal';
import { useApp } from '../contexts/AppContext';
import { DailyWorkStatus, Shift } from '../types';
import { RootStackParamList } from '../types';
import { workManager } from '../services/workManager';
import { storageService } from '../services/storage';

type ManualStatusUpdateScreenRouteProp = RouteProp<RootStackParamList, 'ManualStatusUpdate'>;
type ManualStatusUpdateScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ManualStatusUpdate'>;

interface ManualStatusUpdateScreenProps {
  navigation: ManualStatusUpdateScreenNavigationProp;
  route: ManualStatusUpdateScreenRouteProp;
}

/**
 * 📝 ManualStatusUpdateScreen - Screen wrapper cho ManualStatusUpdateModal
 * 
 * Cho phép chỉnh sửa trạng thái ngày làm việc từ StatisticsScreen
 * Tái sử dụng logic từ ManualStatusUpdateModal
 */
export function ManualStatusUpdateScreen({ navigation, route }: ManualStatusUpdateScreenProps) {
  const { state, actions } = useApp();
  const { date, currentStatus } = route.params;

  const [modalVisible, setModalVisible] = useState(true);
  const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);

  useEffect(() => {
    // Load available shifts
    setAvailableShifts(state.shifts);
  }, [state.shifts]);

  // Handle modal dismiss
  const handleDismiss = () => {
    setModalVisible(false);
    navigation.goBack();
  };

  // Handle status update
  const handleStatusUpdate = async (data: {
    selectedShiftId: string;
    status: DailyWorkStatus['status'];
    checkInTime?: string;
    checkOutTime?: string;
  }) => {
    try {
      console.log('🔄 ManualStatusUpdateScreen: Updating status for', date, data);

      // Tạo manual status update
      const manualStatus: DailyWorkStatus = {
        status: data.status,
        appliedShiftIdForDay: data.selectedShiftId,
        isManualOverride: true,
        manualOverrideReason: `Chỉnh sửa thủ công từ thống kê`,
        standardHoursScheduled: currentStatus?.standardHoursScheduled || 0,
        otHoursScheduled: currentStatus?.otHoursScheduled || 0,
        sundayHoursScheduled: currentStatus?.sundayHoursScheduled || 0,
        nightHoursScheduled: currentStatus?.nightHoursScheduled || 0,
        totalHoursScheduled: currentStatus?.totalHoursScheduled || 0,
        lateMinutes: currentStatus?.lateMinutes || 0,
        earlyMinutes: currentStatus?.earlyMinutes || 0,
        checkInTime: data.checkInTime ? `${date}T${data.checkInTime}:00` : currentStatus?.checkInTime,
        checkOutTime: data.checkOutTime ? `${date}T${data.checkOutTime}:00` : currentStatus?.checkOutTime,
        vaoLogTime: data.checkInTime ? `${date}T${data.checkInTime}:00` : currentStatus?.vaoLogTime,
        raLogTime: data.checkOutTime ? `${date}T${data.checkOutTime}:00` : currentStatus?.raLogTime,
        workDuration: currentStatus?.workDuration || 0,
        breakDuration: currentStatus?.breakDuration || 0,
        actualWorkHours: currentStatus?.actualWorkHours || 0,
        notes: currentStatus?.notes || ''
      };

      // Nếu có thời gian mới, tính toán lại các giá trị
      if (data.checkInTime && data.checkOutTime) {
        const selectedShift = availableShifts.find(s => s.id === data.selectedShiftId);
        if (selectedShift) {
          const calculatedStatus = await workManager.calculateDailyWorkStatus(
            date,
            [{
              type: 'check_in',
              time: `${date}T${data.checkInTime}:00`
            }, {
              type: 'check_out', 
              time: `${date}T${data.checkOutTime}:00`
            }],
            selectedShift
          );

          // Merge calculated values với manual status
          Object.assign(manualStatus, {
            standardHoursScheduled: calculatedStatus.standardHoursScheduled,
            otHoursScheduled: calculatedStatus.otHoursScheduled,
            sundayHoursScheduled: calculatedStatus.sundayHoursScheduled,
            nightHoursScheduled: calculatedStatus.nightHoursScheduled,
            totalHoursScheduled: calculatedStatus.totalHoursScheduled,
            lateMinutes: calculatedStatus.lateMinutes,
            earlyMinutes: calculatedStatus.earlyMinutes,
            workDuration: calculatedStatus.workDuration,
            breakDuration: calculatedStatus.breakDuration,
            actualWorkHours: calculatedStatus.actualWorkHours
          });
        }
      }

      // Save to storage
      await storageService.setDailyWorkStatusNewForDate(date, manualStatus);

      // Refresh app state
      await Promise.all([
        actions.refreshWeeklyStatus(),
        actions.refreshButtonState(),
        actions.refreshTimeDisplayInfo()
      ]);

      Alert.alert(
        '✅ Thành công',
        `Đã cập nhật trạng thái ngày ${date}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('❌ ManualStatusUpdateScreen: Error updating status:', error);
      Alert.alert(
        '❌ Lỗi',
        'Không thể cập nhật trạng thái. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle time edit
  const handleTimeEdit = async (checkInTime: string, checkOutTime: string) => {
    try {
      console.log('🕐 ManualStatusUpdateScreen: Editing time for', date, { checkInTime, checkOutTime });

      // Update attendance logs
      const logs = [
        { type: 'check_in' as const, time: `${date}T${checkInTime}:00` },
        { type: 'check_out' as const, time: `${date}T${checkOutTime}:00` }
      ];

      await storageService.setAttendanceLogsForDate(date, logs);

      // Recalculate status if there's an active shift
      if (state.activeShift) {
        const newStatus = await workManager.calculateDailyWorkStatus(date, logs, state.activeShift);
        await storageService.setDailyWorkStatusNewForDate(date, newStatus);
      }

      // Refresh app state
      await Promise.all([
        actions.refreshWeeklyStatus(),
        actions.refreshButtonState(),
        actions.refreshTimeDisplayInfo()
      ]);

      Alert.alert('✅ Thành công', 'Đã cập nhật thời gian chấm công');

    } catch (error) {
      console.error('❌ ManualStatusUpdateScreen: Error editing time:', error);
      Alert.alert('❌ Lỗi', 'Không thể cập nhật thời gian. Vui lòng thử lại.');
    }
  };

  // Handle recalculate from logs
  const handleRecalculateFromLogs = async () => {
    try {
      console.log('🔄 ManualStatusUpdateScreen: Recalculating from logs for', date);

      const logs = await storageService.getAttendanceLogsForDate(date);
      
      if (logs.length === 0) {
        Alert.alert('⚠️ Thông báo', 'Không có dữ liệu chấm công để tính toán');
        return;
      }

      if (!state.activeShift) {
        Alert.alert('⚠️ Thông báo', 'Không có ca làm việc đang hoạt động');
        return;
      }

      const newStatus = await workManager.calculateDailyWorkStatus(date, logs, state.activeShift);
      await storageService.setDailyWorkStatusNewForDate(date, newStatus);

      // Refresh app state
      await Promise.all([
        actions.refreshWeeklyStatus(),
        actions.refreshButtonState(),
        actions.refreshTimeDisplayInfo()
      ]);

      Alert.alert('✅ Thành công', 'Đã tính toán lại trạng thái từ dữ liệu chấm công');

    } catch (error) {
      console.error('❌ ManualStatusUpdateScreen: Error recalculating:', error);
      Alert.alert('❌ Lỗi', 'Không thể tính toán lại. Vui lòng thử lại.');
    }
  };

  // Handle clear manual status
  const handleClearManualStatus = async () => {
    try {
      console.log('🗑️ ManualStatusUpdateScreen: Clearing manual status for', date);

      // Remove manual status
      const allStatus = await storageService.getDailyWorkStatusNew();
      delete allStatus[date];
      await storageService.setDailyWorkStatusNew(allStatus);

      // Refresh app state
      await Promise.all([
        actions.refreshWeeklyStatus(),
        actions.refreshButtonState(),
        actions.refreshTimeDisplayInfo()
      ]);

      Alert.alert('✅ Thành công', 'Đã xóa trạng thái thủ công');

    } catch (error) {
      console.error('❌ ManualStatusUpdateScreen: Error clearing status:', error);
      Alert.alert('❌ Lỗi', 'Không thể xóa trạng thái. Vui lòng thử lại.');
    }
  };

  return (
    <WorklyBackground variant="default">
      <SafeAreaView style={styles.container}>
        <ManualStatusUpdateModal
          visible={modalVisible}
          onDismiss={handleDismiss}
          date={date}
          currentStatus={currentStatus}
          shift={state.activeShift}
          availableShifts={availableShifts}
          onStatusUpdate={handleStatusUpdate}
          onTimeEdit={handleTimeEdit}
          onRecalculateFromLogs={handleRecalculateFromLogs}
          onClearManualStatus={handleClearManualStatus}
        />
      </SafeAreaView>
    </WorklyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
