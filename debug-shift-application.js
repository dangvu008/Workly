/**
 * 🔧 Debug Script cho Shift Application
 * Chạy trong console để test việc áp dụng ca và notifications
 */

// Import debug utilities
console.log('🔧 Loading Shift Debug Utilities...');

// Test functions
const debugShiftApplication = async () => {
  console.log('\n🔍 === DEBUG SHIFT APPLICATION ===');
  
  try {
    // Import services
    const { ShiftDebugLogger } = await import('./src/utils/shiftDebugLogger');
    const { notificationScheduler } = await import('./src/services/notificationScheduler');
    
    console.log('📱 1. Initializing services...');
    await notificationScheduler.initialize();
    
    console.log('🧹 2. Cleaning up existing notifications...');
    await notificationScheduler.cleanupAllNotifications();
    
    console.log('📋 3. Getting current debug logs...');
    const logs = ShiftDebugLogger.getLogs();
    console.log(`Found ${logs.length} debug entries`);
    
    // Display recent logs
    logs.slice(0, 10).forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      console.log(`  [${timestamp}] ${log.category}: ${log.message}`);
    });
    
    console.log('✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Test với ca mẫu
const testWithSampleShifts = async () => {
  console.log('\n🧪 === TESTING WITH SAMPLE SHIFTS ===');
  
  const nightShift = {
    id: 'debug_night_shift',
    name: 'Debug Ca Đêm',
    startTime: '22:00',
    endTime: '06:30',
    departureTime: '21:15',
    remindBeforeStart: 20,
    remindAfterEnd: 15,
    isNightShift: true,
    workDays: [1, 2, 3, 4, 5, 6]
  };
  
  const dayShift = {
    id: 'debug_day_shift',
    name: 'Debug Ca Ngày',
    startTime: '08:00',
    endTime: '17:00',
    departureTime: '07:15',
    remindBeforeStart: 15,
    remindAfterEnd: 10,
    isNightShift: false,
    workDays: [1, 2, 3, 4, 5]
  };
  
  try {
    const { notificationScheduler } = await import('./src/services/notificationScheduler');
    const { ShiftDebugLogger } = await import('./src/utils/shiftDebugLogger');
    
    console.log('🌙 Testing night shift...');
    await notificationScheduler.scheduleShiftNotifications(nightShift);
    
    console.log('☀️ Testing day shift...');
    await notificationScheduler.scheduleShiftNotifications(dayShift);
    
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

// Clear all logs
const clearDebugLogs = async () => {
  console.log('\n🗑️ === CLEARING DEBUG LOGS ===');
  
  try {
    const { ShiftDebugLogger } = await import('./src/utils/shiftDebugLogger');
    ShiftDebugLogger.clearLogs();
    console.log('✅ Debug logs cleared');
    
  } catch (error) {
    console.error('❌ Clear failed:', error);
  }
};

// Test timing calculations
const testTimingCalculations = () => {
  console.log('\n⏰ === TESTING TIMING CALCULATIONS ===');
  
  const now = new Date();
  console.log(`Current time: ${now.toLocaleString()}`);
  
  // Test night shift timing
  console.log('\n🌙 Night Shift Timing:');
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
  
  // Departure
  const departureTime = parseTime(nightShift.departureTime);
  const departureDateTime = new Date();
  departureDateTime.setHours(departureTime.hours, departureTime.minutes, 0, 0);
  
  console.log(`  Departure: ${nightShift.departureTime} → ${departureDateTime.toLocaleString()}`);
  console.log(`  Is future: ${departureDateTime > now ? '✅' : '❌'}`);
  console.log(`  Hours from now: ${((departureDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(2)}`);
  
  // Check-in
  const startTime = parseTime(nightShift.startTime);
  const checkinDateTime = new Date();
  checkinDateTime.setHours(startTime.hours, startTime.minutes - nightShift.remindBeforeStart, 0, 0);
  
  console.log(`  Check-in reminder: ${checkinDateTime.toLocaleString()}`);
  console.log(`  Is future: ${checkinDateTime > now ? '✅' : '❌'}`);
  console.log(`  Hours from now: ${((checkinDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(2)}`);
  
  // Check-out
  const endTime = parseTime(nightShift.endTime);
  const checkoutDateTime = new Date();
  checkoutDateTime.setHours(endTime.hours, endTime.minutes + nightShift.remindAfterEnd, 0, 0);
  
  // Add 1 day for night shift
  if (nightShift.isNightShift) {
    checkoutDateTime.setDate(checkoutDateTime.getDate() + 1);
  }
  
  console.log(`  Check-out reminder: ${checkoutDateTime.toLocaleString()}`);
  console.log(`  Is future: ${checkoutDateTime > now ? '✅' : '❌'}`);
  console.log(`  Hours from now: ${((checkoutDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(2)}`);
  
  console.log('✅ Timing calculations completed');
};

// Make functions available globally
if (typeof global !== 'undefined') {
  global.debugShiftApplication = debugShiftApplication;
  global.testWithSampleShifts = testWithSampleShifts;
  global.exportDebugLogs = exportDebugLogs;
  global.clearDebugLogs = clearDebugLogs;
  global.testTimingCalculations = testTimingCalculations;
}

// Display available functions
console.log(`
🔧 Shift Debug Functions Available:

📋 Basic Debug:
- debugShiftApplication() - Debug current state
- testTimingCalculations() - Test timing logic

🧪 Testing:
- testWithSampleShifts() - Test with sample shifts

📊 Logs Management:
- exportDebugLogs() - Export all debug logs
- clearDebugLogs() - Clear all debug logs

Example usage:
await debugShiftApplication();
await testWithSampleShifts();
testTimingCalculations();
`);

// Auto-run basic debug
debugShiftApplication();
