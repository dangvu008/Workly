import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  Button,
  Divider,
  useTheme,
  Menu,
} from 'react-native-paper';
import { WorklyIconButton, COMMON_ICONS } from '../components/WorklyIcon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { LANGUAGES } from '../constants';
import { TabParamList, RootStackParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { t } from '../i18n';
import { WorklyBackground } from '../components/WorklyBackground';
// ✅ PRODUCTION: Debug components removed


type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'SettingsTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [modeMenuVisible, setModeMenuVisible] = useState(false);
  // ✅ PRODUCTION: Debug panel removed

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  // Status messages
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | '';
    message: string;
  }>({ type: '', message: '' });

  // Confirmation states
  const [confirmStates, setConfirmStates] = useState({
    resetWeatherLocation: false,
    // ✅ PRODUCTION: Sample notes removed
    clearAllNotes: false,
  });

  const settings = state.settings;

  if (!settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>{t(currentLanguage, 'messages.loadingSettings')}</Text>
      </SafeAreaView>
    );
  }

  const handleBackupData = async () => {
    try {
      setStatusMessage({
        type: 'info',
        message: t(currentLanguage, 'messages.backupFeatureComingSoon')
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: t(currentLanguage, 'messages.cannotBackupData')
      });
    }
  };

  const handleRestoreData = async () => {
    try {
      setStatusMessage({
        type: 'info',
        message: t(currentLanguage, 'messages.restoreFeatureComingSoon')
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: t(currentLanguage, 'messages.cannotRestoreData')
      });
    }
  };

  const handleResetWeatherLocation = () => {
    setConfirmStates(prev => ({ ...prev, resetWeatherLocation: true }));
  };

  const confirmResetWeatherLocation = async () => {
    try {
      setStatusMessage({ type: '', message: '' });
      await actions.updateSettings({ weatherLocation: null });
      setStatusMessage({
        type: 'success',
        message: t(currentLanguage, 'messages.locationDeletedSuccessfully')
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: t(currentLanguage, 'messages.cannotDeleteLocation')
      });
    }
    setConfirmStates(prev => ({ ...prev, resetWeatherLocation: false }));
  };

  // ✅ PRODUCTION: Sample data functions removed

  const handleClearAllNotes = () => {
    setConfirmStates(prev => ({ ...prev, clearAllNotes: true }));
  };

  const confirmClearAllNotes = async () => {
    try {
      setStatusMessage({ type: '', message: '' });
      // ✅ PRODUCTION: Clear all notes directly through storage
      const { storageService } = await import('../services/storage');
      await storageService.setNotes([]);
      // Reload data to reflect changes
      await actions.loadInitialData();
      setStatusMessage({
        type: 'success',
        message: t(currentLanguage, 'messages.allNotesDeletedSuccessfully')
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: t(currentLanguage, 'messages.cannotDeleteNotes')
      });
    }
    setConfirmStates(prev => ({ ...prev, clearAllNotes: false }));
  };

  return (
    <WorklyBackground variant="minimal">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <View style={{ width: 48 }} />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {t(currentLanguage, 'settings.title')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* General Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'settings.general')}
            </Text>

            <List.Item
              title={t(currentLanguage, 'settings.language')}
              description={LANGUAGES[settings.language as keyof typeof LANGUAGES]}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={() => (
                <Menu
                  visible={languageMenuVisible}
                  onDismiss={() => setLanguageMenuVisible(false)}
                  anchor={
                    <WorklyIconButton
                      name={COMMON_ICONS.chevronDown}
                      onPress={() => setLanguageMenuVisible(true)}
                    />
                  }
                >
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <Menu.Item
                      key={code}
                      onPress={() => {
                        actions.updateSettings({ language: code });
                        setLanguageMenuVisible(false);
                      }}
                      title={name}
                    />
                  ))}
                </Menu>
              )}
            />

            <List.Item
              title={t(currentLanguage, 'settings.theme')}
              description={settings.theme === 'dark' ? t(currentLanguage, 'settings.dark') : t(currentLanguage, 'settings.light')}
              left={(props) => <List.Icon {...props} icon="palette" />}
              right={() => (
                <Switch
                  value={settings.theme === 'dark'}
                  onValueChange={(value) =>
                    actions.updateSettings({ theme: value ? 'dark' : 'light' })
                  }
                />
              )}
            />

            <List.Item
              title={t(currentLanguage, 'settings.multiButtonMode')}
              description={settings.multiButtonMode === 'full' ? t(currentLanguage, 'settings.full') : t(currentLanguage, 'settings.simple')}
              left={(props) => <List.Icon {...props} icon="gesture-tap-button" />}
              right={() => (
                <Menu
                  visible={modeMenuVisible}
                  onDismiss={() => setModeMenuVisible(false)}
                  anchor={
                    <WorklyIconButton
                      name={COMMON_ICONS.chevronDown}
                      onPress={() => setModeMenuVisible(true)}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      actions.updateSettings({ multiButtonMode: 'full' });
                      setModeMenuVisible(false);
                    }}
                    title={t(currentLanguage, 'settings.full')}
                  />
                  <Menu.Item
                    onPress={() => {
                      actions.updateSettings({ multiButtonMode: 'simple' });
                      setModeMenuVisible(false);
                    }}
                    title={t(currentLanguage, 'settings.simple')}
                  />
                </Menu>
              )}
            />
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'settings.notificationsAndAlarms')}
            </Text>

            <List.Item
              title={t(currentLanguage, 'settings.alarmSound')}
              left={(props) => <List.Icon {...props} icon="volume-high" />}
              right={() => (
                <Switch
                  value={settings.alarmSoundEnabled}
                  onValueChange={(value) =>
                    actions.updateSettings({ alarmSoundEnabled: value })
                  }
                />
              )}
            />

            <List.Item
              title={t(currentLanguage, 'settings.vibration')}
              left={(props) => <List.Icon {...props} icon="vibrate" />}
              right={() => (
                <Switch
                  value={settings.alarmVibrationEnabled}
                  onValueChange={(value) =>
                    actions.updateSettings({ alarmVibrationEnabled: value })
                  }
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Weather */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'settings.weather')}
            </Text>

            <List.Item
              title={t(currentLanguage, 'settings.weatherWarnings')}
              left={(props) => <List.Icon {...props} icon="weather-partly-cloudy" />}
              right={() => (
                <Switch
                  value={settings.weatherWarningEnabled}
                  onValueChange={(value) =>
                    actions.updateSettings({ weatherWarningEnabled: value })
                  }
                />
              )}
            />

            {settings.weatherLocation && (
              <List.Item
                title={t(currentLanguage, 'settings.locationManagement')}
                description={`${t(currentLanguage, 'settings.savedLocation')} ${settings.weatherLocation.home ? t(currentLanguage, 'settings.homeLocation') : ''}${settings.weatherLocation.home && settings.weatherLocation.work ? t(currentLanguage, 'settings.and') : ''}${settings.weatherLocation.work ? t(currentLanguage, 'settings.workLocation') : ''}`}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                right={(props) => <List.Icon {...props} icon="delete" />}
                onPress={handleResetWeatherLocation}
              />
            )}
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'settings.dataManagement')}
            </Text>

            <List.Item
              title={t(currentLanguage, 'settings.backupData')}
              left={(props) => <List.Icon {...props} icon="backup-restore" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleBackupData}
            />

            <List.Item
              title={t(currentLanguage, 'settings.restoreData')}
              left={(props) => <List.Icon {...props} icon="restore" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleRestoreData}
            />
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'settings.about')}
            </Text>

            <List.Item
              title={t(currentLanguage, 'settings.appVersion')}
              description={t(currentLanguage, 'settings.version')}
              left={(props) => <List.Icon {...props} icon="information" />}
            />

          </Card.Content>
        </Card>

        {/* Status Messages */}
        {statusMessage.message && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[
                styles.statusMessage,
                {
                  color: statusMessage.type === 'success'
                    ? theme.colors.primary
                    : statusMessage.type === 'error'
                    ? theme.colors.error
                    : theme.colors.onSurface
                }
              ]}>
                {statusMessage.message}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Confirmation Dialogs */}
        {confirmStates.resetWeatherLocation && (
          <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={[styles.confirmTitle, { color: theme.colors.onErrorContainer }]}>
                {t(currentLanguage, 'messages.confirmDeleteLocation')}
              </Text>
              <Text style={[styles.confirmMessage, { color: theme.colors.onErrorContainer }]}>
                {t(currentLanguage, 'messages.confirmDeleteLocationDescription')}
              </Text>
              <View style={styles.confirmActions}>
                <Button
                  mode="outlined"
                  onPress={() => setConfirmStates(prev => ({ ...prev, resetWeatherLocation: false }))}
                  style={styles.cancelButton}
                  textColor={theme.colors.onErrorContainer}
                >
                  {t(currentLanguage, 'common.cancel')}
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmResetWeatherLocation}
                  style={[styles.confirmButton, { backgroundColor: theme.colors.error }]}
                  textColor={theme.colors.onError}
                >
                  {t(currentLanguage, 'common.delete')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* ✅ PRODUCTION: Sample notes confirmation removed */}

        {confirmStates.clearAllNotes && (
          <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={[styles.confirmTitle, { color: theme.colors.onErrorContainer }]}>
                {t(currentLanguage, 'messages.confirmDeleteAllNotes')}
              </Text>
              <Text style={[styles.confirmMessage, { color: theme.colors.onErrorContainer }]}>
                {t(currentLanguage, 'messages.confirmDeleteAllNotesDescription')}
              </Text>
              <View style={styles.confirmActions}>
                <Button
                  mode="outlined"
                  onPress={() => setConfirmStates(prev => ({ ...prev, clearAllNotes: false }))}
                  style={styles.cancelButton}
                  textColor={theme.colors.onErrorContainer}
                >
                  {t(currentLanguage, 'common.cancel')}
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmClearAllNotes}
                  style={[styles.confirmButton, { backgroundColor: theme.colors.error }]}
                  textColor={theme.colors.onError}
                >
                  {t(currentLanguage, 'messages.deleteAll')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      </SafeAreaView>

      {/* ✅ PRODUCTION: Debug panel modal removed */}
    </WorklyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: 'transparent',
  },
  confirmButton: {
    flex: 1,
  },
});
