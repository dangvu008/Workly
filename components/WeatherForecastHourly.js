import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme/colors';
import { FONT_SIZES } from '../styles/theme/typography';
import { SPACING } from '../styles/theme/spacing';

// Map condition to icon name
const getWeatherIcon = (condition) => {
  switch (condition) {
    case 'sunny':
      return 'wb-sunny';
    case 'partly-cloudy':
      return 'wb-cloudy';
    case 'cloudy':
      return 'cloud';
    case 'rainy':
      return 'grain';
    case 'stormy':
      return 'flash-on';
    case 'snowy':
      return 'ac-unit';
    default:
      return 'wb-sunny';
  }
};

const WeatherForecastHourly = ({ forecast = [] }) => {
  if (!forecast || forecast.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {forecast.map((item, index) => (
        <View key={index} style={styles.forecastItem}>
          <Text style={styles.timeText}>{item.time}</Text>
          <MaterialIcons 
            name={getWeatherIcon(item.condition)} 
            size={24} 
            color={COLORS.white} 
            style={styles.icon}
          />
          <Text style={styles.tempText}>{item.temp}°C</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  forecastItem: {
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    color: COLORS.appDarkTextSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  icon: {
    marginVertical: SPACING.xs,
  },
  tempText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
});

export default WeatherForecastHourly;
