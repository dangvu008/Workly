import { COLORS } from '../styles/theme/colors';

// Weather thresholds for extreme conditions
export const WEATHER_THRESHOLDS = {
  HIGH_TEMP: 35, // Celsius
  LOW_TEMP: 10, // Celsius
  HEAVY_RAIN: 10, // mm per hour
  STRONG_WIND: 15, // m/s
  SNOW: 0, // Any snow
};

/**
 * Check if weather conditions are extreme
 * @param {Object} weatherData - Weather data object
 * @returns {Object|null} - Object with alert info or null if no extreme conditions
 */
export const checkExtremeWeather = (weatherData) => {
  if (!weatherData || !weatherData.main) return null;

  const alerts = [];

  // Check temperature
  if (weatherData.main.temp > WEATHER_THRESHOLDS.HIGH_TEMP) {
    alerts.push({
      type: 'high_temp',
      icon: 'wb-sunny',
      color: COLORS.appStatusWarning,
      message: 'highTemp',
    });
  } else if (weatherData.main.temp < WEATHER_THRESHOLDS.LOW_TEMP) {
    alerts.push({
      type: 'low_temp',
      icon: 'ac-unit',
      color: COLORS.appBlue,
      message: 'lowTemp',
    });
  }

  // Check precipitation
  if (weatherData.weather && weatherData.weather[0]) {
    const weatherCondition = weatherData.weather[0].main.toLowerCase();
    
    if (weatherCondition === 'thunderstorm') {
      alerts.push({
        type: 'thunderstorm',
        icon: 'flash-on',
        color: COLORS.appStatusError,
        message: 'thunderstorm',
      });
    } else if (weatherCondition.includes('rain')) {
      // Check for heavy rain
      const rainAmount = weatherData.rain && weatherData.rain['1h'] 
        ? weatherData.rain['1h'] 
        : 0;
        
      if (rainAmount > WEATHER_THRESHOLDS.HEAVY_RAIN) {
        alerts.push({
          type: 'heavy_rain',
          icon: 'grain',
          color: COLORS.appStatusInfo,
          message: 'heavyRain',
        });
      }
    } else if (weatherCondition.includes('snow')) {
      alerts.push({
        type: 'snow',
        icon: 'ac-unit',
        color: COLORS.appBlue,
        message: 'snow',
      });
    }
  }

  // Check wind
  if (weatherData.wind && weatherData.wind.speed > WEATHER_THRESHOLDS.STRONG_WIND) {
    alerts.push({
      type: 'strong_wind',
      icon: 'air',
      color: COLORS.appStatusWarning,
      message: 'strongWind',
    });
  }

  return alerts.length > 0 ? alerts : null;
};

/**
 * Format weather alert message for departure and return times
 * @param {Array} departureAlerts - Alerts for departure time
 * @param {Array} returnAlerts - Alerts for return time
 * @param {Object} shift - Shift data
 * @param {Function} t - Translation function
 * @returns {String} - Formatted alert message
 */
export const formatWeatherAlertMessage = (departureAlerts, returnAlerts, shift, t) => {
  let message = '';

  // Add departure alerts
  if (departureAlerts && departureAlerts.length > 0) {
    message += t('weather.departureAlert', { time: shift.departureTime }) + ' ';
    
    departureAlerts.forEach((alert, index) => {
      message += t(`weather.warnings.${alert.message}`);
      if (index < departureAlerts.length - 1) {
        message += ', ';
      }
    });
    
    if (returnAlerts && returnAlerts.length > 0) {
      message += '. ';
    }
  }

  // Add return alerts
  if (returnAlerts && returnAlerts.length > 0) {
    message += t('weather.returnAlert', { time: shift.officeEndTime }) + ' ';
    
    returnAlerts.forEach((alert, index) => {
      message += t(`weather.warnings.${alert.message}`);
      if (index < returnAlerts.length - 1) {
        message += ', ';
      }
    });
  }

  return message;
};
