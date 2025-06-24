import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Icon, useTheme } from 'react-native-paper';
import { useApp } from '../contexts/AppContext';
import { t } from '../i18n';
import { SPACING, TYPOGRAPHY } from '../constants/themes';

/**
 * Banner thông báo về giới hạn của Expo Go
 * Hiển thị khi ứng dụng chạy trong Expo Go và notifications bị hạn chế
 */
const ExpoGoBanner: React.FC = () => {
  const theme = useTheme();
  const { state } = useApp();

  // Kiểm tra xem có đang chạy trong Expo Go không
  const isExpoGo = () => {
    try {
      const Constants = require('expo-constants');
      return Constants?.executionEnvironment === 'storeClient';
    } catch {
      return false;
    }
  };

  // Chỉ hiển thị banner khi chạy trong Expo Go
  if (!isExpoGo()) {
    return null;
  }

  return (
    <Card style={[styles.banner, { backgroundColor: theme.colors.primaryContainer }]}>
      <Card.Content style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon source="information" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="titleSmall" style={[styles.title, { color: theme.colors.primary }]}>
            {t(state.settings.language, 'expo.bannerTitle')}
          </Text>
          <Text variant="bodySmall" style={[styles.message, { color: theme.colors.onPrimaryContainer }]}>
            {t(state.settings.language, 'expo.bannerMessage')}
          </Text>
          <Text variant="bodySmall" style={[styles.alternative, { color: theme.colors.onPrimaryContainer }]}>
            {t(state.settings.language, 'expo.bannerAlternative')}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  banner: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  iconContainer: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  message: {
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  alternative: {
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default ExpoGoBanner;
