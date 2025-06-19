// Simple timing test for new notification system
const now = new Date();
console.log('🧪 Testing New Notification System Timing Logic');
console.log('Current time:', now.toLocaleString());

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

const isValidFutureTime = (dateTime, minHoursFromNow = 0.1) => {
  const diffHours = (dateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysDiff = Math.floor((dateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffHours >= minHoursFromNow && daysDiff >= 0 && daysDiff <= 2;
};

console.log('\n🌙 === NIGHT SHIFT TEST ===');
const nightShift = {
  departureTime: '21:15',
  startTime: '22:00', 
  endTime: '06:30',
  remindBeforeStart: 20,
  remindAfterEnd: 15,
  isNightShift: true
};

const today = new Date();

// Departure
const departureTime = createDateTime(today, nightShift.departureTime);
const departureValid = isValidFutureTime(departureTime);
const departureHours = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
console.log('Departure:', departureTime.toLocaleString(), departureValid ? '✅' : '❌', `(${departureHours.toFixed(2)}h)`);

// Check-in
const checkinTime = createDateTime(today, nightShift.startTime);
checkinTime.setMinutes(checkinTime.getMinutes() - nightShift.remindBeforeStart);
const checkinValid = isValidFutureTime(checkinTime);
const checkinHours = (checkinTime.getTime() - now.getTime()) / (1000 * 60 * 60);
console.log('Check-in:', checkinTime.toLocaleString(), checkinValid ? '✅' : '❌', `(${checkinHours.toFixed(2)}h)`);

// Check-out (night shift: +1 day)
const checkoutTime = createDateTime(today, nightShift.endTime, 1);
checkoutTime.setMinutes(checkoutTime.getMinutes() + nightShift.remindAfterEnd);
const checkoutValid = isValidFutureTime(checkoutTime);
const checkoutHours = (checkoutTime.getTime() - now.getTime()) / (1000 * 60 * 60);
console.log('Check-out:', checkoutTime.toLocaleString(), checkoutValid ? '✅' : '❌', `(${checkoutHours.toFixed(2)}h)`);

console.log('\n☀️ === DAY SHIFT TEST ===');
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
const dayDepartureValid = isValidFutureTime(dayDepartureTime);
const dayDepartureHours = (dayDepartureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
console.log('Departure:', dayDepartureTime.toLocaleString(), dayDepartureValid ? '✅' : '❌', `(${dayDepartureHours.toFixed(2)}h)`);

// Day shift check-in
const dayCheckinTime = createDateTime(today, dayShift.startTime);
dayCheckinTime.setMinutes(dayCheckinTime.getMinutes() - dayShift.remindBeforeStart);
const dayCheckinValid = isValidFutureTime(dayCheckinTime);
const dayCheckinHours = (dayCheckinTime.getTime() - now.getTime()) / (1000 * 60 * 60);
console.log('Check-in:', dayCheckinTime.toLocaleString(), dayCheckinValid ? '✅' : '❌', `(${dayCheckinHours.toFixed(2)}h)`);

// Day shift check-out (NO +1 day)
const dayCheckoutTime = createDateTime(today, dayShift.endTime);
dayCheckoutTime.setMinutes(dayCheckoutTime.getMinutes() + dayShift.remindAfterEnd);
const dayCheckoutValid = isValidFutureTime(dayCheckoutTime);
const dayCheckoutHours = (dayCheckoutTime.getTime() - now.getTime()) / (1000 * 60 * 60);
console.log('Check-out:', dayCheckoutTime.toLocaleString(), dayCheckoutValid ? '✅' : '❌', `(${dayCheckoutHours.toFixed(2)}h)`);

console.log('\n📊 === SUMMARY ===');
console.log('Night Shift:');
console.log(`  - Departure: ${departureValid ? 'VALID' : 'INVALID'} (${departureHours.toFixed(2)}h from now)`);
console.log(`  - Check-in: ${checkinValid ? 'VALID' : 'INVALID'} (${checkinHours.toFixed(2)}h from now)`);
console.log(`  - Check-out: ${checkoutValid ? 'VALID' : 'INVALID'} (${checkoutHours.toFixed(2)}h from now)`);

console.log('Day Shift:');
console.log(`  - Departure: ${dayDepartureValid ? 'VALID' : 'INVALID'} (${dayDepartureHours.toFixed(2)}h from now)`);
console.log(`  - Check-in: ${dayCheckinValid ? 'VALID' : 'INVALID'} (${dayCheckinHours.toFixed(2)}h from now)`);
console.log(`  - Check-out: ${dayCheckoutValid ? 'VALID' : 'INVALID'} (${dayCheckoutHours.toFixed(2)}h from now)`);

console.log('\n✅ Timing logic test completed');

// Test validation rules
console.log('\n🔍 === VALIDATION RULES TEST ===');
console.log('Rules:');
console.log('- Must be at least 0.1 hours (6 minutes) in the future');
console.log('- Must be within 2 days from now');
console.log('- Night shift checkout gets +1 day automatically');

const testTimes = [
  { name: 'Now', time: new Date() },
  { name: 'In 5 minutes', time: new Date(Date.now() + 5 * 60 * 1000) },
  { name: 'In 10 minutes', time: new Date(Date.now() + 10 * 60 * 1000) },
  { name: 'In 1 hour', time: new Date(Date.now() + 60 * 60 * 1000) },
  { name: 'Tomorrow', time: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  { name: 'In 3 days', time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
];

testTimes.forEach(test => {
  const valid = isValidFutureTime(test.time);
  const hours = (test.time.getTime() - now.getTime()) / (1000 * 60 * 60);
  console.log(`${test.name}: ${valid ? '✅' : '❌'} (${hours.toFixed(2)}h)`);
});

console.log('\n🎯 === EXPECTED BEHAVIOR ===');
console.log('For current time:', now.toLocaleString());
console.log('- Night shift notifications should be scheduled for tonight/tomorrow');
console.log('- Day shift notifications should be scheduled for tomorrow (if today is past)');
console.log('- Only future times within 2 days should be valid');
console.log('- Night shift checkout automatically gets +1 day');
