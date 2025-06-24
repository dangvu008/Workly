const fs = require('fs');
const path = require('path');

// Script để generate icons từ SVG sang PNG
// Cần cài đặt: npm install sharp

async function generateIcons() {
  try {
    const sharp = require('sharp');
    
    const assetsDir = path.join(__dirname, '..', 'assets');
    
    console.log('🎨 Generating Workly app icons...');
    
    // Main App Icon (1024x1024)
    await sharp(path.join(assetsDir, 'workly-icon.svg'))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✅ Generated icon.png (1024x1024)');
    
    // Adaptive Icon (432x432)
    await sharp(path.join(assetsDir, 'workly-adaptive-icon.svg'))
      .resize(432, 432)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✅ Generated adaptive-icon.png (432x432)');
    
    // Notification Icon (256x256)
    await sharp(path.join(assetsDir, 'workly-notification-icon.svg'))
      .resize(256, 256)
      .png()
      .toFile(path.join(assetsDir, 'notification-icon.png'));
    console.log('✅ Generated notification-icon.png (256x256)');
    
    // Favicon (32x32)
    await sharp(path.join(assetsDir, 'workly-favicon.svg'))
      .resize(32, 32)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✅ Generated favicon.png (32x32)');
    
    // Splash Icon (512x512)
    await sharp(path.join(assetsDir, 'workly-splash-icon.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'splash-icon.png'));
    console.log('✅ Generated splash-icon.png (512x512)');
    
    // Additional sizes for different platforms
    
    // iOS App Store Icon (1024x1024) - same as main icon
    await sharp(path.join(assetsDir, 'workly-icon.svg'))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'ios-app-store-icon.png'));
    console.log('✅ Generated ios-app-store-icon.png (1024x1024)');
    
    // Android Play Store Icon (512x512)
    await sharp(path.join(assetsDir, 'workly-icon.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'android-play-store-icon.png'));
    console.log('✅ Generated android-play-store-icon.png (512x512)');
    
    // Web favicon ICO (16x16, 32x32, 48x48)
    await sharp(path.join(assetsDir, 'workly-favicon.svg'))
      .resize(16, 16)
      .png()
      .toFile(path.join(assetsDir, 'favicon-16x16.png'));
    console.log('✅ Generated favicon-16x16.png');
    
    await sharp(path.join(assetsDir, 'workly-favicon.svg'))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon-48x48.png'));
    console.log('✅ Generated favicon-48x48.png');
    
    console.log('🎉 All icons generated successfully!');
    console.log('');
    console.log('📱 Icon files created:');
    console.log('   - icon.png (1024x1024) - Main app icon');
    console.log('   - adaptive-icon.png (432x432) - Android adaptive icon');
    console.log('   - notification-icon.png (256x256) - Notification icon');
    console.log('   - favicon.png (32x32) - Web favicon');
    console.log('   - splash-icon.png (512x512) - Splash screen icon');
    console.log('   - ios-app-store-icon.png (1024x1024) - iOS App Store');
    console.log('   - android-play-store-icon.png (512x512) - Android Play Store');
    console.log('   - favicon-16x16.png & favicon-48x48.png - Additional web icons');
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('❌ Sharp module not found. Please install it:');
      console.log('   npm install sharp');
      console.log('');
      console.log('💡 Alternative: You can manually convert the SVG files to PNG using:');
      console.log('   - Online tools like https://convertio.co/svg-png/');
      console.log('   - Design tools like Figma, Sketch, or Adobe Illustrator');
      console.log('   - Command line tools like Inkscape');
    } else {
      console.error('❌ Error generating icons:', error);
    }
  }
}

// Run the script
generateIcons();
