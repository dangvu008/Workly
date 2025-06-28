import * as Constants from 'expo-constants';

/**
 * 🔧 Expo Go Compatibility Utilities
 * 
 * Kiểm tra xem app có đang chạy trên Expo Go không
 * và disable các tính năng không tương thích
 */

/**
 * Kiểm tra xem có đang chạy trên Expo Go không
 */
export const isExpoGo = (): boolean => {
  try {
    return Constants.default?.appOwnership === 'expo' || Constants.appOwnership === 'expo';
  } catch (error) {
    console.warn('Error checking Expo Go status:', error);
    return false;
  }
};

/**
 * Kiểm tra xem có đang chạy trên Development Build không
 */
export const isDevelopmentBuild = (): boolean => {
  try {
    const ownership = Constants.default?.appOwnership || Constants.appOwnership;
    return ownership === 'standalone' || ownership === null;
  } catch (error) {
    console.warn('Error checking Development Build status:', error);
    return false;
  }
};

/**
 * Log warning về tính năng không tương thích với Expo Go
 */
export const logExpoGoWarning = (feature: string): void => {
  if (isExpoGo()) {
    console.warn(`⚠️ ${feature} is not available in Expo Go. Please use Development Build.`);
  }
};

/**
 * Wrapper cho các tính năng chỉ hoạt động trên Development Build
 */
export const withDevelopmentBuildOnly = <T>(
  feature: string,
  implementation: () => T,
  fallback?: () => T
): T | undefined => {
  if (isDevelopmentBuild()) {
    return implementation();
  } else {
    logExpoGoWarning(feature);
    return fallback ? fallback() : undefined;
  }
};

/**
 * Async wrapper cho các tính năng chỉ hoạt động trên Development Build
 */
export const withDevelopmentBuildOnlyAsync = async <T>(
  feature: string,
  implementation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T | undefined> => {
  if (isDevelopmentBuild()) {
    return await implementation();
  } else {
    logExpoGoWarning(feature);
    return fallback ? await fallback() : undefined;
  }
};

// ✅ PRODUCTION: shouldShowExpoGoBanner removed
