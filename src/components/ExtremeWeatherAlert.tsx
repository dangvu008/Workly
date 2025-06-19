/**
 * 🌪️ Extreme Weather Alert Component
 * Hiển thị cảnh báo thời tiết cực đoan trên HomeScreen
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated } from 'react-native';
import { Card, Text, Button, useTheme, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { FastIcon } from './WorklyIcon';
import { extremeWeatherService } from '../services/extremeWeatherService';
import { SPACING, BORDER_RADIUS } from '../constants/themes';

interface ExtremeWeatherAlertProps {
  onDismiss?: () => void;
}

export function ExtremeWeatherAlert({ onDismiss }: ExtremeWeatherAlertProps) {
  const theme = useTheme();
  const [warning, setWarning] = useState<{
    hasWarning: boolean;
    warningMessage: string;
    timestamp: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    loadCurrentWarning();
    
    // Check for updates every 30 seconds
    const interval = setInterval(loadCurrentWarning, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (warning?.hasWarning && !isVisible) {
      setIsVisible(true);
      showAlert();
    } else if (!warning?.hasWarning && isVisible) {
      hideAlert();
    }
  }, [warning, isVisible]);

  const loadCurrentWarning = async () => {
    try {
      const currentWarning = await extremeWeatherService.getCurrentExtremeWeatherWarning();
      setWarning(currentWarning);
    } catch (error) {
      console.error('Error loading current extreme weather warning:', error);
    }
  };

  const showAlert = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const handleDismiss = async () => {
    try {
      // Find the warning ID to dismiss
      const warnings = await extremeWeatherService.getExtremeWeatherWarnings();
      const latestWarning = warnings
        .filter(w => !w.dismissed)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (latestWarning) {
        await extremeWeatherService.dismissExtremeWeatherWarning(latestWarning.id);
      }
      
      hideAlert();
      onDismiss?.();
      
    } catch (error) {
      console.error('Error dismissing extreme weather warning:', error);
      Alert.alert('Lỗi', 'Không thể ẩn cảnh báo. Vui lòng thử lại.');
    }
  };

  const handleViewDetails = () => {
    Alert.alert(
      '🌪️ Chi tiết Cảnh báo Thời tiết',
      warning?.warningMessage || '',
      [
        { text: 'Đã hiểu', style: 'default' },
        { 
          text: 'Ẩn cảnh báo', 
          style: 'destructive',
          onPress: handleDismiss
        }
      ]
    );
  };

  const getWarningIcon = () => {
    const message = warning?.warningMessage || '';
    
    if (message.includes('mưa')) return 'weather-rainy';
    if (message.includes('lạnh')) return 'snowflake';
    if (message.includes('nóng')) return 'weather-sunny';
    if (message.includes('gió')) return 'weather-windy';
    if (message.includes('ngột ngạt')) return 'weather-humid';
    
    return 'weather-lightning';
  };

  const getGradientColors = (): [string, string] => {
    const message = warning?.warningMessage || '';
    
    if (message.includes('mưa')) return ['#1976D2', '#42A5F5'];
    if (message.includes('lạnh')) return ['#0277BD', '#29B6F6'];
    if (message.includes('nóng')) return ['#F57C00', '#FFB74D'];
    if (message.includes('gió')) return ['#5E35B1', '#9575CD'];
    
    return ['#D32F2F', '#EF5350']; // Default red for extreme conditions
  };

  const formatWarningTime = () => {
    if (!warning?.timestamp) return '';
    
    const warningTime = new Date(warning.timestamp);
    return warningTime.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible || !warning?.hasWarning) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={[styles.card, { backgroundColor: 'transparent' }]}>
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Card.Content style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <FastIcon
                  name={getWarningIcon()}
                  size={28}
                  color="#FFFFFF"
                />
              </View>
              
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  Cảnh báo Thời tiết Cực đoan
                </Text>
                <Text style={styles.timestamp}>
                  Cập nhật lúc {formatWarningTime()}
                </Text>
              </View>
              
              <IconButton
                icon="close"
                size={20}
                iconColor="#FFFFFF"
                style={styles.closeButton}
                onPress={handleDismiss}
              />
            </View>
            
            <Text style={styles.message} numberOfLines={3}>
              {warning.warningMessage}
            </Text>
            
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={handleViewDetails}
                style={[styles.button, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                labelStyle={styles.buttonLabel}
                compact
              >
                Xem chi tiết
              </Button>
              
              <Button
                mode="text"
                onPress={handleDismiss}
                style={styles.button}
                labelStyle={[styles.buttonLabel, { color: 'rgba(255, 255, 255, 0.8)' }]}
                compact
              >
                Đã xem
              </Button>
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: BORDER_RADIUS.lg,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    margin: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    borderRadius: BORDER_RADIUS.md,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
