/**
 * 🧪 Script test notifications nhanh
 * Chạy trong console của app để test logic mới
 */

// Test ca đêm mẫu
const testNightShift = {
  id: 'test_night_shift',
  name: 'Ca Test Đêm',
  startTime: '22:00',
  endTime: '06:30',
  officeEndTime: '06:00',
  departureTime: '21:15',
  remindBeforeStart: 20,
  remindAfterEnd: 15,
  isNightShift: true,
  workDays: [1, 2, 3, 4, 5, 6],
  daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  showPunch: true,
  breakMinutes: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Test ca ngày mẫu
const testDayShift = {
  id: 'test_day_shift',
  name: 'Ca Test Ngày',
  startTime: '08:00',
  endTime: '17:00',
  officeEndTime: '17:00',
  departureTime: '07:15',
  remindBeforeStart: 15,
  remindAfterEnd: 10,
  isNightShift: false,
  workDays: [1, 2, 3, 4, 5],
  daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  showPunch: false,
  breakMinutes: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Hàm test chính
async function testNotificationSystem() {
  console.log('🧪 === TESTING NOTIFICATION SYSTEM ===');
  
  try {
    // Import services
    const { notificationScheduler } = await import('./src/services/notificationScheduler');
    
    console.log('📱 1. Initializing notification scheduler...');
    await notificationScheduler.initialize();
    
    console.log('🧹 2. Cleaning up all notifications...');
    await notificationScheduler.cleanupAllNotifications();
    
    console.log('📅 3. Testing day shift scheduling...');
    await notificationScheduler.scheduleShiftNotifications(testDayShift);
    
    console.log('📋 4. Debug day shift notifications...');
    await notificationScheduler.debugScheduledNotifications();
    
    console.log('🧹 5. Cleaning up again...');
    await notificationScheduler.cleanupAllNotifications();
    
    console.log('🌙 6. Testing night shift scheduling...');
    await notificationScheduler.scheduleShiftNotifications(testNightShift);
    
    console.log('📋 7. Debug night shift notifications...');
    await notificationScheduler.debugScheduledNotifications();
    
    console.log('✅ === TEST COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Hàm test cleanup
async function testCleanup() {
  console.log('🧹 === TESTING CLEANUP ===');
  
  try {
    const { notificationScheduler } = await import('./src/services/notificationScheduler');
    await notificationScheduler.cleanupAllNotifications();
    console.log('✅ Cleanup completed');
    
    await notificationScheduler.debugScheduledNotifications();
  } catch (error) {
    console.error('❌ Cleanup test failed:', error);
  }
}

// Hàm test timing logic
function testTimingLogic() {
  console.log('⏰ === TESTING TIMING LOGIC ===');
  
  const now = new Date();
  console.log(`Current time: ${now.toLocaleString()}`);
  
  // Test với ca đêm
  console.log('\n🌙 Night Shift Timing:');
  const nightShift = testNightShift;
  
  // Parse times
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };
  
  // Departure time
  const departureTime = parseTime(nightShift.departureTime);
  const departureDateTime = new Date();
  departureDateTime.setHours(departureTime.hours, departureTime.minutes, 0, 0);
  
  console.log(`  Departure: ${nightShift.departureTime} → ${departureDateTime.toLocaleString()}`);
  console.log(`  Is future: ${departureDateTime > now ? '✅' : '❌'}`);
  
  // Check-in time
  const startTime = parseTime(nightShift.startTime);
  const checkinTime = new Date();
  checkinTime.setHours(startTime.hours, startTime.minutes - nightShift.remindBeforeStart, 0, 0);
  
  console.log(`  Check-in reminder: ${checkinTime.toLocaleString()}`);
  console.log(`  Is future: ${checkinTime > now ? '✅' : '❌'}`);
  
  // Check-out time
  const endTime = parseTime(nightShift.endTime);
  const checkoutTime = new Date();
  checkoutTime.setHours(endTime.hours, endTime.minutes + nightShift.remindAfterEnd, 0, 0);
  
  // Add 1 day for night shift
  if (nightShift.isNightShift) {
    checkoutTime.setDate(checkoutTime.getDate() + 1);
  }
  
  console.log(`  Check-out reminder: ${checkoutTime.toLocaleString()}`);
  console.log(`  Is future: ${checkoutTime > now ? '✅' : '❌'}`);
  
  console.log('\n☀️ Day Shift Timing:');
  const dayShift = testDayShift;
  
  // Similar logic for day shift...
  const dayDepartureTime = parseTime(dayShift.departureTime);
  const dayDepartureDateTime = new Date();
  dayDepartureDateTime.setHours(dayDepartureTime.hours, dayDepartureTime.minutes, 0, 0);
  
  console.log(`  Departure: ${dayShift.departureTime} → ${dayDepartureDateTime.toLocaleString()}`);
  console.log(`  Is future: ${dayDepartureDateTime > now ? '✅' : '❌'}`);
}

// Export functions để có thể gọi từ console
if (typeof global !== 'undefined') {
  global.testNotificationSystem = testNotificationSystem;
  global.testCleanup = testCleanup;
  global.testTimingLogic = testTimingLogic;
  global.testNightShift = testNightShift;
  global.testDayShift = testDayShift;
}

console.log(`
🧪 Notification Test Functions Available:
- testNotificationSystem() - Full test cycle
- testCleanup() - Test cleanup only
- testTimingLogic() - Test timing calculations
- testNightShift - Night shift data
- testDayShift - Day shift data

Example usage:
await testNotificationSystem();
`);
