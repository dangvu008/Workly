import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../styles/theme/typography';
import { SPACING } from '../styles/theme/spacing';
import { useAppContext } from '../context/AppContext';
import { useLocalization } from '../localization/LocalizationContext';
import { TextInput } from '../components/ui/TextInput';
import { TimeInput } from '../components/ui/TimeInput';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';

// Regex for validating shift name (allows letters, numbers, spaces in any language)
const NAME_REGEX = /^[\\p{L}\\p{N}\\s]+$/u;

const ShiftForm = ({ 
  navigation, 
  route 
}) => {
  const { t } = useLocalization();
  const { shifts, addShift, updateShift } = useAppContext();
  
  // Check if we're in edit mode
  const shiftId = route.params?.shiftId;
  const isEditMode = !!shiftId;
  
  // Find shift if in edit mode
  const existingShift = isEditMode 
    ? shifts.find(shift => shift.id === shiftId) 
    : null;
  
  // Form state
  const [name, setName] = useState(existingShift?.name || '');
  const [departureTime, setDepartureTime] = useState(existingShift?.departureTime || '');
  const [startTime, setStartTime] = useState(existingShift?.startTime || '');
  const [officeEndTime, setOfficeEndTime] = useState(existingShift?.officeEndTime || '');
  const [endTime, setEndTime] = useState(existingShift?.endTime || '');
  const [daysApplied, setDaysApplied] = useState(existingShift?.daysApplied || []);
  const [remindBeforeStart, setRemindBeforeStart] = useState(
    existingShift?.remindBeforeStart?.toString() || '15'
  );
  const [remindAfterEnd, setRemindAfterEnd] = useState(
    existingShift?.remindAfterEnd?.toString() || '15'
  );
  const [breakMinutes, setBreakMinutes] = useState(
    existingShift?.breakMinutes?.toString() || '60'
  );
  const [showPunch, setShowPunch] = useState(existingShift?.showPunch || false);
  
  // Validation errors state
  const [errors, setErrors] = useState({});
  
  // Dialog states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  
  // Convert time string to minutes since midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Calculate time difference in minutes, handling overnight shifts
  const getTimeDifference = (startTimeStr, endTimeStr) => {
    const startMinutes = timeToMinutes(startTimeStr);
    const endMinutes = timeToMinutes(endTimeStr);
    
    if (endMinutes >= startMinutes) {
      return endMinutes - startMinutes;
    } else {
      // Overnight shift: end time is on the next day
      return (24 * 60 - startMinutes) + endMinutes;
    }
  };
  
  // Toggle day selection
  const toggleDay = (day) => {
    if (daysApplied.includes(day)) {
      setDaysApplied(daysApplied.filter(d => d !== day));
    } else {
      setDaysApplied([...daysApplied, day]);
    }
  };
  
  // Validate the form
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Tên ca không được để trống';
    } else if (name.length > 200) {
      newErrors.name = 'Tên ca quá dài (tối đa 200 ký tự)';
    } else if (!NAME_REGEX.test(name)) {
      newErrors.name = 'Tên ca chứa ký tự không hợp lệ';
    } else {
      // Check for duplicate name
      const isDuplicate = shifts.some(
        shift => shift.name.toLowerCase().trim() === name.toLowerCase().trim() && 
                shift.id !== shiftId
      );
      if (isDuplicate) {
        newErrors.name = 'Tên ca này đã tồn tại';
      }
    }
    
    // Validate departure time vs start time
    if (departureTime && startTime) {
      const minDiff = getTimeDifference(departureTime, startTime);
      if (minDiff < 5) {
        newErrors.departureTime = 'Giờ xuất phát phải trước giờ bắt đầu ít nhất 5 phút';
      }
    }
    
    // Validate start time vs office end time
    if (startTime && officeEndTime) {
      // Check if start time is before office end time
      const workHours = getTimeDifference(startTime, officeEndTime) / 60;
      if (workHours < 2) {
        newErrors.officeEndTime = 'Thời gian làm việc HC tối thiểu phải là 2 giờ';
      }
    }
    
    // Validate office end time vs end time
    if (officeEndTime && endTime) {
      const officeEndMinutes = timeToMinutes(officeEndTime);
      const endMinutes = timeToMinutes(endTime);
      
      // Check if end time is at least equal to office end time
      let isEndAfterOfficeEnd;
      if (endMinutes >= officeEndMinutes) {
        isEndAfterOfficeEnd = true;
      } else {
        // Handle overnight shifts
        const startMinutes = timeToMinutes(startTime);
        const isOvernightShift = officeEndMinutes < startMinutes;
        const isEndNextDay = endMinutes < startMinutes;
        
        isEndAfterOfficeEnd = isOvernightShift && isEndNextDay && endMinutes >= officeEndMinutes;
      }
      
      if (!isEndAfterOfficeEnd) {
        newErrors.endTime = 'Giờ kết thúc ca phải sau hoặc bằng giờ kết thúc HC';
      } else if (endMinutes !== officeEndMinutes) {
        // If there's OT (end time is not equal to office end time)
        const otMinutes = getTimeDifference(officeEndTime, endTime);
        if (otMinutes < 30) {
          newErrors.endTime = 'Nếu có OT, giờ kết thúc ca phải sau giờ kết thúc HC ít nhất 30 phút';
        }
      }
    }
    
    // Validate days applied
    if (daysApplied.length === 0) {
      newErrors.daysApplied = 'Vui lòng chọn ít nhất một ngày áp dụng ca';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    name, 
    departureTime, 
    startTime, 
    officeEndTime, 
    endTime, 
    daysApplied, 
    shifts,
    shiftId
  ]);
  
  // Run validation when form values change
  useEffect(() => {
    validateForm();
  }, [name, departureTime, startTime, officeEndTime, endTime, daysApplied, validateForm]);
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      setShowSaveConfirm(true);
    }
  };
  
  // Save shift data
  const saveShift = () => {
    const shiftData = {
      name,
      departureTime,
      startTime,
      officeEndTime,
      endTime,
      daysApplied,
      remindBeforeStart: parseInt(remindBeforeStart, 10),
      remindAfterEnd: parseInt(remindAfterEnd, 10),
      breakMinutes: parseInt(breakMinutes, 10),
      showPunch
    };
    
    if (isEditMode && existingShift) {
      updateShift({
        ...shiftData,
        id: existingShift.id,
        createdAt: existingShift.createdAt,
        updatedAt: new Date().toISOString()
      });
    } else {
      addShift(shiftData);
    }
    
    setShowSaveConfirm(false);
    navigation.goBack();
  };
  
  // Reset form to initial values
  const resetForm = () => {
    if (existingShift) {
      setName(existingShift.name);
      setDepartureTime(existingShift.departureTime);
      setStartTime(existingShift.startTime);
      setOfficeEndTime(existingShift.officeEndTime);
      setEndTime(existingShift.endTime);
      setDaysApplied(existingShift.daysApplied);
      setRemindBeforeStart(existingShift.remindBeforeStart.toString());
      setRemindAfterEnd(existingShift.remindAfterEnd.toString());
      setBreakMinutes(existingShift.breakMinutes.toString());
      setShowPunch(existingShift.showPunch);
    } else {
      setName('');
      setDepartureTime('');
      setStartTime('');
      setOfficeEndTime('');
      setEndTime('');
      setDaysApplied([]);
      setRemindBeforeStart('15');
      setRemindAfterEnd('15');
      setBreakMinutes('60');
      setShowPunch(false);
    }
    
    setErrors({});
    setShowResetConfirm(false);
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Sửa ca làm việc' : 'Thêm ca làm việc mới'}
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* Name input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên ca làm việc</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nhập tên ca làm việc"
              style={[
                styles.input,
                errors.name ? styles.inputError : null
              ]}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>
          
          {/* Departure Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Thời gian xuất phát</Text>
            <TimeInput
              value={departureTime}
              onChangeText={setDepartureTime}
              style={[
                styles.input,
                errors.departureTime ? styles.inputError : null
              ]}
            />
            {errors.departureTime && (
              <Text style={styles.errorText}>{errors.departureTime}</Text>
            )}
          </View>
          
          {/* Start and End Times */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Giờ bắt đầu</Text>
              <TimeInput
                value={startTime}
                onChangeText={setStartTime}
                style={[
                  styles.input,
                  errors.startTime ? styles.inputError : null
                ]}
              />
              {errors.startTime && (
                <Text style={styles.errorText}>{errors.startTime}</Text>
              )}
            </View>
            
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Giờ kết thúc</Text>
              <TimeInput
                value={endTime}
                onChangeText={setEndTime}
                style={[
                  styles.input,
                  errors.endTime ? styles.inputError : null
                ]}
              />
              {errors.endTime && (
                <Text style={styles.errorText}>{errors.endTime}</Text>
              )}
            </View>
          </View>
          
          {/* Office End Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Giờ kết thúc hành chính</Text>
            <TimeInput
              value={officeEndTime}
              onChangeText={setOfficeEndTime}
              style={[
                styles.input,
                errors.officeEndTime ? styles.inputError : null
              ]}
            />
            {errors.officeEndTime && (
              <Text style={styles.errorText}>{errors.officeEndTime}</Text>
            )}
          </View>
          
          {/* Days Applied */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày áp dụng trong tuần</Text>
            <View style={styles.daysContainer}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const isSelected = daysApplied.includes(day);
                const dayLabel = {
                  'Mon': 'T2',
                  'Tue': 'T3',
                  'Wed': 'T4',
                  'Thu': 'T5',
                  'Fri': 'T6',
                  'Sat': 'T7',
                  'Sun': 'CN'
                }[day];
                
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      isSelected ? styles.dayButtonActive : null
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text 
                      style={[
                        styles.dayButtonText,
                        isSelected ? styles.dayButtonTextActive : null
                      ]}
                    >
                      {dayLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.daysApplied && (
              <Text style={styles.errorText}>{errors.daysApplied}</Text>
            )}
          </View>
          
          {/* Remind Before Start */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nhắc nhở trước giờ vào làm (phút)</Text>
            <View style={styles.selectContainer}>
              {[5, 10, 15, 30, 60].map(minutes => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.selectOption,
                    remindBeforeStart === minutes.toString() ? styles.selectOptionActive : null
                  ]}
                  onPress={() => setRemindBeforeStart(minutes.toString())}
                >
                  <Text 
                    style={[
                      styles.selectOptionText,
                      remindBeforeStart === minutes.toString() ? styles.selectOptionTextActive : null
                    ]}
                  >
                    {minutes}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Remind After End */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nhắc nhở sau giờ làm (phút)</Text>
            <View style={styles.selectContainer}>
              {[5, 10, 15, 30, 60].map(minutes => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.selectOption,
                    remindAfterEnd === minutes.toString() ? styles.selectOptionActive : null
                  ]}
                  onPress={() => setRemindAfterEnd(minutes.toString())}
                >
                  <Text 
                    style={[
                      styles.selectOptionText,
                      remindAfterEnd === minutes.toString() ? styles.selectOptionTextActive : null
                    ]}
                  >
                    {minutes}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Break Minutes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Thời gian nghỉ (phút)</Text>
            <TextInput
              value={breakMinutes}
              onChangeText={setBreakMinutes}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          
          {/* Show Punch */}
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>Hiển thị nút Ký công</Text>
                <Text style={styles.sublabel}>
                  Hiển thị nút ký công khi đang làm việc
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.switch,
                  showPunch ? styles.switchActive : null
                ]}
                onPress={() => setShowPunch(!showPunch)}
              >
                <View 
                  style={[
                    styles.switchThumb,
                    showPunch ? styles.switchThumbActive : null
                  ]} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Form Actions */}
          <View style={styles.formActions}>
            <Button
              title="Đặt lại"
              onPress={() => setShowResetConfirm(true)}
              variant="outline"
              style={styles.resetButton}
            />
            <Button
              title="Lưu ca làm việc"
              onPress={handleSubmit}
              disabled={Object.keys(errors).length > 0}
              style={styles.saveButton}
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Reset Confirmation Dialog */}
      <Dialog
        visible={showResetConfirm}
        title="Xác nhận đặt lại"
        message="Bạn có chắc chắn muốn đặt lại form? Mọi thay đổi chưa lưu sẽ bị mất."
        confirmText="Đặt lại"
        cancelText="Hủy"
        onConfirm={resetForm}
        onCancel={() => setShowResetConfirm(false)}
      />
      
      {/* Save Confirmation Dialog */}
      <Dialog
        visible={showSaveConfirm}
        title="Xác nhận lưu ca làm việc"
        message="Bạn có chắc chắn muốn lưu ca làm việc này?"
        confirmText="Lưu"
        cancelText="Hủy"
        onConfirm={saveShift}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  sublabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.appDarkTextSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.appDarkLight,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
    borderRadius: 8,
    padding: SPACING.sm,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  inputError: {
    borderColor: COLORS.appStatusError,
  },
  errorText: {
    color: COLORS.appStatusError,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.appDarkLight,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  dayButtonActive: {
    backgroundColor: COLORS.appPurple,
    borderColor: COLORS.appPurple,
  },
  dayButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.appDarkTextSecondary,
  },
  dayButtonTextActive: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  selectOption: {
    flex: 1,
    padding: SPACING.sm,
    marginHorizontal: 2,
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  selectOptionActive: {
    backgroundColor: COLORS.appPurple,
    borderColor: COLORS.appPurple,
  },
  selectOptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.appDarkTextSecondary,
  },
  selectOptionTextActive: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.appDarkLight,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: COLORS.appPurple,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  resetButton: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  saveButton: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
});

export default ShiftForm;
