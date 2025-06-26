/**
 * ✅ Asset Preloader Utility
 * Tối ưu hóa việc preload assets để cải thiện performance
 */

import * as Font from 'expo-font';
import { Asset } from 'expo-asset';

// ✅ Preload critical fonts only
const preloadFonts = async () => {
  try {
    // Chỉ preload fonts thực sự cần thiết
    // React Native Paper sử dụng system fonts nên không cần preload nhiều
    await Font.loadAsync({
      // Chỉ load fonts custom nếu có
    });
    console.log('✅ Fonts preloaded successfully');
  } catch (error) {
    console.warn('⚠️ Font preloading failed:', error);
  }
};

// ✅ Preload critical images only
const preloadImages = async () => {
  try {
    const imageAssets = [
      // Chỉ preload những hình ảnh quan trọng nhất
      require('../../assets/icon.png'),
      require('../../assets/adaptive-icon.png'),
    ];

    const cacheImages = imageAssets.map(image => {
      return Asset.fromModule(image).downloadAsync();
    });

    await Promise.all(cacheImages);
    console.log('✅ Critical images preloaded successfully');
  } catch (error) {
    console.warn('⚠️ Image preloading failed:', error);
  }
};

// ✅ Main preloader function - chỉ preload những gì thực sự cần thiết
export const preloadCriticalAssets = async () => {
  try {
    console.log('🚀 Starting critical asset preloading...');
    
    // Preload song song để tiết kiệm thời gian
    await Promise.allSettled([
      preloadFonts(),
      preloadImages(),
    ]);
    
    console.log('✅ Critical asset preloading completed');
  } catch (error) {
    console.warn('⚠️ Asset preloading failed:', error);
    // Không throw error để không block app startup
  }
};

// ✅ Lazy preload non-critical assets trong background
export const preloadNonCriticalAssets = () => {
  // Chạy trong background sau khi app đã load xong
  setTimeout(async () => {
    try {
      console.log('🔄 Starting non-critical asset preloading...');
      
      // Preload các assets không quan trọng
      // Ví dụ: weather icons, animation assets, etc.
      
      console.log('✅ Non-critical asset preloading completed');
    } catch (error) {
      console.warn('⚠️ Non-critical asset preloading failed:', error);
    }
  }, 2000); // Delay 2 giây sau khi app load xong
};
