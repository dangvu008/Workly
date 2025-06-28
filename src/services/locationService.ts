/**
 * Location Service - Quản lý vị trí và tự động chấm công
 */

import * as Location from 'expo-location';
import { SavedLocation, UserSettings } from '../types';
import { storageService } from './storage';
import { isExpoGo } from '../utils/expoGoCompat';

interface LocationStatus {
  isNearWork: boolean;
  isNearHome: boolean;
  distanceToWork: number | null;
  distanceToHome: number | null;
  currentLocation: Location.LocationObject | null;
  lastChecked: Date;
}

interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  message: string;
}

class LocationService {
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private lastKnownLocation: Location.LocationObject | null = null;
  private locationCallbacks: ((status: LocationStatus) => void)[] = [];

  /**
   * ✅ Kiểm tra và yêu cầu quyền truy cập vị trí
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      // Kiểm tra quyền hiện tại
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return {
          granted: true,
          canAskAgain: true,
          message: 'Permission already granted'
        };
      }

      // Yêu cầu quyền
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        message: status === 'granted' 
          ? 'Permission granted' 
          : 'Permission denied'
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        message: 'Error requesting permission'
      };
    }
  }

  /**
   * ✅ Lấy vị trí hiện tại
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 60000, // Cache 1 phút
      });

      this.lastKnownLocation = location;
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * ✅ Tính khoảng cách giữa 2 điểm (Haversine formula)
   */
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3; // Bán kính Trái Đất (mét)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Khoảng cách tính bằng mét
  }

  /**
   * ✅ Kiểm tra người dùng có ở gần vị trí đã lưu không
   */
  async checkProximityToSavedLocations(): Promise<LocationStatus> {
    try {
      const settings = await storageService.getUserSettings();
      const currentLocation = await this.getCurrentLocation();

      if (!currentLocation) {
        return {
          isNearWork: false,
          isNearHome: false,
          distanceToWork: null,
          distanceToHome: null,
          currentLocation: null,
          lastChecked: new Date(),
        };
      }

      const { latitude, longitude } = currentLocation.coords;
      
      // Tính khoảng cách đến công ty
      let distanceToWork: number | null = null;
      let isNearWork = false;
      
      if (settings.workLocation) {
        distanceToWork = this.calculateDistance(
          latitude,
          longitude,
          settings.workLocation.latitude,
          settings.workLocation.longitude
        );
        isNearWork = distanceToWork <= settings.workLocation.radius;
      }

      // Tính khoảng cách đến nhà
      let distanceToHome: number | null = null;
      let isNearHome = false;
      
      if (settings.homeLocation) {
        distanceToHome = this.calculateDistance(
          latitude,
          longitude,
          settings.homeLocation.latitude,
          settings.homeLocation.longitude
        );
        isNearHome = distanceToHome <= settings.homeLocation.radius;
      }

      const status: LocationStatus = {
        isNearWork,
        isNearHome,
        distanceToWork,
        distanceToHome,
        currentLocation,
        lastChecked: new Date(),
      };

      // Thông báo cho các callbacks
      this.locationCallbacks.forEach(callback => callback(status));

      return status;
    } catch (error) {
      console.error('Error checking proximity:', error);
      return {
        isNearWork: false,
        isNearHome: false,
        distanceToWork: null,
        distanceToHome: null,
        currentLocation: null,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * ✅ Bắt đầu theo dõi vị trí
   */
  async startLocationTracking(): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.log('Location tracking already started');
        return true;
      }

      // Kiểm tra Expo Go compatibility
      if (isExpoGo()) {
        console.log('⚠️ Location tracking có thể bị hạn chế trên Expo Go');
      }

      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        console.error('Location permission not granted');
        return false;
      }

      const settings = await storageService.getUserSettings();
      if (!settings.locationTrackingEnabled) {
        console.log('Location tracking disabled in settings');
        return false;
      }

      this.isTracking = true;
      
      // Kiểm tra vị trí mỗi 2 phút
      this.trackingInterval = setInterval(async () => {
        await this.checkProximityToSavedLocations();
      }, 120000); // 2 phút

      // Kiểm tra ngay lập tức
      await this.checkProximityToSavedLocations();

      console.log('✅ Location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  /**
   * ✅ Dừng theo dõi vị trí
   */
  stopLocationTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.isTracking = false;
    console.log('✅ Location tracking stopped');
  }

  /**
   * ✅ Đăng ký callback khi có thay đổi vị trí
   */
  onLocationUpdate(callback: (status: LocationStatus) => void): () => void {
    this.locationCallbacks.push(callback);
    
    // Trả về function để unsubscribe
    return () => {
      const index = this.locationCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * ✅ Lấy trạng thái tracking hiện tại
   */
  getTrackingStatus(): { isTracking: boolean; lastKnownLocation: Location.LocationObject | null } {
    return {
      isTracking: this.isTracking,
      lastKnownLocation: this.lastKnownLocation,
    };
  }

  /**
   * ✅ Cleanup khi app bị đóng
   */
  cleanup(): void {
    this.stopLocationTracking();
    this.locationCallbacks = [];
    this.lastKnownLocation = null;
  }
}

export const locationService = new LocationService();
