/**
 * 🧪 Test script để kiểm tra hệ thống xoay vòng API keys thời tiết
 * 
 * Hướng dẫn test:
 * 1. Mở ứng dụng Workly trên thiết bị
 * 2. Vào Settings > Debug > Weather Notification Debug
 * 3. Nhấn "🔑 API Keys Debug" để mở API management
 * 4. Test các chức năng API key rotation
 * 
 * Hoặc sử dụng React Native Debugger để chạy commands sau:
 */

console.log('🧪 === WEATHER API KEY ROTATION TEST GUIDE ===');
console.log('');
console.log('📱 Để test hệ thống xoay vòng API keys thời tiết:');
console.log('');
console.log('1. Mở ứng dụng Workly trên thiết bị');
console.log('2. Vào Settings > Debug > Weather Notification Debug');
console.log('3. Nhấn "🔑 API Keys Debug" để mở API management');
console.log('4. Test các buttons:');
console.log('   - 📊 Tải trạng thái: Xem trạng thái hiện tại của API keys');
console.log('   - 🔄 Reset lỗi: Reset tất cả failure counts');
console.log('   - 🧪 Test tất cả API keys: Test từng API key');
console.log('5. Kiểm tra rotation hoạt động đúng cách');
console.log('6. Test failure handling khi API key bị lỗi');
console.log('');
console.log('🔧 Hoặc chạy commands sau trong React Native Debugger:');
console.log('');
console.log('// Import weather service');
console.log('const { weatherService } = require("./src/services/weather");');
console.log('');
console.log('// Check API key status');
console.log('await weatherService.getApiKeyStatus();');
console.log('');
console.log('// Test all API keys');
console.log('await weatherService.testAllApiKeys();');
console.log('');
console.log('// Reset API key failures');
console.log('await weatherService.resetApiKeyFailures();');
console.log('');
console.log('// Test weather data fetch (will use rotation)');
console.log('await weatherService.getWeatherData(true);');
console.log('');
console.log('✅ Các thay đổi đã được áp dụng:');
console.log('- Thêm 3 API keys thực tế để xoay vòng sử dụng');
console.log('- Hệ thống rotation tự động chuyển đổi giữa các keys');
console.log('- Failure tracking: mark key as failed khi gặp lỗi 401/403/429');
console.log('- Auto-retry với key khác khi một key bị lỗi');
console.log('- Reset failure count sau 1 giờ');
console.log('- Component WeatherApiDebug để quản lý và debug');
console.log('- Integration với WeatherNotificationDebug');
console.log('');
console.log('🎯 Kết quả mong đợi:');
console.log('- Không còn bị block do rate limit');
console.log('- Tự động chuyển đổi giữa các API keys');
console.log('- Failure handling hoạt động đúng cách');
console.log('- Debug tools để monitor API key status');
console.log('- Weather data luôn available với multiple fallback keys');
console.log('');
console.log('🔑 API Keys được sử dụng:');
console.log('1. c3e99eae382719dd7e1d1a38004f1777');
console.log('2. 3f177ee42c290b6b0d1fd85ffa9e361ec4f4ace0ea0ef06f0217288066fe4229');
console.log('3. 740fc9de122d8676d2713e05577b3f87');
console.log('');
console.log('💡 Lưu ý:');
console.log('- Mỗi API key có giới hạn 1000 requests/day (free tier)');
console.log('- Với 3 keys = 3000 requests/day total');
console.log('- Hệ thống sẽ tự động phân bổ load giữa các keys');
console.log('- Khi một key hết quota, sẽ chuyển sang key khác');
console.log('- Failure count reset sau 1 giờ để retry key đã failed');
console.log('');
console.log('🚀 Test scenarios:');
console.log('1. Normal operation: Rotation hoạt động bình thường');
console.log('2. API key failure: Một key bị lỗi, chuyển sang key khác');
console.log('3. Rate limit: Key bị rate limit, auto-switch');
console.log('4. All keys failed: Fallback behavior');
console.log('5. Recovery: Failed keys được retry sau 1 giờ');
