/**
 * Script debug notifications - chạy trong console của app
 */

// Import debug utilities
import('./src/utils/notificationDebug.ts').then(({ NotificationDebugger }) => {
  console.log('🔧 Notification Debugger loaded');
  
  // Test với ca đêm
  NotificationDebugger.testNightShiftSample();
  
  // Kiểm tra notifications đã lập lịch
  NotificationDebugger.debugScheduledNotifications();
});

// Hoặc chạy trực tiếp trong console:
/*
// 1. Test timing logic
NotificationDebugger.testNightShiftSample();

// 2. Kiểm tra scheduled notifications
await NotificationDebugger.debugScheduledNotifications();

// 3. Force cleanup tất cả notifications
import { notificationService } from './src/services/notifications';
await notificationService.forceCleanupAllNotifications();

// 4. Test lại với ca mới
const testShift = {
  id: 'test_night',
  name: 'Ca Test Đêm',
  startTime: '22:00',
  endTime: '06:30',
  departureTime: '21:15',
  remindBeforeStart: 20,
  remindAfterEnd: 15,
  isNightShift: true,
  workDays: [1, 2, 3, 4, 5, 6]
};

await notificationService.scheduleShiftReminders(testShift);
await NotificationDebugger.debugScheduledNotifications();
*/
