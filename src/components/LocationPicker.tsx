import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  useTheme,
  ActivityIndicator,
  Chip,
  Divider
} from 'react-native-paper';
// import * as Location from 'expo-location'; // Tạm thời comment để tránh lỗi
import { SavedLocation } from '../types';
import { t } from '../i18n';
import { useApp } from '../contexts/AppContext';
import { SPACING, BORDER_RADIUS } from '../constants/themes';
import { WorklyIconButton, COMMON_ICONS } from './WorklyIcon';

interface LocationPickerProps {
  title: string;
  currentLocation: SavedLocation | null;
  onLocationSave: (location: SavedLocation) => void;
  onLocationRemove: () => void;
  defaultRadius?: number;
  locationType: 'home' | 'work';
}

export function LocationPicker({
  title,
  currentLocation,
  onLocationSave,
  onLocationRemove,
  defaultRadius = 100,
  locationType
}: LocationPickerProps) {
  const theme = useTheme();
  const { state } = useApp();
  const currentLanguage = state.settings?.language || 'vi';

  const [isLoading, setIsLoading] = useState(false);
  const [locationName, setLocationName] = useState(currentLocation?.name || '');
  const [address, setAddress] = useState(currentLocation?.address || '');
  const [radius, setRadius] = useState(currentLocation?.radius?.toString() || defaultRadius.toString());
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(
    currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : null
  );

  // ✅ Lấy vị trí hiện tại (tạm thời dùng mock data)
  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);

      // Giả lập delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data để tránh lỗi Location
      const mockLatitude = 10.7769;
      const mockLongitude = 106.7009;

      setCoordinates({ lat: mockLatitude, lng: mockLongitude });
      setAddress('TP. Hồ Chí Minh, Việt Nam');

      // Đặt tên mặc định nếu chưa có
      if (!locationName) {
        const defaultName = locationType === 'home'
          ? t(currentLanguage, 'location.home_default_name')
          : t(currentLanguage, 'location.work_default_name');
        setLocationName(defaultName);
      }

    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        t(currentLanguage, 'common.error'),
        t(currentLanguage, 'location.get_location_error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Lưu vị trí
  const saveLocation = () => {
    if (!locationName.trim()) {
      Alert.alert(
        t(currentLanguage, 'common.error'),
        t(currentLanguage, 'location.name_required')
      );
      return;
    }

    if (!coordinates) {
      Alert.alert(
        t(currentLanguage, 'common.error'),
        t(currentLanguage, 'location.coordinates_required')
      );
      return;
    }

    const radiusNum = parseInt(radius) || defaultRadius;
    if (radiusNum < 10 || radiusNum > 1000) {
      Alert.alert(
        t(currentLanguage, 'common.error'),
        t(currentLanguage, 'location.radius_invalid')
      );
      return;
    }

    const savedLocation: SavedLocation = {
      id: currentLocation?.id || `${locationType}_${Date.now()}`,
      name: locationName.trim(),
      address: address.trim(),
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      radius: radiusNum,
      createdAt: currentLocation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onLocationSave(savedLocation);
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {title}
          </Text>
          {currentLocation && (
            <WorklyIconButton
              icon={COMMON_ICONS.DELETE}
              size={20}
              onPress={onLocationRemove}
              iconColor={theme.colors.error}
            />
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Tên vị trí */}
        <TextInput
          label={t(currentLanguage, 'location.name_label')}
          value={locationName}
          onChangeText={setLocationName}
          style={styles.input}
          placeholder={locationType === 'home' 
            ? t(currentLanguage, 'location.home_placeholder')
            : t(currentLanguage, 'location.work_placeholder')
          }
        />

        {/* Địa chỉ */}
        <TextInput
          label={t(currentLanguage, 'location.address_label')}
          value={address}
          onChangeText={setAddress}
          style={styles.input}
          multiline
          numberOfLines={2}
          placeholder={t(currentLanguage, 'location.address_placeholder')}
        />

        {/* Bán kính */}
        <TextInput
          label={t(currentLanguage, 'location.radius_label')}
          value={radius}
          onChangeText={setRadius}
          style={styles.input}
          keyboardType="numeric"
          right={<TextInput.Affix text="m" />}
          placeholder="100"
        />

        {/* Hiển thị tọa độ nếu có */}
        {coordinates && (
          <View style={styles.coordinatesContainer}>
            <Chip icon="map-marker" compact>
              {`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
            </Chip>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={getCurrentLocation}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            icon="crosshairs-gps"
          >
            {t(currentLanguage, 'location.get_current')}
          </Button>

          <Button
            mode="contained"
            onPress={saveLocation}
            disabled={!locationName.trim() || !coordinates || isLoading}
            style={styles.button}
            icon="content-save"
          >
            {t(currentLanguage, 'common.save')}
          </Button>
        </View>

        {/* Thông tin hiện tại */}
        {currentLocation && (
          <View style={styles.currentInfo}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t(currentLanguage, 'location.last_updated')}: {' '}
              {new Date(currentLocation.updatedAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  divider: {
    marginBottom: SPACING.md,
  },
  input: {
    marginBottom: SPACING.sm,
  },
  coordinatesContainer: {
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  button: {
    flex: 1,
  },
  currentInfo: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
