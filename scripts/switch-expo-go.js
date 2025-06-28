#!/usr/bin/env node

/**
 * ✅ Script chuyển đổi giữa phiên bản thường và Expo Go
 * Usage: 
 *   node scripts/switch-expo-go.js expo-go    # Chuyển sang phiên bản Expo Go
 *   node scripts/switch-expo-go.js normal     # Chuyển về phiên bản thường
 */

const fs = require('fs');
const path = require('path');

const mode = process.argv[2];

if (!mode || !['expo-go', 'normal'].includes(mode)) {
  console.log('❌ Usage: node scripts/switch-expo-go.js [expo-go|normal]');
  process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const appFile = path.join(rootDir, 'App.tsx');
const expoGoAppFile = path.join(rootDir, 'App.expo-go.tsx');
const backupFile = path.join(rootDir, 'App.backup.tsx');

try {
  if (mode === 'expo-go') {
    console.log('🔄 Switching to Expo Go optimized version...');
    
    // Backup current App.tsx
    if (fs.existsSync(appFile)) {
      fs.copyFileSync(appFile, backupFile);
      console.log('✅ Backed up current App.tsx');
    }
    
    // Copy Expo Go version
    if (fs.existsSync(expoGoAppFile)) {
      fs.copyFileSync(expoGoAppFile, appFile);
      console.log('✅ Switched to Expo Go optimized App.tsx');
    } else {
      console.log('❌ App.expo-go.tsx not found');
      process.exit(1);
    }
    
    console.log('');
    console.log('🚀 Expo Go optimization enabled!');
    console.log('📱 Now run: npx expo start --clear');
    console.log('');
    console.log('⚡ Features disabled for faster loading:');
    console.log('   - Weather service');
    console.log('   - Audio/Alarm services');
    console.log('   - Heavy animations');
    console.log('   - Some background services');
    console.log('');
    console.log('✅ Features still available:');
    console.log('   - Auto mode (nút đa năng tự động)');
    console.log('   - All core functionality');
    console.log('   - Shift management');
    console.log('   - Notes and statistics');
    console.log('');
    
  } else if (mode === 'normal') {
    console.log('🔄 Switching back to normal version...');
    
    // Restore from backup
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, appFile);
      fs.unlinkSync(backupFile);
      console.log('✅ Restored normal App.tsx');
    } else {
      console.log('❌ No backup found. Please restore manually.');
      process.exit(1);
    }
    
    console.log('');
    console.log('🚀 Normal version restored!');
    console.log('📱 Now run: npx expo start --clear');
    console.log('');
    console.log('✅ All features enabled:');
    console.log('   - Full weather service');
    console.log('   - Audio/Alarm services');
    console.log('   - All animations');
    console.log('   - All background services');
    console.log('   - Auto mode (nút đa năng tự động)');
    console.log('   - Complete functionality');
    console.log('');
  }
  
} catch (error) {
  console.error('❌ Error switching versions:', error.message);
  process.exit(1);
}
