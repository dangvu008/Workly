import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, useTheme, Divider, List, ActivityIndicator } from 'react-native-paper';
import { FastIcon } from './WorklyIcon';
import { weatherService } from '../services/weather';

interface ApiKeyStatus {
  totalKeys: number;
  currentIndex: number;
  failures: Record<string, number>;
  workingKeys: number;
}

interface ApiKeyTestResult {
  key: string;
  index: number;
  status: 'working' | 'failed';
  error?: string;
}

export function WeatherApiDebug() {
  const theme = useTheme();
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [testResults, setTestResults] = useState<ApiKeyTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const loadApiKeyStatus = async () => {
    try {
      setIsLoading(true);
      const status = await weatherService.getApiKeyStatus();
      setApiKeyStatus(status);
    } catch (error) {
      console.error('Error loading API key status:', error);
      Alert.alert('Lỗi', 'Không thể tải trạng thái API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const resetApiKeyFailures = async () => {
    try {
      await weatherService.resetApiKeyFailures();
      Alert.alert('Thành công', 'Đã reset tất cả lỗi API keys');
      await loadApiKeyStatus();
    } catch (error) {
      console.error('Error resetting API key failures:', error);
      Alert.alert('Lỗi', 'Không thể reset API key failures');
    }
  };

  const testAllApiKeys = async () => {
    try {
      setIsTestingAll(true);
      setTestResults([]);
      
      Alert.alert(
        'Test API Keys',
        'Sẽ test tất cả API keys. Quá trình này có thể mất vài phút.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tiếp tục',
            onPress: async () => {
              const results = await weatherService.testAllApiKeys();
              setTestResults(results);
              
              const workingCount = results.filter(r => r.status === 'working').length;
              Alert.alert(
                'Kết quả Test',
                `${workingCount}/${results.length} API keys đang hoạt động`
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error testing API keys:', error);
      Alert.alert('Lỗi', 'Không thể test API keys');
    } finally {
      setIsTestingAll(false);
    }
  };

  const getStatusIcon = (status: 'working' | 'failed') => {
    return status === 'working' ? 'check-circle' : 'alert-circle';
  };

  const getStatusColor = (status: 'working' | 'failed') => {
    return status === 'working' ? theme.colors.primary : theme.colors.error;
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="🔑 Weather API Keys Management"
          subtitle="Quản lý và debug API keys thời tiết"
          left={(props) => <FastIcon {...props} name="key" size={24} />}
        />
        <Card.Content>
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={loadApiKeyStatus}
              disabled={isLoading}
              style={styles.button}
              icon="refresh"
            >
              {isLoading ? 'Đang tải...' : 'Tải trạng thái'}
            </Button>
            
            <Button
              mode="outlined"
              onPress={resetApiKeyFailures}
              style={styles.button}
              icon="restore"
            >
              Reset lỗi
            </Button>
          </View>

          <Button
            mode="contained-tonal"
            onPress={testAllApiKeys}
            disabled={isTestingAll}
            style={styles.fullButton}
            icon="test-tube"
          >
            {isTestingAll ? 'Đang test...' : 'Test tất cả API keys'}
          </Button>

          {isTestingAll && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Đang test API keys...</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {apiKeyStatus && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="📊 Trạng thái API Keys" />
          <Card.Content>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Tổng số keys:</Text>
              <Text style={styles.statusValue}>{apiKeyStatus.totalKeys}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Key hiện tại:</Text>
              <Text style={styles.statusValue}>#{apiKeyStatus.currentIndex + 1}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Keys hoạt động:</Text>
              <Text style={[
                styles.statusValue,
                { color: apiKeyStatus.workingKeys > 0 ? theme.colors.primary : theme.colors.error }
              ]}>
                {apiKeyStatus.workingKeys}/{apiKeyStatus.totalKeys}
              </Text>
            </View>

            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Chi tiết lỗi:</Text>
            {Object.entries(apiKeyStatus.failures).map(([key, failures]) => (
              <View key={key} style={styles.failureRow}>
                <Text style={styles.keyName}>{key}</Text>
                <Text style={[
                  styles.failureCount,
                  { color: failures > 0 ? theme.colors.error : theme.colors.onSurfaceVariant }
                ]}>
                  {failures} lỗi
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {testResults.length > 0 && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="🧪 Kết quả Test API Keys" />
          <Card.Content>
            {testResults.map((result, index) => (
              <List.Item
                key={index}
                title={`API Key ${result.index + 1}`}
                description={result.key + (result.error ? ` - ${result.error}` : '')}
                left={(props) => (
                  <FastIcon
                    {...props}
                    name={getStatusIcon(result.status)}
                    color={getStatusColor(result.status)}
                    size={24}
                  />
                )}
                right={() => (
                  <Text style={[
                    styles.statusBadge,
                    {
                      backgroundColor: result.status === 'working' 
                        ? theme.colors.primaryContainer 
                        : theme.colors.errorContainer,
                      color: result.status === 'working'
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onErrorContainer
                    }
                  ]}>
                    {result.status === 'working' ? 'OK' : 'FAIL'}
                  </Text>
                )}
              />
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <Text style={styles.infoText}>
            💡 Hệ thống sẽ tự động xoay vòng giữa các API keys để tránh bị giới hạn rate limit.
            Khi một key bị lỗi 3 lần, nó sẽ bị tạm ngưng sử dụng trong 1 giờ.
          </Text>
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  fullButton: {
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  failureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  keyName: {
    flex: 1,
    fontSize: 14,
  },
  failureCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 40,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
