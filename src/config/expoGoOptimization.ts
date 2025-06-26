/**
 * ✅ Expo Go Optimization Configuration
 * Tối ưu hóa ứng dụng để chạy nhanh hơn trên Expo Go
 */

import { isExpoGo } from '../utils/expoGoCompat';

// ✅ Feature flags cho Expo Go
export const EXPO_GO_CONFIG = {
  // Disable heavy features
  DISABLE_AUDIO_SERVICES: false, // ✅ Enable alarm service với fallback alert
  DISABLE_WEATHER_SERVICE: isExpoGo(),
  DISABLE_AUTO_MODE: false, // ✅ Auto mode có thể chạy trên Expo Go
  DISABLE_HEAVY_ANIMATIONS: isExpoGo(),
  DISABLE_BACKGROUND_SERVICES: isExpoGo(),
  
  // Reduce bundle size
  USE_MINIMAL_IMPORTS: isExpoGo(),
  LAZY_LOAD_EVERYTHING: isExpoGo(),
  DISABLE_DEBUG_LOGS: isExpoGo(),
  
  // Performance optimizations
  REDUCE_RENDER_FREQUENCY: isExpoGo(),
  MINIMAL_INITIAL_LOAD: isExpoGo(),
  SKIP_NON_CRITICAL_INIT: isExpoGo(),
};

// ✅ Lightweight fallback components cho Expo Go
export const getOptimizedComponent = (componentName: string) => {
  if (!isExpoGo()) return null;
  
  switch (componentName) {
    case 'WeatherWidget':
      return () => null; // Disable weather widget
    case 'AttendanceHistory':
      return () => null; // Disable attendance history
    case 'AlarmService':
      return null; // Disable alarm service
    default:
      return null;
  }
};

// ✅ Optimized imports cho Expo Go
export const shouldLoadService = (serviceName: string): boolean => {
  if (!isExpoGo()) return true;
  
  const disabledServices = [
    // 'alarmService', // ✅ Enable alarm service với fallback alert trên Expo Go
    'weatherService',
    // 'autoModeService', // ✅ Auto mode service có thể chạy trên Expo Go
    // 'reminderSyncService' // ✅ Enable reminder sync để alarms hoạt động
  ];
  
  return !disabledServices.includes(serviceName);
};

// ✅ Bundle size optimization
export const getMinimalDependencies = () => {
  if (!isExpoGo()) return {};
  
  return {
    // Chỉ load những dependencies thực sự cần thiết
    'expo-audio': false,
    'expo-av': false,
    'expo-location': false,
    'react-native-modal': false,
  };
};

// ✅ Performance settings cho Expo Go
export const EXPO_GO_PERFORMANCE = {
  // Giảm frequency của các tác vụ định kỳ
  REFRESH_INTERVAL: isExpoGo() ? 300000 : 60000, // 5 phút thay vì 1 phút
  
  // Giảm số lượng concurrent operations
  MAX_CONCURRENT_OPERATIONS: isExpoGo() ? 2 : 5,
  
  // Disable animations phức tạp
  ENABLE_COMPLEX_ANIMATIONS: !isExpoGo(),
  
  // Giảm cache size
  MAX_CACHE_SIZE: isExpoGo() ? 50 : 200,
};

console.log('🔧 Expo Go Optimization:', {
  isExpoGo: isExpoGo(),
  config: EXPO_GO_CONFIG,
  performance: EXPO_GO_PERFORMANCE
});
