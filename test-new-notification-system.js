/**
 * 🧪 Test Script cho Hệ thống Notification mới
 * Chạy trong console để test việc hoạt động của notificationScheduler
 */

console.log('🧪 Loading New Notification System Test...');

// Test functions
const testNewNotificationSystem = async () => {
  console.log('\n🔍 === TEST NEW NOTIFICATION SYSTEM ===');
  
  try {
    // Import services
    const { notificationScheduler } = await import('./src/services/notificationScheduler');
    const { ShiftDebugLogger } = await import('./src/utils/shiftDebugLogger');
    
    console.log('📱 1. Initializing notification scheduler...');
    await notificationScheduler.initialize();
    
    console.log('🧹 2. Testing cleanup...');
    await notificationScheduler.cleanupAllNotifications();
    
    console.log('📋 3. Getting notification status...');
    const status = notificationScheduler.getNotificationStatus();
    console.log('Status:', status);
    
    console.log('🔍 4. Can schedule notifications?', notificationScheduler.canScheduleNotifications());
    
    console.log('📊 5. Getting debug logs...');
    const logs = ShiftDebugLogger.getLogs();
    console.log(`Found ${logs.length} debug entries`);
    
    // Display recent logs
    logs.slice(0, 5).forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      console.log(`  [${timestamp}] ${log.category}: ${log.message}`);
    });
    
    console.log('✅ New notification system test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Test với ca mẫu
const testWithSampleShift = async () => {
  console.log('\n🧪 === TESTING WITH SAMPLE SHIFT ===');
  
  const testShift = {
    id: 'test_new_system',
    name: 'Test Ca Mới',
    startTime: '08:00',
    endTime: '17:00',
    departureTime: '07:30',
    remindBeforeStart: 15,
    remindAfterEnd: 10,
    isNightShift: false,
    workDays: [1, 2, 3, 4, 5]
  };
  
  const nightShift = {
    id: 'test_night_new',
    name: 'Test Ca Đêm Mới',
    startTime: '22:00',
    endTime: '06:30',
    departureTime: '21:15',
    remindBeforeStart: 20,
    remindAfterEnd: 15,
    isNightShift: true,
    workDays: [1, 2, 3, 4, 5, 6]
  };
  
  try {
    const { notificationScheduler } = await import('./src/services/notificationScheduler');
    const { ShiftDebugLogger } = await import('./src/utils/shiftDebugLogger');
    
    console.log('☀️ Testing day shift...');
    await notificationScheduler.scheduleShiftNotifications(testShift);
    
    console.log('🌙 Testing night shift...');
    await notificationScheduler.scheduleShiftNotifications(nightShift);
    
    console.log('📋 Debug scheduled notifications...');
    await notificationScheduler.debugScheduledNotifications();
    
    console.log('📊 Debug logs summary:');
    const logs = ShiftDebugLogger.getLogs();
    const categories = ['shift_change', 'notification', 'cleanup', 'timing', 'validation'];
    
    categories.forEach(category => {
      const categoryLogs = logs.filter(log => log.category === category);
      console.log(`  ${category}: ${categoryLogs.length} entries`);
    });
    
    console.log('✅ Sample shift testing completed');
    
  } catch (error) {
    console.error('❌ Sample shift testing failed:', error);
  }
};

// Test timing calculations
const testTimingCalculations = () => {
  console.log('\n⏰ === TESTING TIMING CALCULATIONS ===');
  
  const now = new Date();
  console.log(`Current time: ${now.toLocaleString()}`);
  
  // Test night shift timing
  console.log('\n🌙 Night Shift Timing Test:');
  const nightShift = {
    departureTime: '21:15',
    startTime: '22:00',
    endTime: '06:30',
    remindBeforeStart: 20,
    remindAfterEnd: 15,
    isNightShift: true
  };
  
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };
  
  const createDateTime = (date, timeStr, addDays = 0) => {
    const { hours, minutes } = parseTime(timeStr);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    if (addDays !== 0) {
      result.setDate(result.getDate() + addDays);
    }
    return result;
  };
  
  const today = new Date();
  
  // Departure
  const departureTime = createDateTime(today, nightShift.departureTime);
  console.log(`  Departure: ${nightShift.departureTime} → ${departureTime.toLocaleString()}`);
  console.log(`  Is future: ${departureTime > now ? '✅' : '❌'}`);
  console.log(`  Hours from now: ${((departureTime.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(2)}`);
  
  // Check-in
  const checkinTime = createDateTime(today, nightShift.startTime);
  checkinTime.setMinutes(checkinTime.getMinutes() - nightShift.remindBeforeStart);
  console.log(`  Check-in reminder: ${checkinTime.toLocaleString()}`);
  console.log(`  Is future: ${checkinTime > now ? '✅' : '❌'}`);
  console.log(`  Hours from now: ${((checkinTime.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(2)}`);
  
  // Check-out (night shift: +1 day)
  const checkoutTime = createDateTime(today, nightShift.endTime, 1); // +1 day for night shift
  checkoutTime.setMinutes(checkoutTime.getMinutes() + nightShift.remindAfterEnd);
  console.log(`  Check-out reminder: ${checkoutTime.toLocaleString()}`);
  console.log(`  Is future: ${checkoutTime > now ? '✅' : '❌'}`);
  console.log(`  Hours from now: ${((checkoutTime.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(2)}`);
  
  console.log('✅ Timing calculations completed');
};

