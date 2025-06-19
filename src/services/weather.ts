import * as Location from 'expo-location';
import { WeatherData, WeatherLocation } from '../types';
import { API_ENDPOINTS, WEATHER_WARNINGS } from '../constants';
import { storageService } from './storage';

// ✅ Multiple API keys for rotation to avoid rate limiting
const WEATHER_API_KEYS = [
  'c3e99eae382719dd7e1d1a38004f1777',
  '3f177ee42c290b6b0d1fd85ffa9e361ec4f4ace0ea0ef06f0217288066fe4229',
  '740fc9de122d8676d2713e05577b3f87',
  // Backup keys (có thể thêm thêm nếu cần)
  'YOUR_BACKUP_API_KEY_1',
  'YOUR_BACKUP_API_KEY_2',
];

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const API_KEY_ROTATION_STORAGE_KEY = 'weather_api_key_rotation';
const API_KEY_FAILURE_STORAGE_KEY = 'weather_api_key_failures';

class WeatherService {
  /**
   * ✅ Get next available API key with rotation and failure tracking
   */
  private async getNextApiKey(): Promise<string> {
    try {
      // Get current rotation state
      const rotationData = await storageService.getItem(API_KEY_ROTATION_STORAGE_KEY);
      const failureData = await storageService.getItem(API_KEY_FAILURE_STORAGE_KEY);

      let currentIndex = rotationData ? parseInt(rotationData) : 0;
      const failures = failureData ? JSON.parse(failureData) : {};

      // Find next working API key
      let attempts = 0;
      while (attempts < WEATHER_API_KEYS.length) {
        const apiKey = WEATHER_API_KEYS[currentIndex];
        const failureCount = failures[apiKey] || 0;
        const lastFailure = failures[`${apiKey}_lastFailure`] || 0;
        const timeSinceLastFailure = Date.now() - lastFailure;

        // Reset failure count after 1 hour
        if (timeSinceLastFailure > 60 * 60 * 1000) {
          failures[apiKey] = 0;
        }

        // Use this key if failure count < 3
        if (failureCount < 3) {
          // Save current index for next rotation
          await storageService.setItem(API_KEY_ROTATION_STORAGE_KEY, currentIndex.toString());
          return apiKey;
        }

        // Try next key
        currentIndex = (currentIndex + 1) % WEATHER_API_KEYS.length;
        attempts++;
      }

      // If all keys failed, use first one anyway
      console.warn('⚠️ All weather API keys have failures, using first key');
      return WEATHER_API_KEYS[0];
    } catch (error) {
      console.error('Error getting API key:', error);
      return WEATHER_API_KEYS[0];
    }
  }

  /**
   * ✅ Mark API key as failed
   */
  private async markApiKeyFailed(apiKey: string): Promise<void> {
    try {
      const failureData = await storageService.getItem(API_KEY_FAILURE_STORAGE_KEY);
      const failures = failureData ? JSON.parse(failureData) : {};

      failures[apiKey] = (failures[apiKey] || 0) + 1;
      failures[`${apiKey}_lastFailure`] = Date.now();

      await storageService.setItem(API_KEY_FAILURE_STORAGE_KEY, JSON.stringify(failures));
      console.log(`🚫 Marked API key as failed: ${apiKey.substring(0, 8)}... (failures: ${failures[apiKey]})`);
    } catch (error) {
      console.error('Error marking API key as failed:', error);
    }
  }

  /**
   * ✅ Rotate to next API key
   */
  private async rotateToNextApiKey(): Promise<void> {
    try {
      const rotationData = await storageService.getItem(API_KEY_ROTATION_STORAGE_KEY);
      const currentIndex = rotationData ? parseInt(rotationData) : 0;
      const nextIndex = (currentIndex + 1) % WEATHER_API_KEYS.length;

      await storageService.setItem(API_KEY_ROTATION_STORAGE_KEY, nextIndex.toString());
      console.log(`🔄 Rotated to next API key: index ${nextIndex}`);
    } catch (error) {
      console.error('Error rotating API key:', error);
    }
  }

