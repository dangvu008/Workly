import * as Location from 'expo-location';
import { WeatherData, WeatherLocation } from '../types';
import { API_ENDPOINTS, WEATHER_WARNINGS } from '../constants';
import { storageService } from './storage';

// Note: You'll need to get a free API key from OpenWeatherMap
const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

class WeatherService {
  private async fetchWeatherData(lat: number, lon: number): Promise<any> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.WEATHER}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  private async fetchForecastData(lat: number, lon: number): Promise<any> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.WEATHER}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi&cnt=8`
      );
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      throw error;
    }
  }

  private async getCurrentLocation(): Promise<{ lat: number; lon: number }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  private async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result.length > 0) {
        const location = result[0];
        return `${location.district || location.subregion || ''}, ${location.city || location.region || ''}`.trim();
      }
      return 'Vị trí không xác định';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Vị trí không xác định';
    }
  }

  private analyzeWeatherWarnings(weatherData: any, forecastData: any, location: 'home' | 'work'): Array<{
    type: keyof typeof WEATHER_WARNINGS;
    message: string;
    location: 'home' | 'work';
    time: string;
  }> {
    const warnings: Array<{
      type: keyof typeof WEATHER_WARNINGS;
      message: string;
      location: 'home' | 'work';
      time: string;
    }> = [];

    // Check current weather
    const temp = weatherData.main.temp;
    const windSpeed = weatherData.wind?.speed || 0;
    const rain = weatherData.rain?.['1h'] || 0;
    const snow = weatherData.snow?.['1h'] || 0;

    // Temperature warnings
    if (temp >= WEATHER_WARNINGS.heat.threshold) {
      warnings.push({
        type: 'heat',
        message: `Nhiệt độ cao (${Math.round(temp)}°C) tại ${location === 'home' ? 'nhà' : 'công ty'}`,
        location,
        time: new Date().toISOString(),
      });
    }

    if (temp <= WEATHER_WARNINGS.cold.threshold) {
      warnings.push({
        type: 'cold',
        message: `Nhiệt độ thấp (${Math.round(temp)}°C) tại ${location === 'home' ? 'nhà' : 'công ty'}`,
        location,
        time: new Date().toISOString(),
      });
    }

    // Rain warning
    if (rain >= WEATHER_WARNINGS.rain.threshold) {
      warnings.push({
        type: 'rain',
        message: `Mưa (${rain.toFixed(1)}mm/h) tại ${location === 'home' ? 'nhà' : 'công ty'}`,
        location,
        time: new Date().toISOString(),
      });
    }

    // Snow warning
    if (snow >= WEATHER_WARNINGS.snow.threshold) {
      warnings.push({
        type: 'snow',
        message: `Tuyết (${snow.toFixed(1)}mm/h) tại ${location === 'home' ? 'nhà' : 'công ty'}`,
        location,
        time: new Date().toISOString(),
      });
    }

    // Wind/Storm warning
    if (windSpeed >= WEATHER_WARNINGS.storm.threshold / 3.6) { // Convert km/h to m/s
      warnings.push({
        type: 'storm',
        message: `Gió mạnh (${Math.round(windSpeed * 3.6)}km/h) tại ${location === 'home' ? 'nhà' : 'công ty'}`,
        location,
        time: new Date().toISOString(),
      });
    }

    // Check forecast for next 3 hours
    if (forecastData?.list) {
      forecastData.list.slice(0, 1).forEach((forecast: any, index: number) => {
        const forecastTemp = forecast.main.temp;
        const forecastRain = forecast.rain?.['3h'] || 0;
        const forecastSnow = forecast.snow?.['3h'] || 0;
        const forecastWind = forecast.wind?.speed || 0;
        const timeOffset = (index + 1) * 3; // 3-hour intervals

        if (forecastTemp >= WEATHER_WARNINGS.heat.threshold) {
          warnings.push({
            type: 'heat',
            message: `Dự báo nóng (${Math.round(forecastTemp)}°C) trong ${timeOffset}h tới tại ${location === 'home' ? 'nhà' : 'công ty'}`,
            location,
            time: new Date(Date.now() + timeOffset * 60 * 60 * 1000).toISOString(),
          });
        }

        if (forecastRain >= WEATHER_WARNINGS.rain.threshold * 3) { // 3-hour accumulation
          warnings.push({
            type: 'rain',
            message: `Dự báo mưa trong ${timeOffset}h tới tại ${location === 'home' ? 'nhà' : 'công ty'}`,
            location,
            time: new Date(Date.now() + timeOffset * 60 * 60 * 1000).toISOString(),
          });
        }
      });
    }

    return warnings;
  }

  async getWeatherData(forceRefresh: boolean = false): Promise<WeatherData | null> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedWeather = await storageService.getWeatherCache();
        if (cachedWeather) {
          const cacheAge = Date.now() - new Date(cachedWeather.lastUpdated).getTime();
          if (cacheAge < CACHE_DURATION) {
            return cachedWeather;
          }
        }
      }

      const settings = await storageService.getUserSettings();
      if (!settings.weatherWarningEnabled) {
        return null;
      }

      // ✅ Fallback to saved locations if no weather location configured
      if (!settings.weatherLocation) {
        if (settings.workLocation || settings.homeLocation) {
          console.log('🌤️ No weather location configured, using saved locations as fallback');
          return await this.getWeatherFromSavedLocations(settings);
        }
        return null;
      }

      const weatherLocation = settings.weatherLocation;
      let weatherData: WeatherData | null = null;

      // Get weather for home location
      if (weatherLocation.home) {
        const homeWeather = await this.fetchWeatherData(
          weatherLocation.home.lat,
          weatherLocation.home.lon
        );
        const homeForecast = await this.fetchForecastData(
          weatherLocation.home.lat,
          weatherLocation.home.lon
        );
        const homeLocationName = await this.reverseGeocode(
          weatherLocation.home.lat,
          weatherLocation.home.lon
        );

        const homeWarnings = this.analyzeWeatherWarnings(homeWeather, homeForecast, 'home');

        weatherData = {
          current: {
            temperature: Math.round(homeWeather.main.temp),
            description: homeWeather.weather[0].description,
            icon: homeWeather.weather[0].icon,
            location: homeLocationName,
          },
          forecast: homeForecast.list.slice(0, 3).map((item: any) => ({
            time: new Date(item.dt * 1000).toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            temperature: Math.round(item.main.temp),
            description: item.weather[0].description,
            icon: item.weather[0].icon,
          })),
          warnings: homeWarnings,
          lastUpdated: new Date().toISOString(),
        };

        // If using separate work location, get work weather too
        if (!weatherLocation.useSingleLocation && weatherLocation.work) {
          const workWeather = await this.fetchWeatherData(
            weatherLocation.work.lat,
            weatherLocation.work.lon
          );
          const workForecast = await this.fetchForecastData(
            weatherLocation.work.lat,
            weatherLocation.work.lon
          );
          const workWarnings = this.analyzeWeatherWarnings(workWeather, workForecast, 'work');

          // Combine warnings
          weatherData.warnings = [...(weatherData.warnings || []), ...workWarnings];
        }
      }

      // Cache the weather data
      if (weatherData) {
        await storageService.setWeatherCache(weatherData);
      }

      return weatherData;
    } catch (error) {
      console.error('Error getting weather data:', error);
      // Return cached data if available
      return await storageService.getWeatherCache();
    }
  }

  /**
   * ✅ Lấy thông tin thời tiết từ saved locations
   */
  private async getWeatherFromSavedLocations(settings: any): Promise<WeatherData | null> {
    try {
      // Ưu tiên work location cho thời tiết
      const location = settings.workLocation || settings.homeLocation;
      if (!location) return null;

      const weatherData = await this.fetchWeatherData(location.latitude, location.longitude);
      const forecastData = await this.fetchForecastData(location.latitude, location.longitude);

      const locationName = location.name || await this.reverseGeocode(location.latitude, location.longitude);
      const warnings = this.analyzeWeatherWarnings(weatherData, forecastData, 'work');

      const result: WeatherData = {
        current: {
          temperature: Math.round(weatherData.main.temp),
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          location: locationName,
        },
        forecast: forecastData.list.slice(0, 5).map((item: any) => ({
          time: new Date(item.dt * 1000).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          temperature: Math.round(item.main.temp),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          precipitation: item.pop * 100,
        })),
        warnings,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      await storageService.setWeatherCache(result);
      return result;
    } catch (error) {
      console.error('Error getting weather from saved locations:', error);
      return null;
    }
  }

  async setupLocationForFirstTime(locationType: 'home' | 'work'): Promise<{ lat: number; lon: number }> {
    try {
      const currentLocation = await this.getCurrentLocation();
      const settings = await storageService.getUserSettings();
      
      const weatherLocation: WeatherLocation = settings.weatherLocation || {
        home: null,
        work: null,
        useSingleLocation: false,
      };

      if (locationType === 'home') {
        weatherLocation.home = currentLocation;
      } else {
        weatherLocation.work = currentLocation;
      }

      // Check if we should suggest using single location
      if (weatherLocation.home && weatherLocation.work) {
        const distance = this.calculateDistance(
          weatherLocation.home.lat,
          weatherLocation.home.lon,
          weatherLocation.work.lat,
          weatherLocation.work.lon
        );

        // If locations are within 20km, suggest using single location
        if (distance <= 20) {
          weatherLocation.useSingleLocation = true;
        }
      }

      await storageService.updateUserSettings({ weatherLocation });
      return currentLocation;
    } catch (error) {
      console.error('Error setting up location:', error);
      throw error;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async resetWeatherLocations(): Promise<void> {
    const settings = await storageService.getUserSettings();
    await storageService.updateUserSettings({
      weatherLocation: null,
    });
    await storageService.setWeatherCache(null);
  }
}

export const weatherService = new WeatherService();
