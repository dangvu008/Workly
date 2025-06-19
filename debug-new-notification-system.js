/**
 * 🧪 Debug Script cho Hệ thống Notification mới
 * Chạy trong console của React Native app
 */

console.log('🧪 Loading New Notification System Debug...');

// Test functions để chạy trong React Native console
const debugNewNotificationSystem = async () => {
  console.log('\n🔍 === DEBUG NEW NOTIFICATION SYSTEM ===');
  
  try {
    // Import từ global hoặc require
    const { notificationScheduler } = require('./src/services/notificationScheduler');
    const { ShiftDebugLogger } = require('./src/utils/shiftDebugLogger');
    
    console.log('📱 1. Initializing notification scheduler...');
    await notificationScheduler.initialize();
    
    console.log('📋 2. Getting notification status...');
    const status = notificationScheduler.getNotificationStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    
    console.log('🔍 3. Can schedule notifications?', notificationScheduler.canScheduleNotifications());
    
    console.log('🧹 4. Testing cleanup...');
    await notificationScheduler.cleanupAllNotifications();
    
    console.log('📊 5. Getting debug logs...');
    const logs = ShiftDebugLogger.getLogs();
    console.log(`Found ${logs.length} debug entries`);
    
    // Display recent logs
    logs.slice(0, 3).forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      console.log(`  [${timestamp}] ${log.category}: ${log.message}`);
    });
    
    console.log('✅ New notification system debug completed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Test timing calculations (không cần import)
const debugTimingCalculations = () => {
  console.log('\n⏰ === DEBUG TIMING CALCULATIONS ===');
  
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
  
  console.log('\n☀️ Day Shift Timing Test:');
  const dayShift = {
    departureTime: '07:30',
    startTime: '08:00',
    endTime: '17:00',
    remindBeforeStart: 15,
    remindAfterEnd: 10,
    isNightShift: false
  };
  
  // Day shift departure
  const dayDepartureTime = createDateTime(today, dayShift.departureTime);
  console.log(`  Departure: ${dayShift.departureTime} → ${dayDepartureTime.toLocaleString()}`);
  console.log(`  Is future: ${dayDepartureTime > now ? '✅' : '❌'}`);
  
  // Day shift check-in
  const dayCheckinTime = createDateTime(today, dayShift.startTime);
  dayCheckinTime.setMinutes(dayCheckinTime.getMinutes() - dayShift.remindBeforeStart);
  console.log(`  Check-in reminder: ${dayCheckinTime.toLocaleString()}`);
  console.log(`  Is future: ${dayCheckinTime > now ? '✅' : '❌'}`);
  
  // Day shift check-out (NO +1 day)
  const dayCheckoutTime = createDateTime(today, dayShift.endTime);
  dayCheckoutTime.setMinutes(dayCheckoutTime.getMinutes() + dayShift.remindAfterEnd);
  console.log(`  Check-out reminder: ${dayCheckoutTime.toLocaleString()}`);
  console.log(`  Is future: ${dayCheckoutTime > now ? '✅' : '❌'}`);
  
  console.log('✅ Timing calculations completed');
};

// Test với ca mẫu
const debugWithSampleShift = async () => {
  console.log('\n🧪 === DEBUG WITH SAMPLE SHIFT ===');
  
  const testShift = {
    id: 'debug_test_shift',
    name: 'Debug Test Shift',
    startTime: '08:00',
    endTime: '17:00',
    departureTime: '07:30',
    remindBeforeStart: 15,
    remindAfterEnd: 10,
    isNightShift: false,
    workDays: [1, 2, 3, 4, 5] // Mon-Fri
  };
  
  try {
    const { notificationScheduler } = require('./src/services/notificationScheduler');
    const { ShiftDebugLogger } = require('./src/utils/shiftDebugLogger');
    
    console.log('☀️ Testing day shift scheduling...');
    await notificationScheduler.scheduleShiftNotifications(testShift);
    
    console.log('📋 Debug scheduled notifications...');
    await notificationScheduler.debugScheduledNotifications();
    
    console.log('📊 Debug logs summary:');
    const logs = ShiftDebugLogger.getLogs();
    const categories = ['notification', 'cleanup', 'timing', 'validation'];
    
    categories.forEach(category => {
      const categoryLogs = logs.filter(log => log.category === category);
      console.log(`  ${category}: ${categoryLogs.length} entries`);
      
      // Show latest log for each category
      if (categoryLogs.length > 0) {
        const latest = categoryLogs[0];
        console.log(`    Latest: ${latest.message}`);
      }
    });
    
    console.log('✅ Sample shift debug completed');
    
  } catch (error) {
    console.error('❌ Sample shift debug failed:', error);
  }
};

// Test night shift
const debugNightShift = async () => {
  console.log('\n🌙 === DEBUG NIGHT SHIFT ===');
  
  const nightShift = {
    id: 'debug_night_shift',
    name: 'Debug Night Shift',
    startTime: '22:00',
    endTime: '06:30',
    departureTime: '21:15',
    remindBeforeStart: 20,
    remindAfterEnd: 15,
    isNightShift: true,
    workDays: [1, 2, 3, 4, 5, 6] // Mon-Sat
  };
  
  try {
    const { notificationScheduler } = require('./src/services/notificationScheduler');
    const { ShiftDebugLogger } = require('./src/utils/shiftDebugLogger');
    
    console.log('🌙 Testing night shift scheduling...');
    await notificationScheduler.scheduleShiftNotifications(nightShift);
    
    console.log('📋 Debug scheduled notifications...');
    await notificationScheduler.debugScheduledNotifications();
    
    console.log('📊 Night shift specific logs:');
    const logs = ShiftDebugLogger.getLogs();
    const timingLogs = logs.filter(log => log.category === 'timing');
    
    timingLogs.slice(0, 5).forEach(log => {
      console.log(`  ${log.message}`);
      if (log.data) {
        console.log(`    Data:`, JSON.stringify(log.data, null, 2));
      }
    });
    
    console.log('✅ Night shift debug completed');
    
  } catch (error) {
    console.error('❌ Night shift debug failed:', error);
  }
};

// Export logs
const exportDebugLogs = async () => {
  console.log('\n📤 === EXPORT DEBUG LOGS ===');
  
  try {
    const { ShiftDebugLogger } = require('./src/utils/shiftDebugLogger');
    const logs = ShiftDebugLogger.getLogs();
    
    console.log(`📋 Total logs: ${logs.length}`);
    console.log('='.repeat(50));
    
    logs.slice(0, 10).forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      console.log(`${index + 1}. [${timestamp}] ${log.level.toUpperCase()} ${log.category}: ${log.message}`);
      if (log.data) {
        console.log(`   Data: ${JSON.stringify(log.data)}`);
      }
    });
    
    console.log('='.repeat(50));
    console.log('✅ Debug logs exported');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
};

// Make functions available globally for React Native console
if (typeof global !== 'undefined') {
  global.debugNewNotificationSystem = debugNewNotificationSystem;
  global.debugTimingCalculations = debugTimingCalculations;
  global.debugWithSampleShift = debugWithSampleShift;
  global.debugNightShift = debugNightShift;
  global.exportDebugLogs = exportDebugLogs;
}

// Display available functions
console.log(`
🧪 New Notification System Debug Functions:

📋 Basic Debug:
- debugNewNotificationSystem() - Test basic functionality
- debugTimingCalculations() - Test timing logic (no imports needed)

🧪 Advanced Debug:
- debugWithSampleShift() - Test with day shift
- debugNightShift() - Test with night shift

📊 Logs:
- exportDebugLogs() - Export debug logs

🎯 Usage in React Native Console:
await debugNewNotificationSystem();
debugTimingCalculations();
await debugWithSampleShift();
await debugNightShift();
await exportDebugLogs();
`);

// Auto-run timing calculations (safe to run)
debugTimingCalculations();
