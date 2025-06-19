# 🧪 Hướng dẫn Test Hệ thống Notification mới trong React Native

## 📱 **Cách test trong React Native app:**

### 1. **Mở React Native Debugger hoặc Console**
```bash
# Chạy app
npm start
# hoặc
expo start
```

### 2. **Mở Console trong app và chạy các lệnh sau:**

#### 🔍 **Test cơ bản:**
```javascript
// Test timing calculations (không cần import)
debugTimingCalculations();
```

#### 📱 **Test notification scheduler:**
```javascript
// Test hệ thống notification mới
await debugNewNotificationSystem();
```

#### 🧪 **Test với ca mẫu:**
```javascript
// Test ca ngày
await debugWithSampleShift();

// Test ca đêm  
await debugNightShift();
```

#### 📊 **Xem debug logs:**
```javascript
// Export tất cả logs
await exportDebugLogs();
```

### 3. **Kiểm tra kết quả mong đợi:**

#### ✅ **Timing Logic:**
- **Ca đêm**: Checkout time phải +1 ngày
- **Ca ngày**: Checkout time cùng ngày
- **Validation**: Chỉ lập lịch 6 phút - 2 ngày tương lai

#### ✅ **Notification Scheduling:**
- **Cleanup**: Hủy tất cả notifications cũ trước
- **Validation**: Kiểm tra work days, attendance logs
- **Scheduling**: Chỉ lập lịch notifications hợp lệ

#### ✅ **Debug Logging:**
- **Categories**: notification, cleanup, timing, validation
- **Levels**: info, warning, error, success
- **Data**: Chi tiết về timing calculations

### 4. **Test scenarios cụ thể:**

#### 🌙 **Test ca đêm:**
```javascript
const nightShift = {
  id: 'test_night',
  name: 'Test Ca Đêm',
  startTime: '22:00',
  endTime: '06:30', 
  departureTime: '21:15',
  remindBeforeStart: 20,
  remindAfterEnd: 15,
  isNightShift: true,
  workDays: [1, 2, 3, 4, 5, 6]
};

// Import trong console
const { notificationScheduler } = require('./src/services/notificationScheduler');
await notificationScheduler.scheduleShiftNotifications(nightShift);
await notificationScheduler.debugScheduledNotifications();
```

#### ☀️ **Test ca ngày:**
```javascript
const dayShift = {
  id: 'test_day',
  name: 'Test Ca Ngày',
  startTime: '08:00',
  endTime: '17:00',
  departureTime: '07:30', 
  remindBeforeStart: 15,
  remindAfterEnd: 10,
  isNightShift: false,
  workDays: [1, 2, 3, 4, 5]
};

await notificationScheduler.scheduleShiftNotifications(dayShift);
await notificationScheduler.debugScheduledNotifications();
```

### 5. **Kiểm tra Expo Go limitations:**

#### 📱 **Trong Expo Go:**
- Sẽ hiển thị warning về limitations
- Fallback alerts thay vì notifications
- Status sẽ show `isExpoGo: true`

#### 🔧 **Trong Development Build:**
- Notifications hoạt động bình thường
- Có thể lập lịch và nhận notifications
- Status sẽ show `canSchedule: true`

### 6. **Debug common issues:**

#### ❌ **Nếu không lập lịch được:**
```javascript
// Kiểm tra status
const status = notificationScheduler.getNotificationStatus();
console.log('Status:', status);

// Kiểm tra permissions
console.log('Can schedule:', notificationScheduler.canScheduleNotifications());
```

#### ❌ **Nếu timing sai:**
```javascript
// Chạy timing test
debugTimingCalculations();

// Xem logs chi tiết
const { ShiftDebugLogger } = require('./src/utils/shiftDebugLogger');
const timingLogs = ShiftDebugLogger.getLogsByCategory('timing');
console.log('Timing logs:', timingLogs);
```

#### ❌ **Nếu cleanup không hoạt động:**
```javascript
// Force cleanup
await notificationScheduler.cleanupAllNotifications();

// Kiểm tra còn notifications nào không
const scheduled = await notificationScheduler.getAllScheduledNotifications();
console.log('Remaining notifications:', scheduled.length);
```

### 7. **Expected Results:**

#### ✅ **Thành công:**
- Timing calculations chính xác
- Notifications được lập lịch đúng thời gian
- Cleanup hoạt động triệt để
- Debug logs chi tiết và rõ ràng
- Không có xung đột giữa notifications

#### ✅ **Cải tiến so với trước:**
- Không còn duplicate notifications
- Logic thời gian đơn giản, dễ hiểu
- Cleanup triệt để trước khi lập lịch mới
- Debug logging toàn diện
- Xử lý Expo Go limitations

### 8. **Troubleshooting:**

#### 🔧 **Nếu gặp lỗi import:**
```javascript
// Thử import trực tiếp
import { notificationScheduler } from './src/services/notificationScheduler';
import { ShiftDebugLogger } from './src/utils/shiftDebugLogger';
```

#### 🔧 **Nếu notifications không hiển thị:**
- Kiểm tra device permissions
- Kiểm tra Expo Go vs Development Build
- Kiểm tra platform support (iOS/Android)

#### 🔧 **Nếu timing sai:**
- Kiểm tra timezone
- Kiểm tra isNightShift flag
- Kiểm tra work days array

## 🎯 **Kết luận:**

Hệ thống notification mới đã được thiết kế để:
1. **Đơn giản hóa** logic thời gian
2. **Loại bỏ xung đột** giữa các hệ thống
3. **Cleanup triệt để** trước khi lập lịch mới
4. **Debug dễ dàng** với logging chi tiết
5. **Tương thích** với Expo Go limitations

Test kỹ lưỡng để đảm bảo hệ thống hoạt động chính xác!
