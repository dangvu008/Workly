#!/usr/bin/env node

/**
 * ✅ Project Reset Script
 * Reset project để fix Metro cache issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Resetting project...\n');

try {
  // 1. Clear all caches
  console.log('🧹 Clearing caches...');
  
  const cacheDirs = [
    '.expo',
    'node_modules/.cache',
    '.metro',
    'dist',
    'web-build'
  ];
  
  cacheDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Removed ${dir}`);
      }
    } catch (error) {
      console.log(`⚠️ Could not remove ${dir}: ${error.message}`);
    }
  });

  // 2. Reset Metro config to minimal
  console.log('\n⚙️ Resetting Metro config...');
  const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;`;
  
  fs.writeFileSync('metro.config.js', metroConfig);
  console.log('✅ Metro config reset to default');

  // 3. Fix tsconfig.json
  console.log('\n📝 Fixing tsconfig.json...');
  const tsConfig = {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true
    }
  };
  
  fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfig, null, 2));
  console.log('✅ tsconfig.json fixed');

  console.log('\n🎉 Project reset completed!');
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npx expo start --clear');
  console.log('2. If still issues, try: npx expo start --tunnel');
  console.log('3. Or use: npm run start:expo-go');

} catch (error) {
  console.error('❌ Error during reset:', error.message);
  process.exit(1);
}
