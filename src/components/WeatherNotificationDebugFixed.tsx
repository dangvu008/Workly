import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme, Divider } from 'react-native-paper';
import { useApp } from '../contexts/AppContext';
import { notificationScheduler } from '../services/notificationScheduler';
import { weatherService } from '../services/weather';
import { format, addDays } from 'date-fns';

export function WeatherNotificationDebugFixed() {
  const theme = useTheme();
  const { state } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testWeatherNotificationFixed = async () => {
    if (!state.activeShift) {
      Alert.alert('Lỗi', 'Không có ca làm việc đang hoạt động');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Cleanup existing notifications
      await notificationScheduler.cancelAllWeatherWarnings();
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Schedule weather notifications for next 3 days only
      const today = new Date();
      let scheduledCount = 0;
      const scheduledNotifications = [];

      for (let i = 0; i < 3; i++) {
        const workdayDate = new Date(today);
        workdayDate.setDate(today.getDate() + i);
        const dayOfWeek = workdayDate.getDay();

        if (state.activeShift.workDays.includes(dayOfWeek)) {
          await notificationScheduler.scheduleWeatherWarning(state.activeShift, workdayDate);
          scheduledCount++;
          scheduledNotifications.push({
            date: format(workdayDate, 'yyyy-MM-dd'),
            dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dayOfWeek],
          });
        }
      }

      // 3. Get current weather data
      const weatherData = await weatherService.getWeatherData(true);

      // 4. Get all scheduled notifications
      const allScheduled = await notificationScheduler.getAllScheduledNotifications();
      const weatherNotifications = allScheduled.filter((n: any) => 
        n.identifier.includes('weather_') || n.content?.data?.type?.includes('weather')
      );

      setDebugInfo({
        scheduledCount,
        scheduledNotifications,
        weatherData: weatherData ? {
          temperature: weatherData.current?.temperature,
          description: weatherData.current?.description,
          location: weatherData.current?.location,
          warningsCount: weatherData.warnings?.length || 0,
          warnings: weatherData.warnings?.slice(0, 2).map(w => w.message) || []
        } : null,
        totalWeatherNotifications: weatherNotifications.length,
        weatherNotificationDetails: weatherNotifications.map((n: any) => ({
          identifier: n.identifier,
          title: n.content?.title,
          body: n.content?.body?.substring(0, 100) + '...',
          triggerTime: n.trigger?.date ? new Date(n.trigger.date * 1000).toLocaleString() : 'Immediate'
        }))
      });

      Alert.alert(
        '✅ Test hoàn tất',
        `Đã lập lịch ${scheduledCount} thông báo thời tiết cho 3 ngày tới.\nTổng cộng: ${weatherNotifications.length} weather notifications.`
      );

    } catch (error) {
      console.error('Test weather notification error:', error);
      Alert.alert('❌ Lỗi', `Không thể test: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllWeatherNotifications = async () => {
    setIsLoading(true);
    try {
      await notificationScheduler.cancelAllWeatherWarnings();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const remaining = await notificationScheduler.getAllScheduledNotifications();
      const weatherRemaining = remaining.filter((n: any) => 
        n.identifier.includes('weather_') || n.content?.data?.type?.includes('weather')
      );

      Alert.alert(
        '🧹 Cleanup hoàn tất',
        `Còn lại ${weatherRemaining.length} weather notifications`
      );
      
      setDebugInfo(null);
    } catch (error) {
      Alert.alert('❌ Lỗi', `Không thể cleanup: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCurrentWeatherData = async () => {
    setIsLoading(true);
    try {
      const weatherData = await weatherService.getWeatherData(true);
      
      if (weatherData) {
        const message = weatherData.warnings && weatherData.warnings.length > 0
          ? `⚠️ Cảnh báo: ${weatherData.warnings.map(w => w.message).join(', ')}`
          : `🌤️ ${weatherData.current.temperature}°C, ${weatherData.current.description} tại ${weatherData.current.location}`;
          
        Alert.alert('🌤️ Dữ liệu thời tiết hiện tại', message);
      } else {
        Alert.alert('❌ Lỗi', 'Không thể lấy dữ liệu thời tiết');
      }
    } catch (error) {
      Alert.alert('❌ Lỗi', `Lỗi weather service: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            🌤️ Weather Notification Debug (Fixed)
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Ca hiện tại: {state.activeShift?.name || 'Không có'}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={testWeatherNotificationFixed}
              loading={isLoading}
              style={styles.button}
            >
              🧪 Test Weather Notifications (Fixed)
            </Button>

            <Button
              mode="outlined"
              onPress={testCurrentWeatherData}
              loading={isLoading}
              style={styles.button}
            >
              🌤️ Test Weather Data
            </Button>

            <Button
              mode="outlined"
              onPress={clearAllWeatherNotifications}
              loading={isLoading}
              style={styles.button}
            >
              🧹 Clear All Weather Notifications
            </Button>
          </View>

          {debugInfo && (
            <>
              <Divider style={styles.divider} />
              <Text style={[styles.debugTitle, { color: theme.colors.primary }]}>
                📊 Debug Information
              </Text>
              
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                Scheduled: {debugInfo.scheduledCount} notifications for next 3 days
              </Text>
              
              <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                Total weather notifications: {debugInfo.totalWeatherNotifications}
              </Text>

              {debugInfo.weatherData && (
                <Text style={[styles.debugText, { color: theme.colors.onSurface }]}>
                  Weather: {debugInfo.weatherData.temperature}°C, {debugInfo.weatherData.description}
                  {debugInfo.weatherData.warningsCount > 0 && ` (${debugInfo.weatherData.warningsCount} warnings)`}
                </Text>
              )}

              {debugInfo.scheduledNotifications.length > 0 && (
                <>
                  <Text style={[styles.debugSubtitle, { color: theme.colors.primary }]}>
                    Scheduled for:
                  </Text>
                  {debugInfo.scheduledNotifications.map((item: any, index: number) => (
                    <Text key={index} style={[styles.debugText, { color: theme.colors.onSurface }]}>
                      • {item.dayOfWeek} ({item.date})
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
