/**
 * 🌪️ Test script để kiểm tra Chức năng Cảnh báo Thời tiết Cực đoan
 * 
 * Hướng dẫn test:
 * 1. Mở ứng dụng Workly trên thiết bị
 * 2. Đảm bảo đã bật Weather Warning trong Settings
 * 3. Đảm bảo đã cài đặt vị trí Home và Work (nếu không dùng single location)
 * 4. Có active shift với departureTime và officeEndTime
 * 5. Test các scenarios khác nhau
 * 
 * Hoặc sử dụng React Native Debugger để chạy commands sau:
 */

console.log('🌪️ === EXTREME WEATHER SYSTEM TEST GUIDE ===');
console.log('');
console.log('📱 Để test Chức năng Cảnh báo Thời tiết Cực đoan:');
console.log('');
console.log('🔧 Chuẩn bị:');
console.log('1. Bật Weather Warning trong Settings');
console.log('2. Cài đặt vị trí Home (và Work nếu không dùng single location)');
console.log('3. Có active shift với departureTime và officeEndTime');
console.log('4. Đảm bảo có API keys thời tiết hoạt động');
console.log('');
console.log('🧪 Test scenarios:');
console.log('');
console.log('1. 📅 Test scheduling extreme weather checks:');
console.log('   - Kiểm tra extreme weather checks được schedule ~1 giờ trước departure');
console.log('   - Verify notifications được tạo với đúng timing');
console.log('');
console.log('2. 🌧️ Test weather analysis:');
console.log('   - Simulate mưa to (>2.5mm/3h) tại thời điểm đi làm');
console.log('   - Simulate nhiệt độ cực đoan (<15°C hoặc >37°C)');
console.log('   - Simulate gió mạnh (>10 m/s)');
console.log('   - Simulate độ ẩm cao (>90%) + nhiệt độ cao (>30°C)');
console.log('');
console.log('3. 🚨 Test warning generation:');
console.log('   - Kiểm tra cảnh báo được tạo cho chặng đi làm');
console.log('   - Kiểm tra cảnh báo được tạo cho chặng tan làm');
console.log('   - Kiểm tra message formatting với multiple warnings');
console.log('');
console.log('4. 📱 Test UI integration:');
console.log('   - ExtremeWeatherAlert component hiển thị đúng');
console.log('   - Animation và styling hoạt động');
console.log('   - Dismiss functionality');
console.log('');
console.log('🔧 Commands trong React Native Debugger:');
console.log('');
console.log('// Import services');
console.log('const { extremeWeatherService } = require("./src/services/extremeWeatherService");');
console.log('const { weatherService } = require("./src/services/weather");');
console.log('');
console.log('// Test extreme weather analysis');
console.log('const testShift = {');
console.log('  id: "test-shift",');
console.log('  departureTime: "07:30",');
console.log('  officeEndTime: "17:00",');
console.log('  workDays: [1, 2, 3, 4, 5],');
console.log('  isNightShift: false');
console.log('};');
console.log('');
console.log('const testDate = new Date();');
console.log('await weatherService.analyzeExtremeWeatherForShift(testShift, testDate);');
console.log('');
console.log('// Schedule extreme weather check');
console.log('await extremeWeatherService.scheduleExtremeWeatherCheck(testShift, testDate);');
console.log('');
console.log('// Perform immediate extreme weather check');
console.log('await extremeWeatherService.performExtremeWeatherCheck("test-shift", "2024-06-19");');
console.log('');
console.log('// Get current extreme weather warning');
console.log('await extremeWeatherService.getCurrentExtremeWeatherWarning();');
console.log('');
console.log('// Get all extreme weather warnings');
console.log('await extremeWeatherService.getExtremeWeatherWarnings();');
console.log('');
console.log('✅ Các thay đổi đã được triển khai:');
console.log('');
console.log('📦 Services:');
console.log('- extremeWeatherService: Quản lý toàn bộ logic extreme weather');
console.log('- weatherService.analyzeExtremeWeatherForShift(): Phân tích thời tiết cực đoan');
console.log('- notificationHandler: Xử lý extreme weather check notifications');
console.log('');
console.log('🎨 UI Components:');
console.log('- ExtremeWeatherAlert: Component hiển thị cảnh báo trên HomeScreen');
console.log('- Animation và styling cho warning alerts');
console.log('- Integration với WeatherApiDebug');
console.log('');
console.log('🔄 Integration:');
console.log('- AppContext: Schedule extreme weather checks cùng với weather warnings');
console.log('- Cleanup và reschedule khi thay đổi active shift');
console.log('- Auto-trigger extreme weather checks qua notifications');
console.log('');
console.log('🎯 Logic hoạt động:');
console.log('');
console.log('1. ⏰ Timing:');
console.log('   - Schedule check ~1 giờ trước departureTime');
console.log('   - Chỉ schedule cho working days của shift');
console.log('   - Auto-cleanup khi thay đổi shift');
console.log('');
console.log('2. 🌤️ Weather Analysis:');
console.log('   - Phân tích thời tiết tại vị trí Home cho chặng đi làm');
console.log('   - Phân tích thời tiết tại vị trí Work cho chặng tan làm');
console.log('   - Support single location mode');
console.log('   - Detect: mưa, nhiệt độ cực đoan, gió mạnh, độ ẩm cao');
console.log('');
console.log('3. 🚨 Warning Generation:');
console.log('   - Tạo message theo ngữ cảnh (đi làm vs tan làm)');
console.log('   - Gợi ý hành động cụ thể (mang áo mưa, mặc ấm, etc.)');
console.log('   - Combine multiple warnings thành message duy nhất');
console.log('');
console.log('4. 📱 User Experience:');
console.log('   - High-priority notification');
console.log('   - Animated alert trên HomeScreen');
console.log('   - Dismiss functionality');
console.log('   - Auto-expire sau 12 giờ');
console.log('');
console.log('🔍 Debug và Monitor:');
console.log('- Logs trong ShiftDebugLogger');
console.log('- Storage của warnings để track history');
console.log('- Integration với WeatherApiDebug để monitor API usage');
console.log('- Test commands để verify functionality');
console.log('');
console.log('💡 Lưu ý quan trọng:');
console.log('- Cần bật weatherWarningEnabled trong Settings');
console.log('- Cần có weatherLocation (home và work nếu không single location)');
console.log('- Cần có active shift với departureTime và officeEndTime');
console.log('- API keys thời tiết phải hoạt động');
console.log('- Extreme weather checks chỉ chạy cho working days');
console.log('');
console.log('🚀 Test cases để verify:');
console.log('1. Normal day: Không có extreme weather → Không có warning');
console.log('2. Rainy departure: Mưa lúc đi làm → Warning với gợi ý mang áo mưa');
console.log('3. Cold return: Lạnh lúc tan làm → Warning với gợi ý chuẩn bị áo khoác');
console.log('4. Multiple conditions: Mưa + lạnh → Combined warning message');
console.log('5. Night shift: Xử lý đúng thời gian cho ca đêm');
console.log('6. Single location: Hoạt động đúng khi chỉ có 1 vị trí');
console.log('7. Dismiss: Ẩn warning và cleanup state');
console.log('8. Auto-expire: Warning tự động biến mất sau 12 giờ');
