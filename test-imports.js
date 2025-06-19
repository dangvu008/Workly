// Test imports để kiểm tra không có lỗi
console.log('🧪 Testing imports...');

try {
  // Test import notificationScheduler
  const { notificationScheduler } = require('./src/services/notificationScheduler');
  console.log('✅ notificationScheduler import OK');
  
  // Test import deprecated notificationService
  const { notificationService } = require('./src/services/notifications');
  console.log('✅ notificationService (deprecated) import OK');
  
  // Test import constants
  const { NOTIFICATION_CATEGORIES } = require('./src/constants');
  console.log('✅ NOTIFICATION_CATEGORIES import OK');
  
  // Test import ShiftDebugLogger
  const { ShiftDebugLogger } = require('./src/utils/shiftDebugLogger');
  console.log('✅ ShiftDebugLogger import OK');
  
  console.log('\n🎉 All imports successful!');
  console.log('The bundling error should be resolved.');
  
} catch (error) {
  console.error('❌ Import error:', error.message);
}
