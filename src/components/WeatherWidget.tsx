import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, IconButton, useTheme, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { WEATHER_WARNINGS } from '../constants';

interface WeatherWidgetProps {
  onPress?: () => void;
}

export function WeatherWidget({ onPress }: WeatherWidgetProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([]);

  if (!state.settings?.weatherWarningEnabled || !state.weatherData) {
    return null;
  }

  const { current, forecast, warnings } = state.weatherData;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await actions.refreshWeatherData();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật dữ liệu thời tiết. Vui lòng thử lại.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismissWarning = (warningId: string) => {
    setDismissedWarnings(prev => [...prev, warningId]);
  };

  const getWeatherIcon = (iconCode: string): string => {
    const iconMap: Record<string, string> = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '🌨️', '13n': '🌨️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[iconCode] || '🌤️';
  };

  const getGradientColors = (): [string, string] => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      // Day time
      return ['#87CEEB', '#4682B4'];
    } else {
      // Night time
      return ['#2C3E50', '#34495E'];
    }
  };

  const activeWarnings = warnings?.filter(warning => 
    !dismissedWarnings.includes(`${warning.type}_${warning.location}_${warning.time}`)
  ) || [];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Card.Content style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.location}>
                {current.location}
              </Text>
              <IconButton
                icon="refresh"
                size={20}
                iconColor="#FFFFFF"
                onPress={handleRefresh}
                disabled={isRefreshing}
                style={styles.refreshButton}
              />
            </View>

            {/* Current Weather */}
            <View style={styles.currentWeather}>
              <View style={styles.currentLeft}>
                <Text style={styles.weatherIcon}>
                  {getWeatherIcon(current.icon)}
                </Text>
                <Text style={styles.temperature}>
                  {current.temperature}°C
                </Text>
              </View>
              <View style={styles.currentRight}>
                <Text style={styles.description}>
                  {current.description}
                </Text>
                <Text style={styles.lastUpdated}>
                  Cập nhật: {format(new Date(state.weatherData.lastUpdated), 'HH:mm', { locale: vi })}
                </Text>
              </View>
            </View>

            {/* Forecast */}
            {forecast && forecast.length > 0 && (
              <View style={styles.forecastContainer}>
                <Text style={styles.forecastTitle}>
                  Dự báo 3h tới:
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.forecastScroll}
                >
                  {forecast.map((item, index) => (
                    <View key={index} style={styles.forecastItem}>
                      <Text style={styles.forecastTime}>
                        {item.time}
                      </Text>
                      <Text style={styles.forecastIcon}>
                        {getWeatherIcon(item.icon)}
                      </Text>
                      <Text style={styles.forecastTemp}>
                        {item.temperature}°
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </Card.Content>
        </LinearGradient>

        {/* Weather Warnings */}
        {activeWarnings.length > 0 && (
          <View style={[styles.warningsContainer, { backgroundColor: theme.colors.errorContainer }]}>
            {activeWarnings.map((warning, index) => {
              const warningId = `${warning.type}_${warning.location}_${warning.time}`;
              const warningConfig = WEATHER_WARNINGS[warning.type];
              
              return (
                <View key={warningId} style={styles.warningItem}>
                  <View style={styles.warningContent}>
                    <Text style={[styles.warningIcon, { color: warningConfig.color }]}>
                      {warningConfig.icon}
                    </Text>
                    <Text style={[styles.warningText, { color: theme.colors.onErrorContainer }]}>
                      {warning.message}
                    </Text>
                  </View>
                  <IconButton
                    icon="close"
                    size={16}
                    iconColor={theme.colors.onErrorContainer}
                    onPress={() => handleDismissWarning(warningId)}
                    style={styles.dismissButton}
                  />
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 12,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  refreshButton: {
    margin: 0,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  temperature: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  currentRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  lastUpdated: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  forecastContainer: {
    marginTop: 8,
  },
  forecastTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.9,
  },
  forecastScroll: {
    flexDirection: 'row',
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  forecastTime: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  forecastIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  forecastTemp: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  warningsContainer: {
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  dismissButton: {
    margin: 0,
  },
});
