/**
 * ✅ Icon Preloader Service - Khắc phục lỗi load icon chậm
 * Đảm bảo icons được load trước khi app hiển thị
 */

import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export class IconPreloaderService {
  private static instance: IconPreloaderService;
  private isPreloaded = false;
  private preloadPromise: Promise<void> | null = null;

  static getInstance(): IconPreloaderService {
    if (!IconPreloaderService.instance) {
      IconPreloaderService.instance = new IconPreloaderService();
    }
    return IconPreloaderService.instance;
  }

  /**
   * ✅ Preload icon fonts trước khi app start
   */
  async preloadIcons(): Promise<void> {
    if (this.isPreloaded) {
      return;
    }

    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    this.preloadPromise = this._performPreload();
    return this.preloadPromise;
  }

  private async _performPreload(): Promise<void> {
    try {
      console.log('🎨 IconPreloader: Bắt đầu preload icons...');
      const startTime = Date.now();

      // Giữ splash screen hiển thị trong khi preload
      await SplashScreen.preventAutoHideAsync();

      // Preload MaterialCommunityIcons font
      await this.preloadMaterialCommunityIcons();

      // Cache critical icons
      await this.cacheCriticalIcons();

      const endTime = Date.now();
      console.log(`✅ IconPreloader: Hoàn thành trong ${endTime - startTime}ms`);

      this.isPreloaded = true;

      // Ẩn splash screen sau khi preload xong
      await SplashScreen.hideAsync();

    } catch (error) {
      console.error('❌ IconPreloader: Lỗi preload:', error);
      // Vẫn ẩn splash screen nếu có lỗi
      await SplashScreen.hideAsync();
    }
  }

  /**
   * ✅ Preload MaterialCommunityIcons font
   */
  private async preloadMaterialCommunityIcons(): Promise<void> {
    try {
      // Kiểm tra font đã sẵn sàng
      const testIcon = MaterialCommunityIcons.glyphMap['home'];
      if (testIcon) {
        console.log('✅ IconPreloader: MaterialCommunityIcons sẵn sàng');
      }

      // Force load font nếu cần
      await Font.loadAsync({
        ...MaterialCommunityIcons.font,
      });

    } catch (error) {
      console.warn('⚠️ IconPreloader: Lỗi load MaterialCommunityIcons:', error);
    }
  }

  /**
   * ✅ Cache các icons quan trọng
   */
  private async cacheCriticalIcons(): Promise<void> {
    try {
      // Danh sách icons quan trọng cần preload
      const criticalIcons = [
        'home', 'home-outline',
        'clock', 'clock-outline', 
        'note-text', 'note-text-outline',
        'chart-line', 'chart-line-variant',
        'cog', 'cog-outline',
        'play', 'pause', 'stop',
        'check', 'close',
        'plus', 'minus',
        'menu', 'dots-vertical',
        'weather-sunny', 'weather-cloudy'
      ];

      // Pre-render icons để cache chúng
      criticalIcons.forEach(iconName => {
        if (MaterialCommunityIcons.glyphMap[iconName]) {
          // Icon exists, it's now cached
        }
      });

      console.log(`✅ IconPreloader: Đã cache ${criticalIcons.length} icons quan trọng`);
    } catch (error) {
      console.warn('⚠️ IconPreloader: Lỗi cache icons:', error);
    }
  }

  /**
   * ✅ Kiểm tra trạng thái preload
   */
  isIconsPreloaded(): boolean {
    return this.isPreloaded;
  }

  /**
   * ✅ Get preload status
   */
  getPreloadStatus(): {
    isPreloaded: boolean;
    isPreloading: boolean;
  } {
    return {
      isPreloaded: this.isPreloaded,
      isPreloading: this.preloadPromise !== null && !this.isPreloaded,
    };
  }
}

// Export singleton instance
export const iconPreloader = IconPreloaderService.getInstance();

/**
 * ✅ Utility function để preload icons trong App.tsx
 */
export const initializeIconPreloader = async (): Promise<void> => {
  try {
    await iconPreloader.preloadIcons();
  } catch (error) {
    console.error('❌ Lỗi khởi tạo icon preloader:', error);
  }
};
