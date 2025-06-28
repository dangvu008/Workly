import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  Card,
  IconButton,
  useTheme,
  Chip,
  HelperText
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FastIcon } from '../components/WorklyIcon';
import { WorklyBackground } from '../components/WorklyBackground';
import { useApp } from '../contexts/AppContext';
import { Shift } from '../types';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { t } from '../i18n';
import { getDayNamesMapping } from '../services/sampleShifts';

type AddEditShiftScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddEditShift'>;

interface AddEditShiftScreenProps {
  navigation: AddEditShiftScreenNavigationProp;
  route: {
    params?: {
      shiftId?: string;
      applyImmediately?: boolean;
    };
  };
}

export function AddEditShiftScreen({ navigation, route }: AddEditShiftScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();

  const shiftId = route.params?.shiftId;
  const applyImmediately = route.params?.applyImmediately || false;
  const isEditing = !!shiftId;

  const existingShift = isEditing ? state.shifts.find(s => s.id === shiftId) : null;

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  const [formData, setFormData] = useState({
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    officeEndTime: '17:00',
    departureTime: '07:30',
    daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], // Monday to Saturday
    remindBeforeStart: 15,
    remindAfterEnd: 10,
    showPunch: false,
    breakMinutes: 60,
    isNightShift: false,
    workDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday (for backward compatibility)
    applyNow: applyImmediately,
  });

  // Validation errors
  const [errors, setErrors] = useState({
    name: '',
    workDays: '',
    breakMinutes: '',
    remindBeforeStart: '',
    remindAfterEnd: '',
    departureTime: '',
  });

  // Status messages
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | '';
    message: string;
  }>({ type: '', message: '' });

  // ✅ Track form changes to update button text
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);

  // Time picker states
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showOfficeEndTimePicker, setShowOfficeEndTimePicker] = useState(false);
  const [showDepartureTimePicker, setShowDepartureTimePicker] = useState(false);

  useEffect(() => {
    if (existingShift) {
      // Tự động phân loại ca đêm dựa trên giờ làm việc hiện tại
      const autoDetectedNightShift = isNightShiftTime(existingShift.startTime, existingShift.endTime);

      const initialFormData = {
        name: existingShift.name,
        startTime: existingShift.startTime,
        endTime: existingShift.endTime,
        officeEndTime: existingShift.officeEndTime,
        departureTime: existingShift.departureTime,
        daysApplied: existingShift.daysApplied || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        remindBeforeStart: existingShift.remindBeforeStart || 15,
        remindAfterEnd: existingShift.remindAfterEnd || 10,
        showPunch: existingShift.showPunch,
        breakMinutes: existingShift.breakMinutes,
        isNightShift: autoDetectedNightShift, // Sử dụng auto-detection thay vì giá trị cũ
        workDays: existingShift.workDays,
        applyNow: false,
      };

      setFormData(initialFormData);
      setOriginalFormData(initialFormData); // ✅ Set original data for comparison
      setHasChanges(false); // ✅ Reset changes flag
    } else {
      // Cho ca mới, tự động phân loại dựa trên giờ mặc định
      const defaultStartTime = '08:00';
      const defaultEndTime = '17:00';
      const autoDetectedNightShift = isNightShiftTime(defaultStartTime, defaultEndTime);

      const initialFormData = {
        name: '',
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        officeEndTime: '17:00',
        departureTime: '07:30',
        daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        remindBeforeStart: 15,
        remindAfterEnd: 10,
        showPunch: false,
        breakMinutes: 60,
        isNightShift: autoDetectedNightShift, // Sử dụng auto-detection (sẽ là false cho 8h-17h)
        workDays: [1, 2, 3, 4, 5, 6],
        applyNow: applyImmediately,
      };

      setFormData(initialFormData);
      setOriginalFormData(initialFormData); // ✅ Set original data for comparison
      setHasChanges(false); // ✅ Reset changes flag
    }
  }, [existingShift, applyImmediately]);

  // Helper function to handle daysApplied toggle
  const handleDaysAppliedToggle = (dayString: string) => {
    const dayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };

    const isCurrentlySelected = formData.daysApplied.includes(dayString);
    const newDaysApplied = isCurrentlySelected
      ? formData.daysApplied.filter(d => d !== dayString)
      : [...formData.daysApplied, dayString].sort((a, b) => {
        const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return order.indexOf(a) - order.indexOf(b);
      });

    // Also update workDays for backward compatibility
    const newWorkDays = isCurrentlySelected
      ? formData.workDays.filter(d => d !== dayMap[dayString])
      : [...formData.workDays, dayMap[dayString]].sort();

    const newFormData = {
      ...formData,
      daysApplied: newDaysApplied,
      workDays: newWorkDays
    };

    setFormData(newFormData);
    setHasChanges(checkForChanges(newFormData));

    // Clear work days error when user makes changes
    setErrors(prev => ({ ...prev, workDays: '' }));
  };

  // ✅ Check if form has changes compared to original
  const checkForChanges = (newFormData: typeof formData) => {
    if (!originalFormData) return false;

    return JSON.stringify(newFormData) !== JSON.stringify(originalFormData);
  };

  // Helper functions to clear errors on input change
  const handleNameChange = (text: string) => {
    const newFormData = { ...formData, name: text };
    setFormData(newFormData);
    setHasChanges(checkForChanges(newFormData));
    setErrors(prev => ({ ...prev, name: '' }));
  };

  const handleBreakMinutesChange = (value: number) => {
    const newFormData = { ...formData, breakMinutes: value };
    setFormData(newFormData);
    setHasChanges(checkForChanges(newFormData));
    setErrors(prev => ({ ...prev, breakMinutes: '' }));
  };

  // Helper functions for time picker
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const dateToTimeString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Time picker handlers
  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const timeString = dateToTimeString(selectedDate);
      const newFormData = {
        ...formData,
        startTime: timeString,
        isNightShift: isNightShiftTime(timeString, formData.endTime)
      };
      setFormData(newFormData);
      setHasChanges(checkForChanges(newFormData));
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const timeString = dateToTimeString(selectedDate);
      const newFormData = {
        ...formData,
        endTime: timeString,
        isNightShift: isNightShiftTime(formData.startTime, timeString)
      };
      setFormData(newFormData);
      setHasChanges(checkForChanges(newFormData));
    }
  };

  const handleOfficeEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowOfficeEndTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const timeString = dateToTimeString(selectedDate);
      setFormData(prev => ({ ...prev, officeEndTime: timeString }));
    }
  };

  const handleDepartureTimeChange = (event: any, selectedDate?: Date) => {
    setShowDepartureTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const timeString = dateToTimeString(selectedDate);
      const newFormData = { ...formData, departureTime: timeString };
      setFormData(newFormData);
      setHasChanges(checkForChanges(newFormData));
      setErrors(prev => ({ ...prev, departureTime: '' }));
    }
  };

  // Function để kiểm tra ca đêm dựa trên giờ làm việc
  const isNightShiftTime = (startTime: string, endTime: string): boolean => {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    // Ca đêm: ca làm việc có thời gian bao trùm hoặc chồng lấp lên khoảng 22h tối đến 5h sáng hôm sau

    const isOvernight = endHour < startHour;

    if (isOvernight) {
      // Ca qua đêm: kiểm tra xem có bao trùm khoảng 22h-5h không
      // Ví dụ: 20h-8h (bao trùm hoàn toàn), 23h-3h (nằm trong), 18h-2h (bao trùm một phần)

      // Ca qua đêm bao trùm khoảng 22h-5h nếu:
      // - Bắt đầu <= 22h VÀ kết thúc >= 5h (bao trùm hoàn toàn: VD 20h-8h, 18h-6h)
      // - Bắt đầu >= 22h (bao trùm từ 22h: VD 23h-3h, 22h-8h)
      // - Kết thúc <= 5h (bao trùm đến 5h: VD 18h-3h, 20h-5h)
      return (startHour <= 22 && endHour >= 5) || startHour >= 22 || endHour <= 5;
    } else {
      // Ca trong cùng ngày: chỉ là ca đêm nếu nằm trong khoảng đêm
      // - Bắt đầu từ 22h trở đi (VD: 22h-23h59)
      // - Kết thúc đến 5h trở về (VD: 0h-5h, 1h-4h)
      return startHour >= 22 || endHour <= 5;
    }
  };



  // TimePickerField component
  const TimePickerField = ({
    label,
    value,
    onPress,
    error = false,
    style = {}
  }: {
    label: string;
    value: string;
    onPress: () => void;
    error?: boolean;
    style?: any;
  }) => (
    <TouchableOpacity
      style={[
        styles.timePickerField,
        {
          borderColor: error ? theme.colors.error : theme.colors.outline,
          backgroundColor: theme.colors.surface,
        },
        style
      ]}
      onPress={onPress}
    >
      <Text style={[styles.timePickerLabel, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <View style={styles.timePickerContent}>
        <FastIcon
          name="clock-outline"
          size={20}
          color={theme.colors.onSurfaceVariant}
          style={styles.timeIcon}
        />
        <Text style={[styles.timePickerValue, { color: theme.colors.onSurface }]}>
          {value}
        </Text>
        <FastIcon
          name="chevron-down"
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    </TouchableOpacity>
  );

  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      workDays: '',
      breakMinutes: '',
      remindBeforeStart: '',
      remindAfterEnd: '',
      departureTime: '',
    };

    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t(currentLanguage, 'shifts.validation.nameRequired');
      isValid = false;
    }

    // Work days validation
    if (formData.daysApplied.length === 0) {
      newErrors.workDays = t(currentLanguage, 'shifts.validation.workDaysRequired');
      isValid = false;
    }

    // Break minutes validation
    if (formData.breakMinutes < 0 || formData.breakMinutes > 480) {
      newErrors.breakMinutes = t(currentLanguage, 'shifts.validation.breakMinutesInvalid');
      isValid = false;
    }

    // Remind before start validation
    if (formData.remindBeforeStart < 0 || formData.remindBeforeStart > 120) {
      newErrors.remindBeforeStart = t(currentLanguage, 'shifts.validation.remindBeforeStartInvalid');
      isValid = false;
    }

    // Remind after end validation
    if (formData.remindAfterEnd < 0 || formData.remindAfterEnd > 120) {
      newErrors.remindAfterEnd = t(currentLanguage, 'shifts.validation.remindAfterEndInvalid');
      isValid = false;
    }

    // Departure time validation - should be before start time
    const departureMinutes = parseInt(formData.departureTime.split(':')[0]) * 60 + parseInt(formData.departureTime.split(':')[1]);
    const startMinutes = parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1]);
    if (departureMinutes >= startMinutes) {
      newErrors.departureTime = t(currentLanguage, 'shifts.validation.departureTimeInvalid');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setStatusMessage({ type: '', message: '' }); // Clear previous status

      const shiftData: Shift = {
        id: isEditing ? shiftId! : `shift_${Date.now()}`,
        name: formData.name.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        officeEndTime: formData.officeEndTime,
        departureTime: formData.departureTime,
        daysApplied: formData.daysApplied,
        remindBeforeStart: formData.remindBeforeStart,
        remindAfterEnd: formData.remindAfterEnd,
        showPunch: formData.showPunch,
        breakMinutes: formData.breakMinutes,
        isNightShift: formData.isNightShift,
        workDays: formData.workDays,
        createdAt: isEditing ? existingShift?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await actions.updateShift(shiftId!, shiftData);
        setStatusMessage({ type: 'success', message: t(currentLanguage, 'shifts.successUpdated') });
      } else {
        await actions.addShift(shiftData, formData.applyNow);
        setStatusMessage({
          type: 'success',
          message: formData.applyNow
            ? t(currentLanguage, 'shifts.successCreatedAndApplied')
            : t(currentLanguage, 'shifts.successCreated')
        });
      }

      // Auto navigate back after 2 seconds
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          // Fallback: navigate to ShiftsTab if can't go back
          navigation.navigate('MainTabs', { screen: 'ShiftsTab' });
        }
      }, 2000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: t(currentLanguage, 'shifts.errorSave') });
    }
  };

  const handleReset = () => {
    if (originalFormData) {
      setFormData(originalFormData);
      setHasChanges(false);
      setErrors({
        name: '',
        workDays: '',
        breakMinutes: '',
        remindBeforeStart: '',
        remindAfterEnd: '',
        departureTime: '',
      });
    }
  };

  return (
    <WorklyBackground variant="form">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
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
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {isEditing ? t(currentLanguage, 'shifts.editShiftTitle') : t(currentLanguage, 'shifts.createNew')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Basic Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'common.basicInfo')}
            </Text>

            <TextInput
              label={`${t(currentLanguage, 'shifts.shiftName')} *`}
              value={formData.name}
              onChangeText={handleNameChange}
              style={styles.input}
              mode="outlined"
              error={!!errors.name}
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>

            <TimePickerField
              label={t(currentLanguage, 'shifts.departureTime')}
              value={formData.departureTime}
              onPress={() => setShowDepartureTimePicker(true)}
              error={!!errors.departureTime}
            />
            <HelperText type="error" visible={!!errors.departureTime}>
              {errors.departureTime}
            </HelperText>

            <View style={styles.row}>
              <TimePickerField
                label={t(currentLanguage, 'shifts.startTime')}
                value={formData.startTime}
                onPress={() => setShowStartTimePicker(true)}
                style={styles.halfInput}
              />
              <TimePickerField
                label={t(currentLanguage, 'shifts.endTime')}
                value={formData.endTime}
                onPress={() => setShowEndTimePicker(true)}
                style={styles.halfInput}
              />
            </View>

            <TimePickerField
              label={t(currentLanguage, 'shifts.officeEndTime')}
              value={formData.officeEndTime}
              onPress={() => setShowOfficeEndTimePicker(true)}
            />

            <TextInput
              label={t(currentLanguage, 'shifts.breakMinutes')}
              value={formData.breakMinutes.toString()}
              onChangeText={(text) => handleBreakMinutesChange(parseInt(text) || 0)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.breakMinutes}
            />
            <HelperText type="error" visible={!!errors.breakMinutes}>
              {errors.breakMinutes}
            </HelperText>

            <View style={styles.row}>
              <TextInput
                label={t(currentLanguage, 'shifts.remindBeforeStart')}
                value={formData.remindBeforeStart.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setFormData(prev => ({ ...prev, remindBeforeStart: value }));
                  setErrors(prev => ({ ...prev, remindBeforeStart: '' }));
                }}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.remindBeforeStart}
              />
              <TextInput
                label={t(currentLanguage, 'shifts.remindAfterEnd')}
                value={formData.remindAfterEnd.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setFormData(prev => ({ ...prev, remindAfterEnd: value }));
                  setErrors(prev => ({ ...prev, remindAfterEnd: '' }));
                }}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.remindAfterEnd}
              />
            </View>
            <HelperText type="error" visible={!!errors.remindBeforeStart}>
              {errors.remindBeforeStart}
            </HelperText>
            <HelperText type="error" visible={!!errors.remindAfterEnd}>
              {errors.remindAfterEnd}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Days Applied */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'shifts.daysApplied')} *
            </Text>

            <View style={styles.daysContainer}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayString) => {
                // ✅ Sử dụng getDayNamesMapping từ sampleShifts service
                const dayNames = getDayNamesMapping(currentLanguage);
                const dayMap: { [key: string]: number } = {
                  'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
                };
                const dayNumber = dayMap[dayString];
                const dayLabel = dayNames[dayNumber as keyof typeof dayNames];

                return (
                  <Chip
                    key={dayString}
                    mode={formData.daysApplied.includes(dayString) ? 'flat' : 'outlined'}
                    selected={formData.daysApplied.includes(dayString)}
                    onPress={() => handleDaysAppliedToggle(dayString)}
                    style={styles.dayChip}
                  >
                    {dayLabel}
                  </Chip>
                );
              })}
            </View>

            <HelperText type="error" visible={!!errors.workDays}>
              {errors.workDays}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Options */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'shifts.options')}
            </Text>

            {/* Ca đêm được tự động phân loại dựa trên thời gian làm việc */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'shifts.night')}:
              </Text>
              <Text style={[styles.infoValue, {
                color: formData.isNightShift ? theme.colors.primary : theme.colors.onSurfaceVariant
              }]}>
                {formData.isNightShift
                  ? (currentLanguage === 'vi' ? 'Có (tự động)' : 'Yes (auto)')
                  : (currentLanguage === 'vi' ? 'Không' : 'No')
                }
              </Text>
            </View>

            <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
              {currentLanguage === 'vi'
                ? 'Ca đêm được tự động phân loại dựa trên thời gian làm việc (22h-5h)'
                : 'Night shift is automatically classified based on work hours (10PM-5AM)'
              }
            </Text>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'modals.punchButton')}
              </Text>
              <Switch
                value={formData.showPunch}
                onValueChange={(value) => {
                  const newFormData = { ...formData, showPunch: value };
                  setFormData(newFormData);
                  setHasChanges(checkForChanges(newFormData));
                }}
              />
            </View>

            {!isEditing && (
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                  {t(currentLanguage, 'shifts.applyNow')}
                </Text>
                <Switch
                  value={formData.applyNow}
                  onValueChange={(value) => {
                    const newFormData = { ...formData, applyNow: value };
                    setFormData(newFormData);
                    setHasChanges(checkForChanges(newFormData));
                  }}
                />
              </View>
            )}
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
                    : theme.colors.error
                }
              ]}>
                {statusMessage.message}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.actionButton}
            icon="restart"
          >
            {t(currentLanguage, 'modals.reset')}
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.actionButton}
            icon={hasChanges ? "content-save" : (isEditing ? "pencil" : "plus")}
          >
            {hasChanges
              ? t(currentLanguage, 'common.save')
              : (isEditing ? t(currentLanguage, 'common.edit') : t(currentLanguage, 'shifts.addShift'))
            }
          </Button>
        </View>
      </ScrollView>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={timeStringToDate(formData.startTime)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={timeStringToDate(formData.endTime)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndTimeChange}
        />
      )}

      {showOfficeEndTimePicker && (
        <DateTimePicker
          value={timeStringToDate(formData.officeEndTime)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleOfficeEndTimeChange}
        />
      )}

      {showDepartureTimePicker && (
        <DateTimePicker
          value={timeStringToDate(formData.departureTime)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDepartureTimeChange}
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
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  actionButton: {
    flex: 0.48,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  // Time picker field styles
  timePickerField: {
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 12,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timePickerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerValue: {
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  timeIcon: {
    marginRight: 8,
  },
});
