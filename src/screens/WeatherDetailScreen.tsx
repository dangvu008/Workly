import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  IconButton,
  useTheme,
  Button,
  Chip,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorklyBackground } from '../components/WorklyBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { t } from '../i18n';
import { WEATHER_WARNINGS } from '../constants';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

type WeatherDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WeatherDetail'>;

interface WeatherDetailScreenProps {
  navigation: WeatherDetailScreenNavigationProp;
}

export function WeatherDetailScreen({ navigation }: WeatherDetailScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<'home' | 'work'>('home');

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  if (!state.settings?.weatherWarningEnabled || !state.weatherData) {
    return (
      <WorklyBackground variant="form">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Fallback: navigate to HomeTab if can't go back
                navigation.navigate('MainTabs', { screen: 'HomeTab' });
              }
            }}
          />
          <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Thời tiết
          </Text>
          <View style={{ width: 48 }} />
        </View>
        
        <View style={[styles.centerContent, { flex: 1 }]}>
          <Text style={[styles.noDataText, { color: theme.colors.onSurfaceVariant }]}>
            Tính năng thời tiết chưa được bật hoặc chưa có dữ liệu.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
          >
            Đi đến Cài đặt
          </Button>
        </View>
        </SafeAreaView>
      </WorklyBackground>
    );
  }

  const { current, forecast, warnings } = state.weatherData;
  const hasMultipleLocations = state.settings.weatherLocation?.work && 
                              !state.settings.weatherLocation.useSingleLocation;

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
      return ['#87CEEB', '#4682B4'];
    } else {
      return ['#2C3E50', '#34495E'];
    }
  };

  const getLocationWarnings = (location: 'home' | 'work') => {
    return warnings?.filter(warning => warning.location === location) || [];
  };

  const currentLocationWarnings = getLocationWarnings(selectedLocation);

  return (
    <WorklyBackground variant="form">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              // Fallback: navigate to HomeTab if can't go back
              navigation.navigate('MainTabs', { screen: 'HomeTab' });
            }
          }}
        />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Chi tiết thời tiết
        </Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleRefresh}
          disabled={isRefreshing}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Location Selector */}
        {hasMultipleLocations && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Chọn vị trí
              </Text>
              <View style={styles.locationSelector}>
                <Chip
                  mode={selectedLocation === 'home' ? 'flat' : 'outlined'}
                  selected={selectedLocation === 'home'}
                  onPress={() => setSelectedLocation('home')}
                  style={styles.locationChip}
                >
                  🏠 Nhà
                </Chip>
                <Chip
                  mode={selectedLocation === 'work' ? 'flat' : 'outlined'}
                  selected={selectedLocation === 'work'}
                  onPress={() => setSelectedLocation('work')}
                  style={styles.locationChip}
                >
                  🏢 Công ty
                </Chip>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Current Weather */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, overflow: 'hidden' }]}>
          <LinearGradient
            colors={getGradientColors()}
            style={styles.weatherGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Card.Content style={styles.weatherContent}>
              <Text style={styles.locationName}>
                {current.location}
              </Text>
              
              <View style={styles.currentWeatherMain}>
                <Text style={styles.weatherIconLarge}>
                  {getWeatherIcon(current.icon)}
                </Text>
                <View style={styles.temperatureContainer}>
                  <Text style={styles.temperatureLarge}>
                    {current.temperature}°C
                  </Text>
                  <Text style={styles.descriptionLarge}>
                    {current.description}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.lastUpdated}>
                {t(currentLanguage, 'weather.lastUpdated')}: {format(new Date(state.weatherData.lastUpdated), 'HH:mm dd/MM/yyyy', { locale: currentLanguage === 'vi' ? vi : enUS })}
              </Text>
            </Card.Content>
          </LinearGradient>
        </Card>

        {/* Forecast */}
        {forecast && forecast.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Dự báo chi tiết
              </Text>
              
              {forecast.map((item, index) => (
                <View key={index}>
                  <View style={styles.forecastItem}>
                    <Text style={[styles.forecastTime, { color: theme.colors.onSurface }]}>
                      {item.time}
                    </Text>
                    <View style={styles.forecastWeather}>
                      <Text style={styles.forecastIcon}>
                        {getWeatherIcon(item.icon)}
                      </Text>
                      <Text style={[styles.forecastTemp, { color: theme.colors.onSurface }]}>
                        {item.temperature}°C
                      </Text>
                    </View>
                    <Text style={[styles.forecastDesc, { color: theme.colors.onSurfaceVariant }]}>
                      {item.description}
                    </Text>
                  </View>
                  {index < forecast.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Warnings */}
        {currentLocationWarnings.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onErrorContainer }]}>
                Cảnh báo thời tiết
              </Text>
              
              {currentLocationWarnings.map((warning, index) => {
                const warningConfig = WEATHER_WARNINGS[warning.type];
                
                return (
                  <View key={index} style={styles.warningItem}>
                    <View style={styles.warningHeader}>
                      <Text style={[styles.warningIcon, { color: warningConfig.color }]}>
                        {warningConfig.icon}
                      </Text>
                      <Text style={[styles.warningType, { color: theme.colors.onErrorContainer }]}>
                        {warning.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.warningMessage, { color: theme.colors.onErrorContainer }]}>
                      {warning.message}
                    </Text>
                    <Text style={[styles.warningTime, { color: theme.colors.onErrorContainer }]}>
                      {format(new Date(warning.time), 'HH:mm dd/MM', { locale: currentLanguage === 'vi' ? vi : enUS })}
                    </Text>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Weather Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Thông tin thêm
            </Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Nguồn dữ liệu
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  OpenWeatherMap
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Tần suất cập nhật
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  30 phút
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Độ chính xác
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  ~85%
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Settings')}
            style={styles.actionButton}
            icon="cog"
          >
            Cài đặt thời tiết
          </Button>
          
          <Button
            mode="contained"
            onPress={handleRefresh}
            style={styles.actionButton}
            icon="refresh"
            loading={isRefreshing}
          >
            Làm mới
          </Button>
        </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  locationSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  locationChip: {
    flex: 1,
  },
  weatherGradient: {
    borderRadius: 12,
  },
  weatherContent: {
    padding: 20,
  },
  locationName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  currentWeatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  weatherIconLarge: {
    fontSize: 64,
    marginRight: 20,
  },
  temperatureContainer: {
    alignItems: 'center',
  },
  temperatureLarge: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  descriptionLarge: {
    color: '#FFFFFF',
    fontSize: 18,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  lastUpdated: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  forecastTime: {
    fontSize: 14,
    fontWeight: '500',
    width: 60,
  },
  forecastWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  forecastIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  forecastDesc: {
    fontSize: 12,
    flex: 1,
    textTransform: 'capitalize',
  },
  divider: {
    marginVertical: 4,
  },
  warningItem: {
    marginBottom: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningType: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  warningTime: {
    fontSize: 12,
    opacity: 0.8,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 0.48,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  settingsButton: {
    marginTop: 16,
  },
});
