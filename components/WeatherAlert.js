import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../styles/theme/typography';
import { SPACING, RADIUS } from '../styles/theme/spacing';
import { useLocalization } from '../localization/LocalizationContext';
import * as Notifications from 'expo-notifications';

const WeatherAlert = ({ 
  alert, 
  onDismiss,
  visible = true,
}) => {
  const { t } = useLocalization();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (visible && alert) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [visible, alert]);

  const handleDismiss = () => {
    setShowModal(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!alert) return null;

  return (
    <>
      {/* Banner on home screen */}
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="warning" size={24} color={COLORS.appStatusWarning} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.alertText}>{alert.message}</Text>
        </View>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <MaterialIcons name="close" size={20} color={COLORS.appDarkTextSecondary} />
        </TouchableOpacity>
      </View>

      {/* Modal for detailed view */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="warning" size={28} color={COLORS.appStatusWarning} />
              <Text style={styles.modalTitle}>{t('weather.weatherAlert')}</Text>
            </View>
            <Text style={styles.modalMessage}>{alert.message}</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleDismiss}
            >
              <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Function to show a notification for weather alert
export const showWeatherAlertNotification = async (message) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weather Alert',
      body: message,
      data: { type: 'weather_alert' },
      priority: 'high',
    },
    trigger: null, // Show immediately
  });
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginVertical: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.appStatusWarning,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  contentContainer: {
    flex: 1,
  },
  alertText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
  },
  dismissButton: {
    padding: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.appDark,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.sm,
  },
  modalMessage: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalButton: {
    backgroundColor: COLORS.appPurple,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export default WeatherAlert;
