/**
 * 🧪 Test Current Time Comparison Logic
 */

console.log('🧪 Testing Current Time Comparison Logic');

// Mock date-fns functions for testing
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMinutes = (date, minutes) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

const format = (date, formatStr) => {
  if (formatStr === 'yyyy-MM-dd') {
    return date.toISOString().split('T')[0];
  }
  return date.toLocaleString();
};

const isAfter = (date1, date2) => {
  return date1.getTime() > date2.getTime();
};

const set = (date, { hours, minutes, seconds, milliseconds }) => {
  const result = new Date(date);
  result.setHours(hours, minutes, seconds || 0, milliseconds || 0);
  return result;
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

// ✅ Test buildTimestamp function
function buildTimestamp(baseDate, timeString, isOvernightShift) {
  const [hour, minute] = timeString.split(':').map(Number);
  const dateToUse = isOvernightShift ? addDays(baseDate, 1) : baseDate;
  return set(dateToUse, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
}

// ✅ Test notification timing calculation with current time comparison
function testCurrentTimeComparison() {
  const now = new Date();
  const today = startOfDay(new Date());
  
  console.log(`\n=== CURRENT TIME COMPARISON TEST ===`);
  console.log(`Current time: ${now.toLocaleString()}`);
  console.log(`Today (start of day): ${today.toLocaleString()}`);

  // Test different scenarios
  const testCases = [
    {
      name: 'Past Time (1 hour ago)',
      time: addMinutes(now, -60),
      expected: false
    },
    {
      name: 'Current Time',
      time: now,
      expected: false
    },
    {
      name: 'Near Future (30 minutes)',
      time: addMinutes(now, 30),
      expected: true
    },
    {
      name: 'Future (2 hours)',
      time: addMinutes(now, 120),
      expected: true
    },
    {
      name: 'Tomorrow Same Time',
      time: addDays(now, 1),
      expected: true
    }
  ];

  testCases.forEach(testCase => {
    const isFuture = isAfter(testCase.time, now);
    const hoursFromNow = (testCase.time.getTime() - now.getTime()) / (1000 * 60 * 60);
    const status = isFuture === testCase.expected ? '✅ PASS' : '❌ FAIL';
    
    console.log(`\n${testCase.name}:`);
    console.log(`  Time: ${testCase.time.toLocaleString()}`);
    console.log(`  Hours from now: ${hoursFromNow.toFixed(2)}`);
    console.log(`  Is future: ${isFuture} (expected: ${testCase.expected})`);
    console.log(`  Result: ${status}`);
  });
}

// ✅ Test shift notification timing with current time
function testShiftNotificationTiming() {
  const now = new Date();
  const today = startOfDay(new Date());
  
  console.log(`\n=== SHIFT NOTIFICATION TIMING TEST ===`);
  console.log(`Current time: ${now.toLocaleString()}`);

  // Test night shift
  const nightShift = {
    name: 'Night Shift',
    startTime: '22:00',
    endTime: '06:00',
    departureTime: '21:30',
    remindBeforeStart: 15,
    remindAfterEnd: 10
  };

  // Test day shift
  const dayShift = {
    name: 'Day Shift',
    startTime: '08:00',
    endTime: '17:00',
    departureTime: '07:30',
    remindBeforeStart: 15,
    remindAfterEnd: 10
  };

  [nightShift, dayShift].forEach(shift => {
    console.log(`\n--- Testing ${shift.name} ---`);
    
    // Detect overnight shift
    const parseTimeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = parseTimeToMinutes(shift.startTime);
    const endMinutes = parseTimeToMinutes(shift.endTime);
    const isOvernightShift = endMinutes < startMinutes;
    
    console.log(`Is overnight: ${isOvernightShift}`);
    
    // Build timestamps
    const scheduledStartTime = buildTimestamp(today, shift.startTime, false);
    const scheduledEndTime = buildTimestamp(today, shift.endTime, isOvernightShift);
    const scheduledDepartureTime = buildTimestamp(today, shift.departureTime, false);
    
    console.log(`Timestamps:`);
    console.log(`  Start: ${scheduledStartTime.toLocaleString()}`);
    console.log(`  End: ${scheduledEndTime.toLocaleString()}`);
    console.log(`  Departure: ${scheduledDepartureTime.toLocaleString()}`);
    
    // Test each notification type
    const notifications = [
      {
        name: 'Departure',
        time: scheduledDepartureTime
      },
      {
        name: 'Check-in',
        time: addMinutes(scheduledStartTime, -(shift.remindBeforeStart || 15))
      },
      {
        name: 'Check-out',
        time: addMinutes(scheduledEndTime, shift.remindAfterEnd || 10)
      }
    ];
    
    notifications.forEach(notification => {
      const isFuture = isAfter(notification.time, now);
      const hoursFromNow = (notification.time.getTime() - now.getTime()) / (1000 * 60 * 60);
      const status = isFuture ? '✅ SCHEDULE' : '❌ SKIP';
      
      console.log(`  ${notification.name}: ${notification.time.toLocaleString()} - ${status} (${hoursFromNow.toFixed(2)}h)`);
    });
  });
}

// ✅ Test edge cases
function testEdgeCases() {
  const now = new Date();
  
  console.log(`\n=== EDGE CASES TEST ===`);
  console.log(`Current time: ${now.toLocaleString()}`);
  
  // Test times very close to current time
  const edgeCases = [
    { name: '1 second ago', offset: -1 },
    { name: '1 second future', offset: 1 },
    { name: '1 minute ago', offset: -60 },
    { name: '1 minute future', offset: 60 },
    { name: '5 minutes future', offset: 300 },
    { name: '10 minutes future', offset: 600 }
  ];
  
  edgeCases.forEach(testCase => {
    const testTime = new Date(now.getTime() + testCase.offset * 1000);
    const isFuture = isAfter(testTime, now);
    const secondsFromNow = (testTime.getTime() - now.getTime()) / 1000;
    const status = isFuture ? '✅ FUTURE' : '❌ PAST';
    
    console.log(`${testCase.name}: ${testTime.toLocaleString()} - ${status} (${secondsFromNow.toFixed(1)}s)`);
  });
}

// Run all tests
testCurrentTimeComparison();
testShiftNotificationTiming();
testEdgeCases();

console.log('\n✅ === TESTING COMPLETED ===');
console.log('Key improvements:');
console.log('- ✅ Using isAfter(scheduledTime, now) for precise comparison');
console.log('- ✅ Showing hours/minutes from current time');
console.log('- ✅ Proper handling of edge cases near current time');
console.log('- ✅ Accurate future time validation');
