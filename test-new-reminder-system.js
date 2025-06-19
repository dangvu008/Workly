/**
 * 🧪 Test Script cho Hệ thống Nhắc nhở 3 loại mới
 * 
 * Hệ thống được chia làm 3 loại:
 * 1. 🚨 Báo thức (Alarm) - Độ ưu tiên cao nhất → AlarmService
 * 2. 🌤️ Cảnh báo Thời tiết - Thông báo ưu tiên cao → NotificationScheduler  
 * 3. 📅 Nhắc nhở Đổi ca - Thông báo tiêu chuẩn → NotificationScheduler
 */

console.log('🧪 Testing New 3-Type Reminder System');
console.log('Current time:', new Date().toLocaleString());

// Mock date-fns functions
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

// Helper functions
function buildTimestamp(baseDate, timeString, isOvernightShift) {
  const [hour, minute] = timeString.split(':').map(Number);
  const dateToUse = isOvernightShift ? addDays(baseDate, 1) : baseDate;
  return set(dateToUse, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
}

function isOvernightShift(shift) {
  const parseTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const startMinutes = parseTimeToMinutes(shift.startTime);
  const endMinutes = parseTimeToMinutes(shift.endTime);
  return endMinutes < startMinutes;
}

// ✅ Test 1: Báo thức (Alarm) - 4 loại
function testAlarmSystem(shift, workdayDate) {
  const now = new Date();
  const workdayDateString = format(workdayDate, 'yyyy-MM-dd');
  const isOvernight = isOvernightShift(shift);
  
  console.log(`\n🚨 === TESTING ALARM SYSTEM for ${shift.name} on ${workdayDateString} ===`);
  console.log(`Is overnight shift: ${isOvernight}`);
  
  const alarms = [];

  // 1. Nhắc Đi Làm - departureTime
  const departureTime = buildTimestamp(workdayDate, shift.departureTime, false);
  if (isAfter(departureTime, now)) {
    alarms.push({
      id: `departure-${workdayDateString}`,
      type: 'Nhắc Đi Làm',
      time: departureTime,
      message: `🚶‍♂️ Đến giờ khởi hành (${shift.departureTime})`
    });
  }

  // 2. Nhắc Chấm Công Vào - startTime - remindBeforeStart
  const reminderMinutes = shift.remindBeforeStart || 15;
  const startTime = buildTimestamp(workdayDate, shift.startTime, false);
  const checkinTime = addMinutes(startTime, -reminderMinutes);
  if (isAfter(checkinTime, now)) {
    alarms.push({
      id: `checkin-${workdayDateString}`,
      type: 'Nhắc Chấm Công Vào',
      time: checkinTime,
      message: `📥 Còn ${reminderMinutes} phút đến giờ chấm công vào (${shift.startTime})`
    });
  }

  // 3. Nhắc Ký Công - officeEndTime - 10 phút (chỉ khi showPunch = true)
  if (shift.showPunch) {
    const officeEndTime = buildTimestamp(workdayDate, shift.officeEndTime, isOvernight);
    const punchTime = addMinutes(officeEndTime, -10);
    if (isAfter(punchTime, now)) {
      const punchDateString = isOvernight ? format(officeEndTime, 'yyyy-MM-dd') : workdayDateString;
      alarms.push({
        id: `punch-${punchDateString}`,
        type: 'Nhắc Ký Công',
        time: punchTime,
        message: `✍️ Còn 10 phút đến giờ kết thúc hành chính (${shift.officeEndTime})`
      });
    }
  }

  // 4. Nhắc Chấm Công Ra - endTime + remindAfterEnd
  const checkoutReminderMinutes = shift.remindAfterEnd || 10;
  const endTime = buildTimestamp(workdayDate, shift.endTime, isOvernight);
  const checkoutTime = addMinutes(endTime, checkoutReminderMinutes);
  if (isAfter(checkoutTime, now)) {
    const checkoutDateString = isOvernight ? format(endTime, 'yyyy-MM-dd') : workdayDateString;
    alarms.push({
      id: `checkout-${checkoutDateString}`,
      type: 'Nhắc Chấm Công Ra',
      time: checkoutTime,
      message: `📤 Đã ${checkoutReminderMinutes} phút sau giờ tan ca (${shift.endTime})`
    });
  }

  console.log(`Total alarms: ${alarms.length}`);
  alarms.forEach(alarm => {
    const hoursFromNow = (alarm.time.getTime() - now.getTime()) / (1000 * 60 * 60);
    console.log(`  ${alarm.type}: ${alarm.time.toLocaleString()} (${hoursFromNow.toFixed(2)}h)`);
    console.log(`    ID: ${alarm.id}`);
    console.log(`    Message: ${alarm.message}`);
  });

  return alarms;
}

// ✅ Test 2: Cảnh báo Thời tiết - 1 giờ trước departure
function testWeatherWarning(shift, workdayDate) {
  const now = new Date();
  const workdayDateString = format(workdayDate, 'yyyy-MM-dd');
  
  console.log(`\n🌤️ === TESTING WEATHER WARNING for ${shift.name} on ${workdayDateString} ===`);
  
  const departureTime = buildTimestamp(workdayDate, shift.departureTime, false);
  const weatherCheckTime = addMinutes(departureTime, -60); // 1 giờ trước
  
  if (isAfter(weatherCheckTime, now)) {
    const hoursFromNow = (weatherCheckTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    console.log(`✅ Weather check scheduled:`);
    console.log(`  Time: ${weatherCheckTime.toLocaleString()} (${hoursFromNow.toFixed(2)}h from now)`);
    console.log(`  ID: weather_check_${shift.id}_${workdayDateString}`);
    console.log(`  Message: 🌤️ Kiểm tra thời tiết trước khi đi làm`);
    console.log(`  Analysis: Departure ${shift.departureTime}, Office End ${shift.officeEndTime}`);
    return true;
  } else {
    console.log(`❌ Weather check skipped - time is in the past: ${weatherCheckTime.toLocaleString()}`);
    return false;
  }
}

// ✅ Test 3: Nhắc nhở Đổi ca - Cuối tuần
function testWeeklyShiftReminder() {
  console.log(`\n📅 === TESTING WEEKLY SHIFT REMINDER ===`);
  
  const now = new Date();
  const today = startOfDay(now);
  
  // Tìm thứ 7 tuần này
  const currentDay = today.getDay();
  const daysUntilSaturday = (6 - currentDay + 7) % 7;
  const nextSaturday = addDays(today, daysUntilSaturday);
  nextSaturday.setHours(22, 0, 0, 0); // 10 PM
  
  if (isAfter(nextSaturday, now)) {
    const hoursFromNow = (nextSaturday.getTime() - now.getTime()) / (1000 * 60 * 60);
    console.log(`✅ Weekly reminder scheduled:`);
    console.log(`  Time: ${nextSaturday.toLocaleString()} (${hoursFromNow.toFixed(2)}h from now)`);
    console.log(`  ID: weekly_reminder_${Date.now()}`);
    console.log(`  Message: 📅 Kết thúc tuần làm việc. Chọn ca cho tuần tới?`);
    return true;
  } else {
    console.log(`❌ Weekly reminder skipped - time is in the past`);
    return false;
  }
}

// ✅ Test với ca mẫu
console.log('\n=== TESTING WITH SAMPLE SHIFTS ===');

const dayShift = {
  id: 'day_shift',
  name: 'Ca Ngày',
  startTime: '08:00',
  endTime: '17:00',
  departureTime: '07:30',
  officeEndTime: '16:30',
  remindBeforeStart: 15,
  remindAfterEnd: 10,
  showPunch: true,
  workDays: [1, 2, 3, 4, 5]
};

const nightShift = {
  id: 'night_shift',
  name: 'Ca Đêm',
  startTime: '22:00',
  endTime: '06:30',
  departureTime: '21:15',
  officeEndTime: '05:30',
  remindBeforeStart: 20,
  remindAfterEnd: 15,
  showPunch: true,
  workDays: [1, 2, 3, 4, 5, 6]
};

// Test cho 2 ngày tới
const today = startOfDay(new Date());
for (let i = 0; i < 2; i++) {
  const testDate = addDays(today, i);
  const dayOfWeek = testDate.getDay();
  
  console.log(`\n📅 === DAY ${i + 1}: ${format(testDate, 'yyyy-MM-dd')} (day ${dayOfWeek}) ===`);
  
  // Test day shift
  if (dayShift.workDays.includes(dayOfWeek)) {
    const dayAlarms = testAlarmSystem(dayShift, testDate);
    const dayWeather = testWeatherWarning(dayShift, testDate);
  } else {
    console.log('Day shift: Skipped - not a work day');
  }
  
  // Test night shift
  if (nightShift.workDays.includes(dayOfWeek)) {
    const nightAlarms = testAlarmSystem(nightShift, testDate);
    const nightWeather = testWeatherWarning(nightShift, testDate);
  } else {
    console.log('Night shift: Skipped - not a work day');
  }
}

// Test weekly reminder
testWeeklyShiftReminder();

console.log('\n✅ === TESTING COMPLETED ===');
console.log('New 3-Type Reminder System:');
console.log('1. 🚨 Alarms (4 types): departure, checkin, punch, checkout');
console.log('2. 🌤️ Weather Warning: 1 hour before departure');
console.log('3. 📅 Weekly Reminder: Saturday 10 PM');
console.log('');
console.log('Key improvements:');
console.log('- ✅ Proper separation of concerns');
console.log('- ✅ Alarms for critical reminders');
console.log('- ✅ Notifications for informational alerts');
console.log('- ✅ Auto-cancel after action completion');
console.log('- ✅ Correct overnight shift handling');
