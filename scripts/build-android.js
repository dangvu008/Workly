#!/usr/bin/env node

/**
 * 🏗️ Android Build Script
 * Hướng dẫn build ứng dụng với Android Studio
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️ Android Build Setup Guide\n');

console.log('📋 Prerequisites:');
console.log('1. ✅ Android Studio installed');
console.log('2. ✅ Android SDK (API 33+) installed');
console.log('3. ✅ Environment variables set (ANDROID_HOME, PATH)');
console.log('4. ✅ EAS CLI installed globally');
console.log('');

console.log('🚀 Build Options:\n');

console.log('Option 1: EAS Development Build (Recommended)');
console.log('   npm run build:dev-android');
console.log('   - Builds APK with development client');
console.log('   - Can be installed on device/emulator');
console.log('   - Supports hot reload and debugging');
console.log('');

console.log('Option 2: EAS Local Build');
console.log('   npm run build:local-android');
console.log('   - Builds locally using your Android SDK');
console.log('   - Faster than cloud build');
console.log('   - Requires Android SDK setup');
console.log('');

console.log('Option 3: Expo Prebuild + Android Studio');
console.log('   npm run prebuild:android');
console.log('   - Generates native Android project');
console.log('   - Open in Android Studio for full control');
console.log('   - Can customize native code');
console.log('');

console.log('🔧 Environment Check:');

// Check if Android SDK is available
try {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome && fs.existsSync(androidHome)) {
    console.log('✅ Android SDK found at:', androidHome);
  } else {
    console.log('❌ Android SDK not found. Please set ANDROID_HOME environment variable.');
  }
} catch (error) {
  console.log('⚠️ Could not check Android SDK');
}

// Check if EAS CLI is installed
try {
  execSync('eas --version', { stdio: 'pipe' });
  console.log('✅ EAS CLI is installed');
} catch (error) {
  console.log('❌ EAS CLI not found. Install with: npm install -g @expo/eas-cli');
}

console.log('');
console.log('📱 To start building:');
console.log('1. Choose one of the build options above');
console.log('2. Follow the prompts');
console.log('3. Install the generated APK on your device');
console.log('4. Use "npx expo start --dev-client" to connect');
console.log('');
console.log('💡 For detailed setup, see: docs/DEVELOPMENT_BUILD_SETUP.md');
