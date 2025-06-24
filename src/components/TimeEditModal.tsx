import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { Modal, Text, Button, useTheme, IconButton, Card } from 'react-native-paper';
import { format, parseISO, isValid, addMinutes, differenceInMinutes } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FastIcon } from './WorklyIcon';
import { Shift } from '../types';
import { SPACING, BORDER_RADIUS } from '../constants/themes';

interface TimeEditModalProps {
  visible: boolean;
  onDismiss: () => void;
  currentCheckInTime?: string; // HH:MM format
  currentCheckOutTime?: string; // HH:MM format
  shift: Shift | null;
  onSave: (checkInTime: string, checkOutTime: string) => void; // Returns HH:MM format
}

export function TimeEditModal({
  visible,
  onDismiss,
  currentCheckInTime,
  currentCheckOutTime,
  shift,
  onSave,
}: TimeEditModalProps) {
  const theme = useTheme();

  // State cho time picker
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const [errors, setErrors] = useState<{
    checkIn?: string;
    checkOut?: string;
    general?: string;
  }>({});

  // Helper function để chuyển đổi HH:MM string thành Date object
  const timeStringToDate = (timeString: string): Date => {
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    return date;
  };

  // Helper function để chuyển đổi Date object thành HH:MM string
  const dateToTimeString = (date: Date): string => {
    return format(date, 'HH:mm');
  };

  // Khởi tạo giá trị mặc định khi modal mở
  useEffect(() => {
    if (visible) {
      // Khởi tạo giờ check-in
      let checkInTimeString = '';
      if (currentCheckInTime) {
        checkInTimeString = currentCheckInTime;
      } else if (shift) {
        checkInTimeString = shift.startTime;
      } else {
        checkInTimeString = '08:00';
      }
      setCheckInDate(timeStringToDate(checkInTimeString));

      // Khởi tạo giờ check-out
      let checkOutTimeString = '';
      if (currentCheckOutTime) {
        checkOutTimeString = currentCheckOutTime;
      } else if (shift) {
        checkOutTimeString = shift.officeEndTime;
      } else {
        checkOutTimeString = '17:00';
      }
      setCheckOutDate(timeStringToDate(checkOutTimeString));

      setErrors({});
    }
  }, [visible, currentCheckInTime, currentCheckOutTime, shift]);



  const validateInputs = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate time logic sử dụng Date objects
    let adjustedCheckOutDate = new Date(checkOutDate);

    // Xử lý ca đêm - nếu giờ ra nhỏ hơn giờ vào, coi như ngày hôm sau
    if (shift?.isNightShift && checkOutDate <= checkInDate) {
      adjustedCheckOutDate = new Date(checkOutDate);
      adjustedCheckOutDate.setDate(adjustedCheckOutDate.getDate() + 1);
    }

    // Kiểm tra thứ tự thời gian cho ca thường
    if (!shift?.isNightShift && checkOutDate <= checkInDate) {
      newErrors.general = 'Giờ ra phải sau giờ vào';
    } else {
      const workDuration = differenceInMinutes(adjustedCheckOutDate, checkInDate);
      if (workDuration > 24 * 60) {
        newErrors.general = 'Thời gian làm việc không thể vượt quá 24 giờ';
      } else if (workDuration < 30) {
        newErrors.general = 'Thời gian làm việc tối thiểu là 30 phút';
      }
    }

    // Cảnh báo nếu giờ quá lệch so với ca chuẩn
    if (shift && !newErrors.general) {
      const shiftStartTime = timeStringToDate(shift.startTime);
      const shiftEndTime = timeStringToDate(shift.officeEndTime);

      const checkInDiff = Math.abs(differenceInMinutes(checkInDate, shiftStartTime));
      const checkOutDiff = Math.abs(differenceInMinutes(adjustedCheckOutDate, shiftEndTime));

      if (checkInDiff > 120 || checkOutDiff > 120) {
        newErrors.general = 'Cảnh báo: Giờ chấm công lệch nhiều so với ca làm việc chuẩn';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      // Chuyển đổi Date objects thành HH:MM strings
      const checkInTimeString = dateToTimeString(checkInDate);
      const checkOutTimeString = dateToTimeString(checkOutDate);

      // Xác nhận nếu có cảnh báo
      if (errors.general && errors.general.includes('Cảnh báo')) {
        Alert.alert(
          'Xác nhận',
          `${errors.general}\n\nBạn có muốn tiếp tục không?`,
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Tiếp tục',
              onPress: () => {
                onSave(checkInTimeString, checkOutTimeString); // Return HH:MM format
              },
            },
          ]
        );
      } else {
        onSave(checkInTimeString, checkOutTimeString); // Return HH:MM format
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu thời gian chấm công');
    }
  };

  const formatShiftInfo = () => {
    if (!shift) return '';
    return `Ca ${shift.name}: ${shift.startTime} - ${shift.endTime}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.surfaceVariant }
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Chỉnh sửa giờ chấm công
        </Text>
        <IconButton
          icon="close"
          size={24}
          iconColor={theme.colors.onSurface}
          onPress={onDismiss}
        />
      </View>

      {shift && (
        <Text style={[styles.shiftInfo, { color: theme.colors.onSurfaceVariant }]}>
          {formatShiftInfo()}
        </Text>
      )}

      <View style={styles.content}>
        {/* Check-in Time Picker */}
        <View style={styles.timePickerContainer}>
          <Text style={[styles.timeLabel, { color: theme.colors.onSurface }]}>
            Giờ chấm công vào:
          </Text>
          <TouchableOpacity
            style={[
              styles.timePickerButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: errors.checkIn ? theme.colors.error : theme.colors.outline
              }
            ]}
            onPress={() => setShowCheckInPicker(true)}
          >
            <FastIcon
              name="login"
              size={20}
              color={theme.colors.onSurfaceVariant}
              style={styles.timeIcon}
            />
            <Text style={[styles.timeText, { color: theme.colors.onSurface }]}>
              {dateToTimeString(checkInDate)}
            </Text>
            <FastIcon
              name="clock-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          {errors.checkIn && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.checkIn}
            </Text>
          )}
        </View>

        {/* Check-out Time Picker */}
        <View style={styles.timePickerContainer}>
          <Text style={[styles.timeLabel, { color: theme.colors.onSurface }]}>
            Giờ chấm công ra:
          </Text>
          <TouchableOpacity
            style={[
              styles.timePickerButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: errors.checkOut ? theme.colors.error : theme.colors.outline
              }
            ]}
            onPress={() => setShowCheckOutPicker(true)}
          >
            <FastIcon
              name="logout"
              size={20}
              color={theme.colors.onSurfaceVariant}
              style={styles.timeIcon}
            />
            <Text style={[styles.timeText, { color: theme.colors.onSurface }]}>
              {dateToTimeString(checkOutDate)}
            </Text>
            <FastIcon
              name="clock-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          {errors.checkOut && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.checkOut}
            </Text>
          )}
        </View>

        {/* General Error */}
        {errors.general && (
          <Text style={[
            styles.errorText,
            { 
              color: errors.general.includes('Cảnh báo') 
                ? theme.colors.primary 
                : theme.colors.error 
            }
          ]}>
            {errors.general}
          </Text>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.button}
          >
            Hủy
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
          >
            Lưu
          </Button>
        </View>
      </View>

      {/* Time Pickers */}
      {showCheckInPicker && (
        <DateTimePicker
          value={checkInDate}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowCheckInPicker(Platform.OS === 'ios');
            if (selectedDate) {
              setCheckInDate(selectedDate);
            }
          }}
        />
      )}

      {showCheckOutPicker && (
        <DateTimePicker
          value={checkOutDate}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowCheckOutPicker(Platform.OS === 'ios');
            if (selectedDate) {
              setCheckOutDate(selectedDate);
            }
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shiftInfo: {
    fontSize: 14,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  content: {
    gap: SPACING.md,
  },
  timePickerContainer: {
    marginBottom: SPACING.sm,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    minHeight: 56,
  },
  timeIcon: {
    marginRight: SPACING.sm,
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
  },
});
