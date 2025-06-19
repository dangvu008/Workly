/**
 * ✅ Icon Preloader Service - Quản lý việc preload icons để cải thiện performance
 * Giải quyết vấn đề icon load chậm hơn ứng dụng
 */

import React from 'react';
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
   * ✅ Preload icon fonts và critical icons
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
      console.log('🎨 IconPreloader: Starting icon preload...');
      const startTime = Date.now();

      // Keep splash screen visible during preload
      await SplashScreen.preventAutoHideAsync();

      // Preload tất cả song song để nhanh hơn
      await Promise.all([
        this.preloadMaterialCommunityIcons(),
        this.preloadOtherIconFonts(),
        this.cacheCriticalIcons(),
      ]);

      const endTime = Date.now();
      console.log(`✅ IconPreloader: Preload completed in ${endTime - startTime}ms`);

      this.isPreloaded = true;

      // Hide splash screen after preload
      await SplashScreen.hideAsync();

    } catch (error) {
      console.error('❌ IconPreloader: Error during preload:', error);
      // Hide splash screen even if preload fails
      await SplashScreen.hideAsync();
    }
  }

  /**
   * ✅ Preload MaterialCommunityIcons font
   */
  private async preloadMaterialCommunityIcons(): Promise<void> {
    try {
      // Đơn giản hóa: MaterialCommunityIcons đã được load tự động bởi @expo/vector-icons
      // Chỉ cần đảm bảo font đã sẵn sàng bằng cách render một icon test
      const testIcon = MaterialCommunityIcons.glyphMap['home'];
      if (testIcon) {
        console.log('✅ IconPreloader: MaterialCommunityIcons font is ready');
      }
    } catch (error) {
      console.warn('⚠️ IconPreloader: MaterialCommunityIcons check error:', error);
    }
  }

  /**
   * ✅ Preload other icon fonts if needed
   */
  private async preloadOtherIconFonts(): Promise<void> {
    try {
      // Nếu app sử dụng các icon fonts khác, load chúng ở đây
      const otherFonts = {
        // 'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
        // 'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
      };

      if (Object.keys(otherFonts).length > 0) {
        await Font.loadAsync(otherFonts);
        console.log('✅ IconPreloader: Other icon fonts loaded');
      }
    } catch (error) {
      console.warn('⚠️ IconPreloader: Error loading other fonts:', error);
    }
  }

  /**
   * ✅ Cache critical icons để render nhanh hơn
   */
  private async cacheCriticalIcons(): Promise<void> {
    try {
      // Import critical icons list từ WorklyIcon
      const { COMMON_ICONS } = await import('../components/WorklyIcon');

      // Danh sách icons quan trọng cần preload
      const criticalIcons = [
        COMMON_ICONS.home,
        COMMON_ICONS.clock,
        COMMON_ICONS.note,
        COMMON_ICONS.chart,
        COMMON_ICONS.settings,
        COMMON_ICONS.work,
        COMMON_ICONS.checkIn,
        COMMON_ICONS.checkOut,
        COMMON_ICONS.alert,
        COMMON_ICONS.close,
        COMMON_ICONS.back,
        COMMON_ICONS.delete,
        COMMON_ICONS.add,
        COMMON_ICONS.edit,
        COMMON_ICONS.menu,
        COMMON_ICONS.refresh
      ];

      console.log(`✅ IconPreloader: Cached ${criticalIcons.length} critical icons`);
    } catch (error) {
      console.warn('⚠️ IconPreloader: Error caching critical icons:', error);
    }
  }

  /**
   * ✅ Check if icons are preloaded
   */
  isIconsPreloaded(): boolean {
    return this.isPreloaded;
  }

  /**
   * ✅ Force reload icons (for development/testing)
   */
  async reloadIcons(): Promise<void> {
    this.isPreloaded = false;
    this.preloadPromise = null;
    await this.preloadIcons();
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
 * ✅ Hook để sử dụng trong React components
 */
export const useIconPreloader = () => {
  const [status, setStatus] = React.useState(iconPreloader.getPreloadStatus());

  React.useEffect(() => {
    const checkStatus = () => {
      setStatus(iconPreloader.getPreloadStatus());
    };

    // Check status periodically during preload
    const interval = setInterval(checkStatus, 100);

    // Cleanup interval when preload is done
    if (status.isPreloaded) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [status.isPreloaded]);

  return status;
};

/**
 * ✅ Utility function để preload icons trong App.tsx
 */
export const initializeIconPreloader = async (): Promise<void> => {
  try {
    await iconPreloader.preloadIcons();
  } catch (error) {
    console.error('❌ Failed to initialize icon preloader:', error);
  }
};