  private async fetchWeatherData(lat: number, lon: number): Promise<any> {
    let lastError: Error | null = null;

    // Try up to 3 different API keys
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const apiKey = await this.getNextApiKey();
        console.log(`🌤️ Fetching weather with API key: ${apiKey.substring(0, 8)}... (attempt ${attempt + 1})`);

        const response = await fetch(
          `${API_ENDPOINTS.WEATHER}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403 || response.status === 429) {
            // API key issue or rate limit - mark as failed and try next
            await this.markApiKeyFailed(apiKey);
            await this.rotateToNextApiKey();
            throw new Error(`Weather API error: ${response.status} - ${response.statusText}`);
          } else {
            // Other error - don't mark key as failed
            throw new Error(`Weather API error: ${response.status} - ${response.statusText}`);
          }
        }

        // Success - rotate to next key for next request
        await this.rotateToNextApiKey();
        return await response.json();

      } catch (error) {
        lastError = error as Error;
        console.error(`Error fetching weather data (attempt ${attempt + 1}):`, error);

        // If it's a rate limit or auth error, try next key
        if (error instanceof Error && (
          error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('429')
        )) {
          continue;
        } else {
          // For other errors, don't retry
          break;
        }
      }
    }

    throw lastError || new Error('Failed to fetch weather data after multiple attempts');
  }

  private async fetchForecastData(lat: number, lon: number): Promise<any> {
    let lastError: Error | null = null;

    // Try up to 3 different API keys
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const apiKey = await this.getNextApiKey();
        console.log(`🌤️ Fetching forecast with API key: ${apiKey.substring(0, 8)}... (attempt ${attempt + 1})`);

        const response = await fetch(
          `${API_ENDPOINTS.WEATHER}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi&cnt=8`
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403 || response.status === 429) {
            // API key issue or rate limit - mark as failed and try next
            await this.markApiKeyFailed(apiKey);
            await this.rotateToNextApiKey();
            throw new Error(`Forecast API error: ${response.status} - ${response.statusText}`);
          } else {
            // Other error - don't mark key as failed
            throw new Error(`Forecast API error: ${response.status} - ${response.statusText}`);
          }
        }

        // Success - rotate to next key for next request
        await this.rotateToNextApiKey();
        return await response.json();

      } catch (error) {
        lastError = error as Error;
        console.error(`Error fetching forecast data (attempt ${attempt + 1}):`, error);

        // If it's a rate limit or auth error, try next key
        if (error instanceof Error && (
          error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('429')
        )) {
          continue;
        } else {
          // For other errors, don't retry
          break;
        }
      }
    }

    throw lastError || new Error('Failed to fetch forecast data after multiple attempts');
  }

  /**
   * ✅ Get API key rotation status for debugging
   */
  async getApiKeyStatus(): Promise<{
    totalKeys: number;
    currentIndex: number;
    failures: Record<string, number>;
    workingKeys: number;
  }> {
    try {
      const rotationData = await storageService.getItem(API_KEY_ROTATION_STORAGE_KEY);
      const failureData = await storageService.getItem(API_KEY_FAILURE_STORAGE_KEY);

      const currentIndex = rotationData ? parseInt(rotationData) : 0;
      const failures = failureData ? JSON.parse(failureData) : {};

      // Count working keys (failure count < 3)
      let workingKeys = 0;
      const keyFailures: Record<string, number> = {};

      WEATHER_API_KEYS.forEach((key, index) => {
        const failureCount = failures[key] || 0;
        const lastFailure = failures[`${key}_lastFailure`] || 0;
        const timeSinceLastFailure = Date.now() - lastFailure;

        // Reset failure count after 1 hour
        const effectiveFailures = timeSinceLastFailure > 60 * 60 * 1000 ? 0 : failureCount;

        keyFailures[`Key ${index + 1} (${key.substring(0, 8)}...)`] = effectiveFailures;

        if (effectiveFailures < 3) {
          workingKeys++;
        }
      });

      return {
        totalKeys: WEATHER_API_KEYS.length,
        currentIndex,
        failures: keyFailures,
        workingKeys
      };
    } catch (error) {
      console.error('Error getting API key status:', error);
      return {
        totalKeys: WEATHER_API_KEYS.length,
        currentIndex: 0,
        failures: {},
        workingKeys: WEATHER_API_KEYS.length
      };
    }
  }

  /**
   * ✅ Reset all API key failures (for debugging)
   */
  async resetApiKeyFailures(): Promise<void> {
    try {
      await storageService.removeItem(API_KEY_FAILURE_STORAGE_KEY);
      await storageService.setItem(API_KEY_ROTATION_STORAGE_KEY, '0');
      console.log('✅ Reset all API key failures');
    } catch (error) {
      console.error('Error resetting API key failures:', error);
    }
  }

  /**
   * ✅ Test all API keys
   */
  async testAllApiKeys(): Promise<Array<{
    key: string;
    index: number;
    status: 'working' | 'failed';
    error?: string;
  }>> {
    const results = [];

    for (let i = 0; i < WEATHER_API_KEYS.length; i++) {
      const apiKey = WEATHER_API_KEYS[i];

      try {
        console.log(`🧪 Testing API key ${i + 1}: ${apiKey.substring(0, 8)}...`);

        // Test with a simple weather request (Ho Chi Minh City coordinates)
        const response = await fetch(
          `${API_ENDPOINTS.WEATHER}/weather?lat=10.8231&lon=106.6297&appid=${apiKey}&units=metric&lang=vi`
        );

        if (response.ok) {
          results.push({
            key: `${apiKey.substring(0, 8)}...`,
            index: i,
            status: 'working'
          });
          console.log(`✅ API key ${i + 1} is working`);
        } else {
          results.push({
            key: `${apiKey.substring(0, 8)}...`,
            index: i,
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`
          });
          console.log(`❌ API key ${i + 1} failed: ${response.status}`);
        }
      } catch (error) {
        results.push({
          key: `${apiKey.substring(0, 8)}...`,
          index: i,
          status: 'failed',
          error: (error as Error).message
        });
        console.log(`❌ API key ${i + 1} failed:`, error);
      }

      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * ✅ Chức năng Cảnh báo Thời tiết Cực đoan
   * Phân tích thời tiết cho cả 2 chặng di chuyển: Nhà -> Công ty và Công ty -> Nhà
   */
  async analyzeExtremeWeatherForShift(shift: any, date: Date): Promise<{
    hasWarning: boolean;
    warningMessage: string;
    departureWarning?: string;
    returnWarning?: string;
  }> {
    try {
      const settings = await storageService.getUserSettings();

      if (!settings.weatherWarningEnabled || !settings.weatherLocation) {
        return { hasWarning: false, warningMessage: '' };
      }

      const weatherLocation = settings.weatherLocation;
      const warnings: string[] = [];

      // Parse shift times
      const [depHour, depMinute] = shift.departureTime.split(':').map(Number);
      const [endHour, endMinute] = shift.officeEndTime.split(':').map(Number);

      const departureTime = new Date(date);
      departureTime.setHours(depHour, depMinute, 0, 0);

      const returnTime = new Date(date);
      returnTime.setHours(endHour, endMinute, 0, 0);

      // Handle night shift
      if (shift.isNightShift && returnTime <= departureTime) {
        returnTime.setDate(returnTime.getDate() + 1);
      }

      // 1. Phân tích chặng "Đi làm" (tại vị trí Nhà)
      if (weatherLocation.home) {
        const departureWarning = await this.analyzeWeatherForTimeAndLocation(
          weatherLocation.home.lat,
          weatherLocation.home.lon,
          departureTime,
          'departure',
          'nhà'
        );

        if (departureWarning) {
          warnings.push(departureWarning);
        }
      }

      // 2. Phân tích chặng "Tan làm" (tại vị trí Công ty)
      if (!weatherLocation.useSingleLocation && weatherLocation.work) {
        const returnWarning = await this.analyzeWeatherForTimeAndLocation(
          weatherLocation.work.lat,
          weatherLocation.work.lon,
          returnTime,
          'return',
          'công ty'
        );

        if (returnWarning) {
          warnings.push(returnWarning);
        }
      } else if (weatherLocation.useSingleLocation && weatherLocation.home) {
        // Nếu dùng single location, check return weather tại nhà
        const returnWarning = await this.analyzeWeatherForTimeAndLocation(
          weatherLocation.home.lat,
          weatherLocation.home.lon,
          returnTime,
          'return',
          'nhà'
        );

        if (returnWarning) {
          warnings.push(returnWarning);
        }
      }

      // 3. Tổng hợp cảnh báo
      if (warnings.length > 0) {
        const warningMessage = this.formatExtremeWeatherWarning(warnings);
        return {
          hasWarning: true,
          warningMessage,
          departureWarning: warnings.find(w => w.includes('đi làm')),
          returnWarning: warnings.find(w => w.includes('tan làm'))
        };
      }

      return { hasWarning: false, warningMessage: '' };

    } catch (error) {
      console.error('Error analyzing extreme weather:', error);
      return { hasWarning: false, warningMessage: '' };
    }
  }

  /**
   * ✅ Phân tích thời tiết cho một thời điểm và vị trí cụ thể
   */
  private async analyzeWeatherForTimeAndLocation(
    lat: number,
    lon: number,
    targetTime: Date,
    type: 'departure' | 'return',
    locationName: string
  ): Promise<string | null> {
    try {
      // Lấy dự báo theo giờ
      const forecastData = await this.fetchForecastData(lat, lon);

      if (!forecastData?.list) {
        return null;
      }

      // Tìm dự báo gần nhất với thời gian target
      const targetTimestamp = Math.floor(targetTime.getTime() / 1000);
      const closestForecast = forecastData.list.reduce((closest: any, current: any) => {
        const currentDiff = Math.abs(current.dt - targetTimestamp);
        const closestDiff = Math.abs(closest.dt - targetTimestamp);
        return currentDiff < closestDiff ? current : closest;
      });

      if (!closestForecast) {
        return null;
      }

      // Phân tích các điều kiện cực đoan
      const warnings: string[] = [];
      const timeStr = targetTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      // 1. Mưa to
      const rainAmount = closestForecast.rain?.['3h'] || 0;
      if (rainAmount > 2.5) { // Mưa to > 2.5mm/3h
        const actionText = type === 'departure' ? 'nhớ mang áo mưa' : 'chuẩn bị áo mưa từ nhà';
        warnings.push(`Mưa to tại ${locationName} lúc ${type === 'departure' ? 'đi làm' : 'tan làm'} (~${timeStr}), ${actionText}`);
      } else if (rainAmount > 0.5) { // Mưa nhẹ
        const actionText = type === 'departure' ? 'nên mang ô' : 'có thể cần ô';
        warnings.push(`Có mưa tại ${locationName} lúc ${type === 'departure' ? 'đi làm' : 'tan làm'} (~${timeStr}), ${actionText}`);
      }

      // 2. Nhiệt độ cực đoan
      const temp = closestForecast.main.temp;
      if (temp <= 15) { // Quá lạnh
        const actionText = type === 'departure' ? 'nhớ mặc ấm' : 'chuẩn bị áo khoác từ nhà';
        warnings.push(`Trời rất lạnh tại ${locationName} lúc ${type === 'departure' ? 'đi làm' : 'tan làm'} (~${timeStr}): ${Math.round(temp)}°C, ${actionText}`);
      } else if (temp >= 37) { // Quá nóng
        const actionText = type === 'departure' ? 'nhớ mang nước và che nắng' : 'chuẩn bị nước uống từ nhà';
        warnings.push(`Trời rất nóng tại ${locationName} lúc ${type === 'departure' ? 'đi làm' : 'tan làm'} (~${timeStr}): ${Math.round(temp)}°C, ${actionText}`);
      }

      // 3. Gió mạnh
      const windSpeed = closestForecast.wind?.speed || 0;
      if (windSpeed > 10) { // Gió mạnh > 10 m/s (36 km/h)
        const actionText = type === 'departure' ? 'cẩn thận khi di chuyển' : 'lưu ý an toàn khi về';
        warnings.push(`Gió mạnh tại ${locationName} lúc ${type === 'departure' ? 'đi làm' : 'tan làm'} (~${timeStr}): ${Math.round(windSpeed * 3.6)} km/h, ${actionText}`);
      }

      // 4. Tuyết (hiếm ở VN nhưng vẫn check)
      const snowAmount = closestForecast.snow?.['3h'] || 0;
      if (snowAmount > 0) {
        const actionText = type === 'departure' ? 'cực kỳ cẩn thận' : 'tránh di chuyển nếu có thể';
        warnings.push(`Có tuyết tại ${locationName} lúc ${type === 'departure' ? 'đi làm' : 'tan làm'} (~${timeStr}), ${actionText}`);
      }

      // 5. Độ ẩm cực cao (cảm giác ngột ngạt)
      const humidity = closestForecast.main.humidity;
      if (humidity > 90 && temp > 30) {
        const actionText = type === 'departure' ? 'mang theo khăn và nước' : 'chuẩn bị khăn lạnh từ nhà';
        warnings.push(`Thời tiết ngột ngạt tại ${locationName} lúc ${type === 'departure' ? 'đi làm' : 'tan làm'} (~${timeStr}): ${humidity}% độ ẩm, ${actionText}`);
      }

      return warnings.length > 0 ? warnings.join('. ') : null;

    } catch (error) {
      console.error('Error analyzing weather for time and location:', error);
      return null;
    }
  }

  /**
   * ✅ Format cảnh báo thời tiết cực đoan thành message hoàn chỉnh
   */
  private formatExtremeWeatherWarning(warnings: string[]): string {
    if (warnings.length === 0) {
      return '';
    }

    if (warnings.length === 1) {
      return `⚠️ Cảnh báo thời tiết: ${warnings[0]}`;
    }

    // Tách warnings thành departure và return
    const departureWarnings = warnings.filter(w => w.includes('đi làm'));
    const returnWarnings = warnings.filter(w => w.includes('tan làm'));

    let message = '⚠️ Cảnh báo thời tiết: ';

    if (departureWarnings.length > 0) {
      message += departureWarnings.join('. ');
    }

    if (returnWarnings.length > 0) {
      if (departureWarnings.length > 0) {
        message += '. Lưu ý: ';
      }
      message += returnWarnings.join('. ');
    }

    return message;
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
      if (!settings.weatherWarningEnabled || !settings.weatherLocation) {
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
