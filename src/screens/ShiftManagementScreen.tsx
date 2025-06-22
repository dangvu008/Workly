import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  List,
  Button,
  IconButton,
  useTheme,
  Chip,
  FAB,
  Menu,
  RadioButton,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { Shift } from '../types';
import { TabParamList, RootStackParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { t } from '../i18n';
import { WorklyBackground } from '../components/WorklyBackground';
import { formatWorkDays as formatWorkDaysFromService } from '../services/sampleShifts';

type ShiftManagementScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'ShiftsTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface ShiftManagementScreenProps {
  navigation: ShiftManagementScreenNavigationProp;
  route: {
    params?: {
      mode?: 'select_rotation';
    };
  };
}

export function ShiftManagementScreen({ navigation, route }: ShiftManagementScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [frequencyMenuVisible, setFrequencyMenuVisible] = useState(false);
  const [modeMenuVisible, setModeMenuVisible] = useState(false);

  const isRotationMode = route.params?.mode === 'select_rotation';
  const settings = state.settings;

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  // Initialize selected shifts for rotation mode
  React.useEffect(() => {
    if (isRotationMode && settings?.rotationConfig?.rotationShifts) {
      setSelectedShifts(settings.rotationConfig.rotationShifts);
    }
  }, [isRotationMode, settings?.rotationConfig?.rotationShifts]);

  // ✅ Refresh shifts when screen is focused to ensure new sample shifts are loaded
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 ShiftManagementScreen: Screen focused, refreshing shifts...');
      actions.refreshShifts();
    });

    return unsubscribe;
  }, [navigation, actions]);

  const handleSelectShift = async (shiftId: string) => {
    if (isRotationMode) {
      // Multi-select for rotation
      setSelectedShifts(prev => {
        if (prev.includes(shiftId)) {
          return prev.filter(id => id !== shiftId);
        } else if (prev.length < 3) {
          return [...prev, shiftId];
        } else {
          Alert.alert(t(currentLanguage, 'common.info'), t(currentLanguage, 'shifts.maxRotationShifts'));
          return prev;
        }
      });
    } else {
      // Single select for active shift
      try {
        await actions.setActiveShift(shiftId);
        Alert.alert(t(currentLanguage, 'common.success'), t(currentLanguage, 'shifts.successSelected'));
      } catch (error) {
        Alert.alert(t(currentLanguage, 'common.error'), t(currentLanguage, 'shifts.errorSelect'));
      }
    }
  };

  const handleDeleteShift = (shift: Shift) => {
    Alert.alert(
      t(currentLanguage, 'shifts.confirmDelete'),
      t(currentLanguage, 'shifts.confirmDeleteMessage').replace('{name}', shift.name),
      [
        { text: t(currentLanguage, 'common.cancel'), style: 'cancel' },
        {
          text: t(currentLanguage, 'common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.deleteShift(shift.id);
              Alert.alert(t(currentLanguage, 'common.success'), t(currentLanguage, 'shifts.successDeleted'));
            } catch (error) {
              Alert.alert(t(currentLanguage, 'common.error'), t(currentLanguage, 'shifts.errorDelete'));
            }
          }
        }
      ]
    );
  };

  const handleModeChange = async (mode: 'disabled' | 'ask_weekly' | 'rotate') => {
    try {
      if (mode === 'disabled') {
        await actions.updateSettings({
          changeShiftReminderMode: mode,
          rotationConfig: undefined,
        });
      } else {
        await actions.updateSettings({
          changeShiftReminderMode: mode,
        });
      }
      Alert.alert(t(currentLanguage, 'common.success'), t(currentLanguage, 'shifts.successUpdatedMode'));
    } catch (error) {
      Alert.alert(t(currentLanguage, 'common.error'), t(currentLanguage, 'shifts.errorUpdateMode'));
    }
  };

  const handleSelectRotationShifts = () => {
    navigation.navigate('ShiftManagement', { mode: 'select_rotation' });
  };

  const handleFrequencyChange = async (frequency: 'weekly' | 'biweekly' | 'triweekly' | 'monthly') => {
    try {
      const currentConfig = settings?.rotationConfig;
      await actions.updateSettings({
        rotationConfig: {
          rotationShifts: currentConfig?.rotationShifts || [],
          rotationFrequency: frequency,
          rotationLastAppliedDate: currentConfig?.rotationLastAppliedDate,
          currentRotationIndex: currentConfig?.currentRotationIndex || 0,
        }
      });
      setFrequencyMenuVisible(false);
      Alert.alert(t(currentLanguage, 'common.success'), t(currentLanguage, 'shifts.successUpdatedFrequency'));
    } catch (error) {
      Alert.alert(t(currentLanguage, 'common.error'), t(currentLanguage, 'shifts.errorUpdateFrequency'));
    }
  };

  const handleConfirmRotation = async () => {
    if (selectedShifts.length < 2) {
      Alert.alert(t(currentLanguage, 'common.info'), t(currentLanguage, 'shifts.minRotationShifts'));
      return;
    }

    try {
      // Find current active shift index in selected shifts
      const currentActiveIndex = selectedShifts.findIndex(id => id === state.activeShift?.id);

      await actions.updateSettings({
        rotationConfig: {
          rotationShifts: selectedShifts,
          rotationFrequency: settings?.rotationConfig?.rotationFrequency || 'weekly',
          rotationLastAppliedDate: new Date().toISOString(),
          currentRotationIndex: currentActiveIndex >= 0 ? currentActiveIndex : 0,
        }
      });
      Alert.alert(t(currentLanguage, 'common.success'), t(currentLanguage, 'shifts.successConfiguredRotation'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t(currentLanguage, 'common.error'), t(currentLanguage, 'shifts.errorConfigureRotation'));
    }
  };

  // ✅ Sử dụng formatWorkDays từ sampleShifts service với đa ngôn ngữ
  const formatWorkDays = (workDays: number[]): string => {
    return formatWorkDaysFromService(workDays, currentLanguage);
  };

  const renderShiftItem = (shift: Shift) => {
    const isActive = state.activeShift?.id === shift.id;
    const isSelected = selectedShifts.includes(shift.id);

    return (
      <Card
        key={shift.id}
        style={[
          styles.shiftCard,
          { backgroundColor: theme.colors.surfaceVariant },
          (isActive || isSelected) && {
            borderColor: theme.colors.primary,
            borderWidth: 2
          }
        ]}
      >
        <Card.Content>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftInfo}>
              <Text style={[styles.shiftName, { color: theme.colors.onSurface }]}>
                {shift.name}
              </Text>
              {isActive && !isRotationMode && (
                <Chip
                  mode="flat"
                  style={[styles.activeChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                >
                  {t(currentLanguage, 'shifts.currentlyUsing')}
                </Chip>
              )}
              {isSelected && isRotationMode && (
                <Chip
                  mode="flat"
                  style={[styles.selectedChip, { backgroundColor: theme.colors.secondaryContainer }]}
                  textStyle={{ color: theme.colors.onSecondaryContainer }}
                >
                  {t(currentLanguage, 'shifts.selected')}
                </Chip>
              )}
            </View>
            <View style={styles.shiftActions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => navigation.navigate('AddEditShift', { shiftId: shift.id })}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => handleDeleteShift(shift)}
              />
            </View>
          </View>

          <View style={styles.shiftDetails}>
            <Text style={[styles.shiftTime, { color: theme.colors.onSurface }]}>
              ⏰ {shift.startTime} - {shift.endTime}
            </Text>
            <Text style={[styles.shiftDays, { color: theme.colors.onSurfaceVariant }]}>
              📅 {formatWorkDays(shift.workDays)}
            </Text>
            {shift.isNightShift && (
              <Text style={[styles.nightShift, { color: theme.colors.tertiary }]}>
                {t(currentLanguage, 'shifts.nightShift')}
              </Text>
            )}
            {shift.showPunch && (
              <Text style={[styles.punchRequired, { color: theme.colors.secondary }]}>
                {t(currentLanguage, 'shifts.punchRequired')}
              </Text>
            )}
          </View>

          {/* Chỉ hiển thị button khi không phải ca đang áp dụng hoặc đang ở rotation mode */}
          {(!isActive || isRotationMode) && (
            <Button
              mode={isSelected ? "contained" : "outlined"}
              onPress={() => handleSelectShift(shift.id)}
              style={styles.selectButton}
            >
              {isRotationMode
                ? (isSelected ? t(currentLanguage, 'shifts.selected') : t(currentLanguage, 'shifts.choose'))
                : t(currentLanguage, 'shifts.selectThis')
              }
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <WorklyBackground variant="default">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        {isRotationMode ? (
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Fallback: navigate to ShiftsTab if can't go back
                navigation.navigate('MainTabs', { screen: 'ShiftsTab' });
              }
            }}
          />
        ) : (
          <View style={{ width: 48 }} />
        )}
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {isRotationMode ? t(currentLanguage, 'shifts.selectRotation') : t(currentLanguage, 'shifts.management')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {isRotationMode && (
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Text style={[styles.infoText, { color: theme.colors.onPrimaryContainer }]}>
              {t(currentLanguage, 'shifts.rotationInfo').replace('{count}', selectedShifts.length.toString())}
            </Text>
          </Card.Content>
        </Card>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Shift Mode Configuration - Only show in normal mode */}
        {!isRotationMode && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'shifts.shiftModeConfig')}
              </Text>

              {/* Mode Selection */}
              <View style={styles.modeSection}>
                <Text style={[styles.modeLabel, { color: theme.colors.onSurface }]}>
                  {t(currentLanguage, 'shifts.mainMode')}
                </Text>

                <Menu
                  visible={modeMenuVisible}
                  onDismiss={() => setModeMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setModeMenuVisible(true)}
                      style={styles.modeButton}
                      icon="cog"
                      contentStyle={styles.modeButtonContent}
                    >
                      {(() => {
                        switch (settings?.changeShiftReminderMode) {
                          case 'disabled': return t(currentLanguage, 'shifts.disabled');
                          case 'ask_weekly': return t(currentLanguage, 'shifts.askWeekly');
                          case 'rotate': return t(currentLanguage, 'shifts.rotate');
                          default: return t(currentLanguage, 'shifts.disabled');
                        }
                      })()} ▼
                    </Button>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      handleModeChange('disabled');
                      setModeMenuVisible(false);
                    }}
                    title={t(currentLanguage, 'shifts.disabled')}
                    leadingIcon="close-circle"
                  />
                  <Menu.Item
                    onPress={() => {
                      handleModeChange('ask_weekly');
                      setModeMenuVisible(false);
                    }}
                    title={t(currentLanguage, 'shifts.askWeekly')}
                    leadingIcon="bell-outline"
                  />
                  <Menu.Item
                    onPress={() => {
                      handleModeChange('rotate');
                      setModeMenuVisible(false);
                    }}
                    title={t(currentLanguage, 'shifts.rotate')}
                    leadingIcon="rotate-3d-variant"
                  />
                </Menu>

                {/* Mode Description */}
                <Text style={[styles.modeDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {(() => {
                    switch (settings?.changeShiftReminderMode) {
                      case 'disabled': return t(currentLanguage, 'shifts.disabledDesc');
                      case 'ask_weekly': return t(currentLanguage, 'shifts.askWeeklyDesc');
                      case 'rotate': return t(currentLanguage, 'shifts.rotateDesc');
                      default: return t(currentLanguage, 'shifts.disabledDesc');
                    }
                  })()}
                </Text>
              </View>

              {/* Rotation Configuration - Only show when rotate mode is selected */}
              {settings?.changeShiftReminderMode === 'rotate' && (
                <View style={styles.rotationConfig}>
                  <Divider style={styles.divider} />

                  <Text style={[styles.configTitle, { color: theme.colors.onSurface }]}>
                    {t(currentLanguage, 'shifts.autoRotationConfig')}
                  </Text>

                  {/* Select Rotation Shifts Button */}
                  <Button
                    mode="outlined"
                    onPress={handleSelectRotationShifts}
                    style={styles.configButton}
                    icon="clock-outline"
                  >
                    {t(currentLanguage, 'shifts.selectRotationShifts').replace('{count}', (settings.rotationConfig?.rotationShifts?.length || 0).toString())}
                  </Button>

                  {/* Show selected shifts */}
                  {settings.rotationConfig?.rotationShifts && settings.rotationConfig.rotationShifts.length > 0 && (
                    <View style={styles.selectedShifts}>
                      <Text style={[styles.selectedLabel, { color: theme.colors.onSurfaceVariant }]}>
                        {t(currentLanguage, 'shifts.selectedShifts')}
                      </Text>
                      <View style={styles.shiftChips}>
                        {settings.rotationConfig.rotationShifts.map((shiftId, index) => {
                          const shift = state.shifts.find(s => s.id === shiftId);
                          const isActive = index === settings.rotationConfig?.currentRotationIndex;
                          return (
                            <Chip
                              key={shiftId}
                              mode={isActive ? "flat" : "outlined"}
                              style={[
                                styles.shiftChip,
                                isActive && { backgroundColor: theme.colors.primaryContainer }
                              ]}
                              textStyle={isActive ? { color: theme.colors.onPrimaryContainer } : undefined}
                            >
                              {shift?.name || t(currentLanguage, 'shifts.shiftNotExist')}
                              {isActive && ` ${t(currentLanguage, 'shifts.current')}`}
                            </Chip>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Frequency Selection */}
                  <View style={styles.frequencySection}>
                    <Text style={[styles.frequencyLabel, { color: theme.colors.onSurface }]}>
                      {t(currentLanguage, 'shifts.rotationFrequency')}
                    </Text>
                    <Menu
                      visible={frequencyMenuVisible}
                      onDismiss={() => setFrequencyMenuVisible(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setFrequencyMenuVisible(true)}
                          style={styles.frequencyButton}
                          icon="calendar"
                        >
                          {(() => {
                            switch (settings.rotationConfig?.rotationFrequency) {
                              case 'weekly': return t(currentLanguage, 'shifts.weekly');
                              case 'biweekly': return t(currentLanguage, 'shifts.biweekly');
                              case 'triweekly': return t(currentLanguage, 'shifts.triweekly');
                              case 'monthly': return t(currentLanguage, 'shifts.monthly');
                              default: return t(currentLanguage, 'shifts.selectFrequency');
                            }
                          })()}
                        </Button>
                      }
                    >
                      <Menu.Item
                        onPress={() => handleFrequencyChange('weekly')}
                        title={t(currentLanguage, 'shifts.weekly')}
                      />
                      <Menu.Item
                        onPress={() => handleFrequencyChange('biweekly')}
                        title={t(currentLanguage, 'shifts.biweekly')}
                      />
                      <Menu.Item
                        onPress={() => handleFrequencyChange('triweekly')}
                        title={t(currentLanguage, 'shifts.triweekly')}
                      />
                      <Menu.Item
                        onPress={() => handleFrequencyChange('monthly')}
                        title={t(currentLanguage, 'shifts.monthly')}
                      />
                    </Menu>
                  </View>

                  {/* Last Applied Date Info */}
                  {settings.rotationConfig?.rotationLastAppliedDate && (
                    <Text style={[styles.lastAppliedText, { color: theme.colors.onSurfaceVariant }]}>
                      {t(currentLanguage, 'shifts.lastRotation').replace('{date}', new Date(settings.rotationConfig.rotationLastAppliedDate).toLocaleDateString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US'))}
                    </Text>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Existing shift list */}
        {state.shifts.length > 0 ? (
          state.shifts.map(renderShiftItem)
        ) : (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {t(currentLanguage, 'shifts.noShifts')}
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('AddEditShift')}
                style={styles.createFirstButton}
              >
                {t(currentLanguage, 'shifts.createFirst')}
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {isRotationMode && selectedShifts.length >= 2 && (
        <View style={styles.bottomActions}>
          <Button
            mode="contained"
            onPress={handleConfirmRotation}
            style={styles.confirmButton}
          >
            {t(currentLanguage, 'shifts.confirmRotationConfig')}
          </Button>
        </View>
      )}

      {!isRotationMode && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('AddEditShift')}
        />
      )}
      </SafeAreaView>
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
  infoCard: {
    margin: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  shiftCard: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activeChip: {
    alignSelf: 'flex-start',
  },
  selectedChip: {
    alignSelf: 'flex-start',
  },
  shiftActions: {
    flexDirection: 'row',
  },
  shiftDetails: {
    marginBottom: 16,
  },
  shiftTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  shiftDays: {
    fontSize: 12,
    marginBottom: 4,
  },
  nightShift: {
    fontSize: 12,
    marginBottom: 4,
  },
  punchRequired: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectButton: {
    marginTop: 8,
  },
  emptyCard: {
    marginVertical: 32,
    borderRadius: 12,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  createFirstButton: {
    marginTop: 8,
  },
  bottomActions: {
    padding: 16,
  },
  confirmButton: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modeSection: {
    marginBottom: 16,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  modeButton: {
    alignSelf: 'flex-start',
    minWidth: 200,
    marginBottom: 8,
  },
  modeButtonContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modeDescription: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  rotationConfig: {
    marginTop: 16,
  },
  divider: {
    marginVertical: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  configButton: {
    marginBottom: 12,
  },
  selectedShifts: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  shiftChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shiftChip: {
    marginBottom: 4,
  },
  frequencySection: {
    marginBottom: 12,
  },
  frequencyLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  frequencyButton: {
    alignSelf: 'flex-start',
  },
  lastAppliedText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
