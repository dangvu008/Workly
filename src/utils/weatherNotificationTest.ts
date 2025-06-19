/**
 * 🧪 Weather Notification Test Utility
 * Kiểm tra và verify rằng spam weather notification đã được khắc phục
 */

import { notificationScheduler } from '../services/notificationScheduler';
import { extremeWeatherService } from '../services/extremeWeatherService';
import { Notifications } from 'expo-notifications';

interface NotificationTestResult {
  totalNotifications: number;
  weatherNotifications: number;
  extremeWeatherNotifications: number;
  duplicateIds: string[];
  spamDetected: boolean;
  testPassed: boolean;
}

class WeatherNotificationTester {
  
  /**
   * ✅ Test chính để kiểm tra spam notification
   */
  async runSpamDetectionTest(): Promise<NotificationTestResult> {
    console.log('🧪 Starting Weather Notification Spam Detection Test...');
    
    try {
      // 1. Lấy tất cả notifications hiện tại
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📊 Total scheduled notifications: ${allNotifications.length}`);
      
      // 2. Phân loại weather notifications
      const weatherNotifications = allNotifications.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.startsWith('weather_check_') ||
          id.startsWith('weather_') ||
          id.includes('weather_') ||
          (n.content?.data?.type && (
            n.content.data.type === 'weather_check' ||
            n.content.data.type === 'weather' ||
            n.content.data.type === 'weather_current'
          ))
        );
      });
      
      // 3. Phân loại extreme weather notifications
      const extremeWeatherNotifications = allNotifications.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.startsWith('extreme_weather_') ||
          id.includes('extreme_weather_') ||
          (n.content?.data?.type && (
            n.content.data.type === 'extreme_weather_check' ||
            n.content.data.type === 'extreme_weather_warning'
          ))
        );
      });
      
      // 4. Kiểm tra duplicate IDs
      const allIds = allNotifications.map((n: any) => n.identifier);
      const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
      
      // 5. Phân tích spam patterns
      const spamDetected = this.detectSpamPatterns(allNotifications);
      
      // 6. Log chi tiết
      console.log('📋 Weather Notifications:');
      weatherNotifications.forEach((n: any) => {
        console.log(`  - ${n.identifier} (${n.content?.data?.type || 'unknown'})`);
      });
      
      console.log('📋 Extreme Weather Notifications:');
      extremeWeatherNotifications.forEach((n: any) => {
        console.log(`  - ${n.identifier} (${n.content?.data?.type || 'unknown'})`);
      });
      
      if (duplicateIds.length > 0) {
        console.log('⚠️ Duplicate IDs detected:');
        duplicateIds.forEach(id => console.log(`  - ${id}`));
      }
      
      // 7. Đánh giá kết quả
      const testPassed = !spamDetected && duplicateIds.length === 0 && 
                        weatherNotifications.length <= 7 && // Tối đa 7 ngày
                        extremeWeatherNotifications.length <= 7;
      
      const result: NotificationTestResult = {
        totalNotifications: allNotifications.length,
        weatherNotifications: weatherNotifications.length,
        extremeWeatherNotifications: extremeWeatherNotifications.length,
        duplicateIds,
        spamDetected,
        testPassed
      };
      
      console.log('🧪 Test Results:', result);
      
      if (testPassed) {
        console.log('✅ SPAM DETECTION TEST PASSED - No spam detected!');
      } else {
        console.log('❌ SPAM DETECTION TEST FAILED - Spam patterns detected!');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error running spam detection test:', error);
      throw error;
    }
  }
  
  /**
   * ✅ Phát hiện spam patterns
   */
  private detectSpamPatterns(notifications: any[]): boolean {
    // Pattern 1: Quá nhiều notifications cùng loại trong thời gian ngắn
    const weatherNotifications = notifications.filter((n: any) => {
      const id = n.identifier || '';
      return id.includes('weather_');
    });
    
    if (weatherNotifications.length > 20) {
      console.log('⚠️ Spam Pattern 1: Too many weather notifications');
      return true;
    }
    
    // Pattern 2: Notifications với timestamp gần nhau (< 1 phút)
    const timestamps = notifications
      .filter((n: any) => n.identifier?.includes('weather_'))
      .map((n: any) => {
        const match = n.identifier.match(/_(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(t => t > 0)
      .sort();
    
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] - timestamps[i-1] < 60000) { // < 1 minute
        console.log('⚠️ Spam Pattern 2: Notifications created too close together');
        return true;
      }
    }
    
    // Pattern 3: Duplicate content
    const contents = notifications.map((n: any) => n.content?.body || '');
    const uniqueContents = [...new Set(contents)];
    if (contents.length > uniqueContents.length * 2) {
      console.log('⚠️ Spam Pattern 3: Too many duplicate contents');
      return true;
    }
    
    return false;
  }
  
  /**
   * ✅ Test cleanup functionality
   */
  async testCleanupFunctionality(): Promise<boolean> {
    console.log('🧹 Testing cleanup functionality...');
    
    try {
      // 1. Cleanup tất cả weather notifications
      await notificationScheduler.cancelAllWeatherWarnings();
      await extremeWeatherService.cancelAllExtremeWeatherChecks();
      
      // 2. Đợi một chút để cleanup hoàn tất
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Kiểm tra lại
      const remainingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const remainingWeather = remainingNotifications.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.includes('weather_') ||
          id.includes('extreme_weather_')
        );
      });
      
      console.log(`🧹 Remaining weather notifications after cleanup: ${remainingWeather.length}`);
      
      if (remainingWeather.length === 0) {
        console.log('✅ CLEANUP TEST PASSED - All weather notifications cleaned up!');
        return true;
      } else {
        console.log('❌ CLEANUP TEST FAILED - Some weather notifications remain:');
        remainingWeather.forEach((n: any) => {
          console.log(`  - ${n.identifier}`);
        });
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error testing cleanup functionality:', error);
      return false;
    }
  }
  
  /**
   * ✅ Chạy full test suite
   */
  async runFullTestSuite(): Promise<{
    spamTest: NotificationTestResult;
    cleanupTest: boolean;
    overallPassed: boolean;
  }> {
    console.log('🚀 Running Full Weather Notification Test Suite...');
    
    const spamTest = await this.runSpamDetectionTest();
    const cleanupTest = await this.testCleanupFunctionality();
    
    const overallPassed = spamTest.testPassed && cleanupTest;
    
    console.log('\n📊 FINAL TEST RESULTS:');
    console.log(`  Spam Detection: ${spamTest.testPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Cleanup Test: ${cleanupTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Overall: ${overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return {
      spamTest,
      cleanupTest,
      overallPassed
    };
  }
}

export const weatherNotificationTester = new WeatherNotificationTester();
