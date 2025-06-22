import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { alarmService } from '../services/alarmService';
import { reminderSyncService } from '../services/reminderSync';

interface AlarmDebugPanelProps {
  onClose: () => void;
}

export const AlarmDebugPanel: React.FC<AlarmDebugPanelProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleForceCleanup = async () => {
    Alert.alert(
      '🧹 Force Cleanup Alarm',
      'Bạn có chắc muốn xóa tất cả alarm cũ và tạo lại từ đầu?\n\nĐiều này sẽ giải quyết vấn đề thông báo không đúng thời gian.',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xóa và tạo lại',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await alarmService.forceCleanupAndReset();
              Alert.alert(
                '✅ Thành công',
                'Đã xóa tất cả alarm cũ và tạo lại. Thông báo giờ sẽ chỉ xuất hiện vào thời gian phù hợp.',
                [{ text: 'OK', onPress: onClose }]
              );
            } catch (error) {
              console.error('Error force cleanup:', error);
              Alert.alert('❌ Lỗi', 'Không thể thực hiện force cleanup');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDebugAlarms = async () => {
    setIsLoading(true);
    try {
      // Capture console.log output
      const originalLog = console.log;
      let logOutput = '';
      
      console.log = (...args) => {
        logOutput += args.join(' ') + '\n';
        originalLog(...args);
      };

      await alarmService.debugListAllAlarms();
      
      // Restore console.log
      console.log = originalLog;
      
      setDebugInfo(logOutput);
    } catch (error) {
      console.error('Error debugging alarms:', error);
      setDebugInfo('Lỗi khi debug alarm: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncReminders = async () => {
    setIsLoading(true);
    try {
      await reminderSyncService.syncNextReminders();
      Alert.alert('✅ Thành công', 'Đã đồng bộ lại reminder');
    } catch (error) {
      console.error('Error syncing reminders:', error);
      Alert.alert('❌ Lỗi', 'Không thể đồng bộ reminder');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Alarm Debug Panel</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Panel này giúp debug và sửa lỗi thông báo không đúng thời gian.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleForceCleanup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              🧹 Force Cleanup & Reset
            </Text>
            <Text style={styles.buttonSubtext}>
              Xóa tất cả alarm cũ và tạo lại
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={handleDebugAlarms}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              🔍 Debug Alarm List
            </Text>
            <Text style={styles.buttonSubtext}>
              Xem danh sách alarm hiện tại
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSyncReminders}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              🔄 Sync Reminders
            </Text>
            <Text style={styles.buttonSubtext}>
              Đồng bộ lại reminder
            </Text>
          </TouchableOpacity>
        </View>

        {debugInfo ? (
          <View style={styles.debugOutput}>
            <Text style={styles.debugTitle}>📋 Debug Output:</Text>
            <ScrollView style={styles.debugScroll}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </ScrollView>
          </View>
        ) : null}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>⏳ Đang xử lý...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#ff4444',
  },
  infoButton: {
    backgroundColor: '#2196f3',
  },
  primaryButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  debugOutput: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  debugScroll: {
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
