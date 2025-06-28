/**
 * ✅ Optimized Imports Utility
 * Tối ưu hóa imports để giảm bundle size và tăng tốc độ loading
 */

// ✅ Dynamic imports cho các services nặng
export const loadWeatherService = () => import('../services/weather');
export const loadReminderSyncService = () => import('../services/reminderSync');
export const loadAutoModeService = () => import('../services/autoMode');

// ✅ Dynamic imports cho các components nặng
export const loadWeatherWidget = () => import('../components/WeatherWidget');
export const loadAttendanceHistory = () => import('../components/AttendanceHistory');

// ✅ Optimized date-fns imports - chỉ import những gì cần thiết để giảm bundle size
export { format } from 'date-fns/format';
export { startOfWeek } from 'date-fns/startOfWeek';
export { endOfWeek } from 'date-fns/endOfWeek';
export { addDays } from 'date-fns/addDays';
export { subDays } from 'date-fns/subDays';
export { isToday } from 'date-fns/isToday';
export { isSameDay } from 'date-fns/isSameDay';
export { parseISO } from 'date-fns/parseISO';
export { isValid } from 'date-fns/isValid';
export { addMinutes } from 'date-fns/addMinutes';
export { differenceInMinutes } from 'date-fns/differenceInMinutes';
export { isPast } from 'date-fns/isPast';
export { isFuture } from 'date-fns/isFuture';

// ✅ Optimized locale imports
export { vi } from 'date-fns/locale/vi';
export { enUS } from 'date-fns/locale/en-US';

// ✅ Optimized icon imports - lazy load icons
export const loadIcon = (iconName: string) => {
  // Chỉ load icon khi cần thiết
  return import('@expo/vector-icons/MaterialCommunityIcons').then(module => {
    const Icon = module.default;
    return Icon;
  });
};

// ✅ Preload critical services only
export const preloadCriticalServices = async () => {
  const criticalServices = await Promise.allSettled([
    import('../services/storage'),
    import('../services/notifications'),
    import('../services/workManager'),
  ]);
  
  return criticalServices;
};

// ✅ Lazy load non-critical services
export const loadNonCriticalServices = () => {
  return Promise.allSettled([
    loadWeatherService(),
    loadReminderSyncService(),
    loadAutoModeService(),
  ]);
};
