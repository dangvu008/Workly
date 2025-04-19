import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../styles/theme/colors';
import { SPACING, RADIUS } from '../styles/theme/spacing';
import { FONT_SIZES } from '../styles/theme/typography';
import { useLocalization } from '../localization/LocalizationContext';
import { MaterialIcons } from '@expo/vector-icons';

// Mock data for weather forecast (replace with actual API data)
const mockForecastData = [
  { time: '09:00', temp: 28, icon: 'wb-sunny' },
  { time: '12:00', temp: 32, icon: 'wb-sunny' },
  { time: '15:00', temp: 30, icon: 'cloud' },
];

const WeatherForecast = ({ forecastData = mockForecastData }) => {
  const { t } = useLocalization();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="access-time" size={20} color={COLORS.appBlue} />
        <Text style={styles.title}>{t('weather.nextHours')}</Text>
      </View>
      <View style={styles.forecastContainer}>
        {forecastData.map((item, index) => (
          <View key={index} style={styles.forecastItem}>
            <Text style={styles.timeText}>{item.time}</Text>
            <MaterialIcons name={item.icon} size={24} color={COLORS.white} style={styles.weatherIcon} />
            <Text style={styles.tempText}>{item.temp}°C</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.md,
  },
  forecastItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: COLORS.appDarkTextSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  weatherIcon: {
    marginVertical: SPACING.sm,
  },
  tempText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
});

export default WeatherForecast;
