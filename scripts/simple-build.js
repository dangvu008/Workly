#!/usr/bin/env node

/**
 * 🏗️ Simple Build Guide for Android Studio
 * Hướng dẫn build đơn giản nhất
 */

console.log('🏗️ Hướng dẫn Build Android Studio - Cách đơn giản nhất\n');

console.log('📱 **CÁCH 1: Sử dụng Expo Go (Nhanh nhất)**');
console.log('1. Cài Expo Go từ Play Store');
console.log('2. Chạy: npm start');
console.log('3. Scan QR code');
console.log('4. Test app trực tiếp\n');

console.log('🔧 **CÁCH 2: Development Build (Đầy đủ tính năng)**');
console.log('Bước 1: Cài đặt môi trường');
console.log('   - Download Android Studio: https://developer.android.com/studio');
console.log('   - Cài Android SDK (API 33+)');
console.log('   - Tạo AVD (Android Virtual Device)\n');

console.log('Bước 2: Build APK');
console.log('   Option A: Cloud Build (Dễ nhất)');
console.log('   1. eas login');
console.log('   2. eas build --platform android --profile development');
console.log('   3. Download APK từ link được cung cấp');
console.log('   4. Cài APK lên device/emulator\n');

console.log('   Option B: Local Build (Cần Android SDK)');
console.log('   1. Set ANDROID_HOME environment variable');
console.log('   2. eas build --platform android --profile development --local');
console.log('   3. APK sẽ được tạo local\n');

console.log('Bước 3: Chạy development server');
console.log('   1. npm run start:dev-client');
console.log('   2. Scan QR code từ development build app');
console.log('   3. Enjoy full features!\n');

console.log('🎯 **KHUYẾN NGHỊ:**');
console.log('- Cho testing nhanh: Dùng Expo Go');
console.log('- Cho development đầy đủ: Dùng Development Build');
console.log('- Cho production: Build APK/AAB\n');

console.log('📚 **TÀI LIỆU:**');
console.log('- Chi tiết: docs/DEVELOPMENT_BUILD_SETUP.md');
console.log('- Expo docs: https://docs.expo.dev/development/build/');
console.log('- Android Studio: https://developer.android.com/studio/run/\n');

console.log('❓ **GẶP VẤN ĐỀ?**');
console.log('1. Thử Expo Go trước (đơn giản nhất)');
console.log('2. Check Android SDK setup');
console.log('3. Đảm bảo device/emulator đã bật USB debugging');
console.log('4. Clear cache: npx expo start --clear\n');

console.log('✨ Chúc bạn build thành công!');