// Test notification features
const testNotificationFeatures = async () => {
  console.log('\n🔔 === TESTING NOTIFICATION FEATURES ===');
  
  try {
    const { notificationScheduler } = await import('./src/services/notificationScheduler');
    
    console.log('🧪 Testing test notification...');
    await notificationScheduler.testNotification();
    
    console.log('🔄 Testing rotation notification...');
    await notificationScheduler.scheduleShiftRotationNotification('Ca Cũ', 'Ca Mới');
    
    console.log('🌤️ Testing weather warning...');
    await notificationScheduler.scheduleImmediateWeatherWarning('Trời mưa to, cẩn thận khi đi làm!', 'Hà Nội');
    
    console.log('📅 Testing weekly reminder...');
    const nextSaturday = new Date();
    nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay()));
    nextSaturday.setHours(22, 0, 0, 0);
    await notificationScheduler.scheduleWeeklyShiftReminder(nextSaturday);
    
    console.log('📋 Final debug...');
    await notificationScheduler.debugScheduledNotifications();
    
    console.log('✅ Notification features testing completed');
    
  } catch (error) {
    console.error('❌ Notification features testing failed:', error);
  }
};

// Export logs
const exportDebugLogs = async () => {
  console.log('\n📤 === EXPORTING DEBUG LOGS ===');
  
  try {
    const { ShiftDebugLogger } = await import('./src/utils/shiftDebugLogger');
    const logsText = ShiftDebugLogger.exportLogsAsText();
    
    console.log('📋 Debug Logs Export:');
    console.log('='.repeat(50));
    console.log(logsText);
    console.log('='.repeat(50));
    
    // Copy to clipboard if available
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(logsText);
      console.log('📋 Logs copied to clipboard');
    }
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
};

// Make functions available globally
if (typeof global !== 'undefined') {
  global.testNewNotificationSystem = testNewNotificationSystem;
  global.testWithSampleShift = testWithSampleShift;
  global.testTimingCalculations = testTimingCalculations;
  global.testNotificationFeatures = testNotificationFeatures;
  global.exportDebugLogs = exportDebugLogs;
}

// Display available functions
console.log(`
🧪 New Notification System Test Functions Available:

📋 Basic Tests:
- testNewNotificationSystem() - Test basic functionality
- testTimingCalculations() - Test timing logic

🧪 Advanced Tests:
- testWithSampleShift() - Test with sample shifts
- testNotificationFeatures() - Test all notification features

📊 Logs Management:
- exportDebugLogs() - Export all debug logs

Example usage:
await testNewNotificationSystem();
await testWithSampleShift();
testTimingCalculations();
await testNotificationFeatures();
`);

// Auto-run basic test
testNewNotificationSystem();
