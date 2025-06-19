/**
 * 🧪 Component debug để test weather notification fix
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { notificationScheduler } from '../services/notificationScheduler';
import { useApp } from '../contexts/AppContext';
import { WeatherApiDebug } from './WeatherApiDebug';

export function WeatherNotificationDebug() {
  const { state } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [showApiDebug, setShowApiDebug] = useState(false);

  const addToOutput = (message: string) => {
    setDebugOutput(prev => prev + '\n' + message);
  };

  const clearOutput = () => {
    setDebugOutput('');
  };

  const handleDebugNotifications = async () => {
    setIsLoading(true);
    clearOutput();
    
    try {
      addToOutput('🔍 Checking all scheduled notifications...');
      
      // Get all notifications
      const allNotifications = await notificationScheduler.getAllScheduledNotifications();
      addToOutput(`📊 Total notifications: ${allNotifications.length}`);
      
      // Filter weather notifications
      const weatherNotifications = allNotifications.filter((n: any) => {
        const id = n.identifier || '';
        return (
          id.startsWith('weather_check_') ||
          id.startsWith('weather_') ||
          id.includes('weather_')
        );
      });
      
      addToOutput(`🌤️ Weather notifications: ${weatherNotifications.length}`);
      
      if (weatherNotifications.length > 0) {
        addToOutput('\n📋 Weather notification details:');
        weatherNotifications.forEach((notification: any, index: number) => {
          const trigger = notification.trigger;
          const triggerDate = trigger?.date ? new Date(trigger.date * 1000) : null;
          const now = new Date();
          
          addToOutput(`${index + 1}. ${notification.identifier}`);
          addToOutput(`   Title: ${notification.content.title}`);
          if (triggerDate) {
            const status = triggerDate > now ? '✅ FUTURE' : '❌ PAST';
            addToOutput(`   Time: ${triggerDate.toLocaleString()} ${status}`);
          } else {
            addToOutput(`   Time: Immediate ⚡`);
          }
        });
      } else {
        addToOutput('✅ No weather notifications found');
      }
      
    } catch (error) {
      addToOutput(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupWeather = async () => {
    setIsLoading(true);
    
    try {
      addToOutput('\n🧹 Cleaning up weather notifications...');
      await notificationScheduler.cancelAllWeatherWarnings();
      addToOutput('✅ Weather cleanup completed');
      
      // Check again
      setTimeout(() => {
        handleDebugNotifications();
      }, 1000);
      
    } catch (error) {
      addToOutput(`❌ Cleanup error: ${error}`);
      setIsLoading(false);
    }
  };

  const handleTestWeatherWarning = async () => {
    setIsLoading(true);
    
    try {
      addToOutput('\n🌤️ Testing immediate weather warning...');
      await notificationScheduler.scheduleImmediateWeatherWarning(
        'Test weather warning - ' + new Date().toLocaleTimeString(),
        'Test Location'
      );
      addToOutput('✅ Weather warning sent');
      
      // Check notifications after
      setTimeout(() => {
        handleDebugNotifications();
      }, 1000);
      
    } catch (error) {
      addToOutput(`❌ Test error: ${error}`);
      setIsLoading(false);
    }
  };

  const handleTestScheduledWeather = async () => {
    if (!state.activeShift) {
      Alert.alert('Lỗi', 'Cần có active shift để test scheduled weather warning');
      return;
    }

    setIsLoading(true);
    
    try {
      addToOutput('\n🌤️ Testing scheduled weather warning...');
      
      // Schedule for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await notificationScheduler.scheduleWeatherWarning(state.activeShift, tomorrow);
      addToOutput(`✅ Scheduled weather warning for ${tomorrow.toDateString()}`);
      
      // Check notifications after
      setTimeout(() => {
        handleDebugNotifications();
      }, 1000);
      
    } catch (error) {
      addToOutput(`❌ Schedule error: ${error}`);
      setIsLoading(false);
    }
  };

  const handleTestCurrentWeather = async () => {
    if (!state.activeShift) {
      Alert.alert('Lỗi', 'Cần có active shift để test current weather notification');
      return;
    }

    setIsLoading(true);

    try {
      addToOutput('\n🌡️ Testing current weather notification...');

      const today = new Date().toISOString().split('T')[0];
      await notificationScheduler.sendWeatherNotificationWithCurrentData(state.activeShift, today);
      addToOutput('✅ Current weather notification sent');

      // Check notifications after
      setTimeout(() => {
        handleDebugNotifications();
      }, 1000);

    } catch (error) {
      addToOutput(`❌ Current weather error: ${error}`);
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        🧪 Weather Notification Debug
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, margin: 4 }}
          onPress={handleDebugNotifications}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🔍 Debug Notifications
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#FF3B30', padding: 12, borderRadius: 8, margin: 4 }}
          onPress={handleCleanupWeather}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🧹 Cleanup Weather
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#34C759', padding: 12, borderRadius: 8, margin: 4 }}
          onPress={handleTestWeatherWarning}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🌤️ Test Immediate
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#FF9500', padding: 12, borderRadius: 8, margin: 4 }}
          onPress={handleTestScheduledWeather}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            📅 Test Scheduled
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#5856D6', padding: 12, borderRadius: 8, margin: 4 }}
          onPress={handleTestCurrentWeather}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🌡️ Test Current Weather
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#8E8E93', padding: 12, borderRadius: 8, margin: 4 }}
          onPress={clearOutput}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🗑️ Clear Output
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#AF52DE', padding: 12, borderRadius: 8, margin: 4 }}
          onPress={() => setShowApiDebug(true)}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🔑 API Keys Debug
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={{ 
          flex: 1, 
          backgroundColor: '#000', 
          padding: 12, 
          borderRadius: 8 
        }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={{ color: '#00FF00', fontFamily: 'monospace', fontSize: 12 }}>
          {debugOutput || '📝 Output will appear here...'}
        </Text>
      </ScrollView>
      
      {isLoading && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Text style={{ color: 'white', fontSize: 16 }}>⏳ Processing...</Text>
        </View>
      )}

      {/* API Debug Modal */}
      <Modal
        visible={showApiDebug}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApiDebug(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              🔑 Weather API Keys Debug
            </Text>
            <TouchableOpacity
              onPress={() => setShowApiDebug(false)}
              style={{
                backgroundColor: '#FF3B30',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
          <WeatherApiDebug />
        </View>
      </Modal>
    </View>
  );
}
