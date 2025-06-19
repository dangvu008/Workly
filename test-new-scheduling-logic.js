/**
 * 🧪 Test Script cho logic scheduling mới với date-fns
 * Test overnight shift handling và future time validation
 */

const {
  addDays,
  addMinutes,
  format,
  isFuture,
  isAfter,
  set,
  startOfDay
} = require('date-fns');

console.log('🧪 Testing New Scheduling Logic with date-fns');
console.log('Current time:', new Date().toLocaleString());

// ✅ Test buildTimestamp function
function buildTimestamp(baseDate, timeString, isOvernightShift) {
  const [hour, minute] = timeString.split(':').map(Number);
  const dateToUse = isOvernightShift ? addDays(baseDate, 1) : baseDate;
  return set(dateToUse, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
}

// ✅ Test calculateNotificationTimingsForWorkday logic
function testNotificationTimings(shift, workdayDate) {
  const timings = [];
  const workdayDateString = format(workdayDate, 'yyyy-MM-dd');

  // ✅ Get current time as reference point for comparison
  const now = new Date();

  console.log(`\n=== TESTING ${shift.name} on ${workdayDateString} ===`);
  console.log(`Current time: ${now.toLocaleString()}`);
  console.log(`Shift times: ${shift.startTime} - ${shift.endTime}, departure: ${shift.departureTime}`);

  // ✅ Detect overnight shift: compare time values properly
  const parseTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = parseTimeToMinutes(shift.startTime);
  const endMinutes = parseTimeToMinutes(shift.endTime);
  const isOvernightShift = endMinutes < startMinutes; // End time is earlier in the day than start time

  console.log(`Time comparison: start=${startMinutes}min, end=${endMinutes}min, isOvernight=${isOvernightShift}`);

  // ✅ Build correct timestamps for all shift times
  const scheduledStartTime = buildTimestamp(workdayDate, shift.startTime, false); // Start is always on workday
  const scheduledEndTime = buildTimestamp(workdayDate, shift.endTime, isOvernightShift); // End may be next day
  const scheduledDepartureTime = buildTimestamp(workdayDate, shift.departureTime, false); // Departure is always on workday

  console.log('Built timestamps:');
  console.log(`  Start: ${scheduledStartTime.toLocaleString()}`);
  console.log(`  End: ${scheduledEndTime.toLocaleString()}`);
  console.log(`  Departure: ${scheduledDepartureTime.toLocaleString()}`);

  // ✅ 1. DEPARTURE REMINDER - Compare with current time
  const departureReminderTime = scheduledDepartureTime;
  const departureIsFuture = isAfter(departureReminderTime, now);
  const departureHours = (departureReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  console.log(`\n1. DEPARTURE: ${departureReminderTime.toLocaleString()} - ${departureIsFuture ? '✅ FUTURE' : '❌ PAST'} (${departureHours.toFixed(2)}h from now)`);

  if (departureIsFuture) {
    timings.push({
      id: `departure-${workdayDateString}`,
      type: 'departure',
      scheduledTime: departureReminderTime,
      title: '🚶‍♂️ Đến giờ đi làm'
    });
  }

  // ✅ 2. CHECK-IN REMINDER (before start time) - Compare with current time
  const reminderMinutes = shift.remindBeforeStart || 15;
  const checkinReminderTime = addMinutes(scheduledStartTime, -reminderMinutes);
  const checkinIsFuture = isAfter(checkinReminderTime, now);
  const checkinHours = (checkinReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  console.log(`2. CHECK-IN: ${checkinReminderTime.toLocaleString()} (${reminderMinutes}min before start) - ${checkinIsFuture ? '✅ FUTURE' : '❌ PAST'} (${checkinHours.toFixed(2)}h from now)`);

  if (checkinIsFuture) {
    timings.push({
      id: `checkin-${workdayDateString}`,
      type: 'checkin',
      scheduledTime: checkinReminderTime,
      title: '📥 Nhắc nhở chấm công vào'
    });
  }

  // ✅ 3. CHECK-OUT REMINDER (after end time) - Compare with current time
  const checkoutReminderMinutes = shift.remindAfterEnd || 10;
  const checkoutReminderTime = addMinutes(scheduledEndTime, checkoutReminderMinutes);
  const checkoutIsFuture = isAfter(checkoutReminderTime, now);
  const checkoutHours = (checkoutReminderTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // For overnight shifts, use the actual end date for the ID
  const checkoutDateString = isOvernightShift ? format(scheduledEndTime, 'yyyy-MM-dd') : workdayDateString;
  console.log(`3. CHECK-OUT: ${checkoutReminderTime.toLocaleString()} (${checkoutReminderMinutes}min after end) - ${checkoutIsFuture ? '✅ FUTURE' : '❌ PAST'} (${checkoutHours.toFixed(2)}h from now)`);
  console.log(`   Checkout ID will use date: ${checkoutDateString}`);
  
  if (checkoutIsFuture) {
    timings.push({
      id: `checkout-${checkoutDateString}`,
      type: 'checkout',
      scheduledTime: checkoutReminderTime,
      title: '📤 Nhắc nhở chấm công ra'
    });
  }

  console.log(`\nResult: ${timings.length} notifications would be scheduled`);
  timings.forEach(timing => {
    console.log(`  - ${timing.id}: ${timing.title} at ${timing.scheduledTime.toLocaleString()}`);
  });

  return timings;
}

// ✅ Test với ca đêm
console.log('\n🌙 === TESTING OVERNIGHT SHIFT ===');
const nightShift = {
  name: 'Ca Đêm Test',
  startTime: '22:00',
  endTime: '06:30',
  departureTime: '21:15',
  remindBeforeStart: 20,
  remindAfterEnd: 15,
  workDays: [1, 2, 3, 4, 5, 6]
};

// ✅ Test với ca ngày
console.log('\n☀️ === TESTING DAY SHIFT ===');
const dayShift = {
  name: 'Ca Ngày Test',
  startTime: '08:00',
  endTime: '17:00',
  departureTime: '07:30',
  remindBeforeStart: 15,
  remindAfterEnd: 10,
  workDays: [1, 2, 3, 4, 5]
};

// ✅ Test cho 3 ngày tới
const today = startOfDay(new Date());
for (let i = 0; i < 3; i++) {
  const testDate = addDays(today, i);
  const dayOfWeek = testDate.getDay();
  
  console.log(`\n📅 === DAY ${i + 1}: ${format(testDate, 'yyyy-MM-dd')} (day ${dayOfWeek}) ===`);
  
  // Test night shift
  if (nightShift.workDays.includes(dayOfWeek)) {
    testNotificationTimings(nightShift, testDate);
  } else {
    console.log(`Night shift: Skipped - not a work day`);
  }
  
  // Test day shift
  if (dayShift.workDays.includes(dayOfWeek)) {
    testNotificationTimings(dayShift, testDate);
  } else {
    console.log(`Day shift: Skipped - not a work day`);
  }
}

// ✅ Test edge cases
console.log('\n🔍 === TESTING EDGE CASES ===');

// Test với thời gian hiện tại
const now = new Date();
const currentHour = now.getHours();
const currentMinute = now.getMinutes();

console.log(`\nCurrent time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

// Test shift bắt đầu trong 1 giờ tới (ca ngày bình thường)
const soonShift = {
  name: 'Ca Sắp Bắt Đầu',
  startTime: `${(currentHour + 1) % 24}:00`,
  endTime: `${(currentHour + 9) % 24}:00`,
  departureTime: `${currentHour}:${(currentMinute + 30) % 60}`,
  remindBeforeStart: 15,
  remindAfterEnd: 10,
  workDays: [0, 1, 2, 3, 4, 5, 6] // All days
};

// Test ca đêm thực sự (22:00 - 06:00)
const realNightShift = {
  name: 'Ca Đêm Thực Sự',
  startTime: '22:00',
  endTime: '06:00',
  departureTime: '21:30',
  remindBeforeStart: 15,
  remindAfterEnd: 10,
  workDays: [0, 1, 2, 3, 4, 5, 6] // All days
};

testNotificationTimings(soonShift, today);

console.log('\n--- Testing Real Night Shift ---');
testNotificationTimings(realNightShift, today);

// ✅ Test unique ID generation
console.log('\n🆔 === TESTING UNIQUE ID GENERATION ===');
const testDates = [
  addDays(today, 0),
  addDays(today, 1),
  addDays(today, 2)
];

testDates.forEach((date, index) => {
  const dateString = format(date, 'yyyy-MM-dd');
  console.log(`Day ${index + 1}: ${dateString}`);
  console.log(`  departure-${dateString}`);
  console.log(`  checkin-${dateString}`);
  
  // For overnight shift, checkout uses next day
  const checkoutDate = nightShift.endTime < nightShift.startTime ? addDays(date, 1) : date;
  const checkoutDateString = format(checkoutDate, 'yyyy-MM-dd');
  console.log(`  checkout-${checkoutDateString} (overnight: ${nightShift.endTime < nightShift.startTime})`);
});

console.log('\n✅ === TESTING COMPLETED ===');
console.log('Key improvements:');
console.log('- ✅ Proper overnight shift handling with date-fns');
console.log('- ✅ Strict isFuture() checking before scheduling');
console.log('- ✅ Unique ID generation with date format');
console.log('- ✅ Correct timestamp building for end times');
console.log('- ✅ 7-day scheduling loop');
console.log('- ✅ Cleanup-first pattern');
