import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  Card,
  IconButton,
  useTheme,
  Checkbox,
  HelperText,
  RadioButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorklyBackground } from '../components/WorklyBackground';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Note } from '../types';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { t } from '../i18n';

type NoteDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NoteDetail'>;

interface NoteDetailScreenProps {
  navigation: NoteDetailScreenNavigationProp;
  route: {
    params?: {
      noteId?: string;
    };
  };
}

export function NoteDetailScreen({ navigation, route }: NoteDetailScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  const noteId = route.params?.noteId;
  const isEditing = !!noteId;
  const existingNote = isEditing ? state.notes.find(n => n.id === noteId) : null;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPriority: false,
    hasReminder: false,
    reminderType: 'specific' as 'specific' | 'shift', // "Đặt lịch cụ thể" | "Nhắc theo ca"
    reminderDateTime: new Date(),
    associatedShiftIds: [] as string[],
    enableNotifications: true, // ✅ Mặc định cho phép thông báo
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    title: '',
    content: '',
    reminderDateTime: '',
    reminderShifts: '',
    duplicate: '',
  });

  // Status messages
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | '';
    message: string;
  }>({ type: '', message: '' });

  useEffect(() => {
    if (existingNote) {
      // Determine reminder type based on existing data
      const hasSpecificTime = !!existingNote.reminderDateTime;
      const hasShiftAssociation = (existingNote.associatedShiftIds?.length || 0) > 0;

      setFormData({
        title: existingNote.title,
        content: existingNote.content,
        isPriority: existingNote.isPriority,
        hasReminder: hasSpecificTime || hasShiftAssociation,
        reminderType: hasSpecificTime ? 'specific' : 'shift',
        reminderDateTime: existingNote.reminderDateTime ? new Date(existingNote.reminderDateTime) : new Date(),
        associatedShiftIds: existingNote.associatedShiftIds || [],
        enableNotifications: existingNote.enableNotifications !== false, // ✅ Mặc định true nếu undefined
      });
    }
  }, [existingNote]);

  const handleShiftToggle = (shiftId: string) => {
    setFormData(prev => ({
      ...prev,
      associatedShiftIds: prev.associatedShiftIds.includes(shiftId)
        ? prev.associatedShiftIds.filter(id => id !== shiftId)
        : [...prev.associatedShiftIds, shiftId],
    }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, reminderShifts: '' }));
  };

  const checkDuplicateNote = (title: string, content: string): boolean => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    return state.notes.some(note =>
      note.id !== noteId && // Exclude current note when editing
      note.title.trim().toLowerCase() === trimmedTitle.toLowerCase() &&
      note.content.trim().toLowerCase() === trimmedContent.toLowerCase()
    );
  };

  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      content: '',
      reminderDateTime: '',
      reminderShifts: '',
      duplicate: '',
    };

    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
      isValid = false;
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Tiêu đề không được vượt quá 100 ký tự';
      isValid = false;
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung là bắt buộc';
      isValid = false;
    } else if (formData.content.trim().length > 300) {
      newErrors.content = 'Nội dung không được vượt quá 300 ký tự';
      isValid = false;
    }

    // Duplicate check
    if (formData.title.trim() && formData.content.trim()) {
      if (checkDuplicateNote(formData.title, formData.content)) {
        newErrors.duplicate = 'Đã tồn tại ghi chú với tiêu đề và nội dung giống hệt';
        isValid = false;
      }
    }

    // Reminder validation
    if (formData.hasReminder) {
      if (formData.reminderType === 'specific') {
        // Validate specific date/time
        const now = new Date();
        const reminderTime = new Date(formData.reminderDateTime);

        if (reminderTime <= now) {
          newErrors.reminderDateTime = 'Thời gian nhắc nhở phải trong tương lai';
          isValid = false;
        }
      } else if (formData.reminderType === 'shift') {
        // Validate shift selection
        if (formData.associatedShiftIds.length === 0) {
          newErrors.reminderShifts = 'Vui lòng chọn ít nhất một ca làm việc';
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setStatusMessage({ type: '', message: '' }); // Clear previous status

      const noteData: Note = {
        id: isEditing ? noteId! : `note_${Date.now()}`,
        title: formData.title.trim(),
        content: formData.content.trim(),
        isPriority: formData.isPriority,
        reminderDateTime: (formData.hasReminder && formData.reminderType === 'specific')
          ? formData.reminderDateTime.toISOString()
          : undefined,
        associatedShiftIds: (formData.hasReminder && formData.reminderType === 'shift' && formData.associatedShiftIds.length > 0)
          ? formData.associatedShiftIds
          : undefined,
        createdAt: existingNote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enableNotifications: formData.enableNotifications, // ✅ Lưu tùy chọn thông báo
      };

      if (isEditing) {
        await actions.updateNote(noteId!, noteData);
        setStatusMessage({ type: 'success', message: '✅ Đã cập nhật ghi chú thành công!' });
      } else {
        await actions.addNote(noteData);
        setStatusMessage({ type: 'success', message: '✅ Đã tạo ghi chú mới thành công!' });
      }

      // Auto navigate back after 2 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: '❌ Không thể lưu ghi chú. Vui lòng thử lại.' });
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (!isEditing) return;
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setStatusMessage({ type: '', message: '' }); // Clear previous status
      await actions.deleteNote(noteId!);
      setStatusMessage({ type: 'success', message: '✅ Đã xóa ghi chú thành công!' });

      // Auto navigate back after 1.5 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      setStatusMessage({ type: 'error', message: '❌ Không thể xóa ghi chú. Vui lòng thử lại.' });
    }
    setDeleteConfirm(false);
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(formData.reminderDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setFormData(prev => ({ ...prev, reminderDateTime: newDateTime }));
    }
  };

  const onTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(formData.reminderDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setFormData(prev => ({ ...prev, reminderDateTime: newDateTime }));
      // Clear reminder time error
      setErrors(prev => ({ ...prev, reminderDateTime: '' }));
    }
  };

  // Helper functions to clear errors on input change
  const handleTitleChange = (text: string) => {
    setFormData(prev => ({ ...prev, title: text }));
    setErrors(prev => ({ ...prev, title: '', duplicate: '' }));
  };

  const handleContentChange = (text: string) => {
    setFormData(prev => ({ ...prev, content: text }));
    setErrors(prev => ({ ...prev, content: '', duplicate: '' }));
  };

  // Check if form is valid for save button state
  const isFormValid = () => {
    return formData.title.trim().length > 0 &&
           formData.title.trim().length <= 100 &&
           formData.content.trim().length > 0 &&
           formData.content.trim().length <= 300 &&
           !checkDuplicateNote(formData.title, formData.content) &&
           (!formData.hasReminder || (
             (formData.reminderType === 'specific' && formData.reminderDateTime > new Date()) ||
             (formData.reminderType === 'shift' && formData.associatedShiftIds.length > 0)
           ));
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
              // Fallback: navigate to NotesTab if can't go back
              navigation.navigate('MainTabs', { screen: 'NotesTab' });
            }
          }}
        />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {isEditing ? t(currentLanguage, 'notes.editNote') : t(currentLanguage, 'notes.addNote')}
        </Text>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!isFormValid()}
          compact
          style={[
            styles.headerSaveButton,
            !isFormValid() && { backgroundColor: theme.colors.surfaceDisabled }
          ]}
        >
          {t(currentLanguage, 'common.save')}
        </Button>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Basic Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Thông tin ghi chú
            </Text>

            <TextInput
              label={`${t(currentLanguage, 'notes.noteTitle')} *`}
              value={formData.title}
              onChangeText={handleTitleChange}
              style={styles.input}
              mode="outlined"
              error={!!errors.title}
              maxLength={100}
            />
            <View style={styles.inputFooter}>
              <HelperText type="error" visible={!!errors.title}>
                {errors.title}
              </HelperText>
              <Text style={[styles.characterCount, { color: theme.colors.onSurfaceVariant }]}>
                {formData.title.length}/100
              </Text>
            </View>

            <TextInput
              label={`${t(currentLanguage, 'notes.noteContent')} *`}
              value={formData.content}
              onChangeText={handleContentChange}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={6}
              error={!!errors.content}
              maxLength={300}
            />
            <View style={styles.inputFooter}>
              <HelperText type="error" visible={!!errors.content}>
                {errors.content}
              </HelperText>
              <Text style={[styles.characterCount, { color: theme.colors.onSurfaceVariant }]}>
                {formData.content.length}/300
              </Text>
            </View>

            {/* Duplicate error */}
            <HelperText type="error" visible={!!errors.duplicate}>
              {errors.duplicate}
            </HelperText>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'notes.priority')} ⭐
              </Text>
              <Switch
                value={formData.isPriority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isPriority: value }))}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Reminder */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'notes.reminderTime')}
            </Text>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                Đặt nhắc nhở
              </Text>
              <Switch
                value={formData.hasReminder}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, hasReminder: value }));
                  setErrors(prev => ({ ...prev, reminderDateTime: '', reminderShifts: '' }));
                }}
              />
            </View>

            {formData.hasReminder && (
              <>
                {/* ✅ Notification Toggle */}
                <View style={[styles.switchRow, { marginTop: 16 }]}>
                  <View style={styles.switchLabelContainer}>
                    <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                      🔔 Hiển thị thông báo
                    </Text>
                    <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {formData.enableNotifications
                        ? 'Sẽ hiển thị thông báo/nhắc nhở khi đến thời gian'
                        : 'Chỉ hiển thị trên màn hình chính, không có thông báo'}
                    </Text>
                  </View>
                  <Switch
                    value={formData.enableNotifications}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, enableNotifications: value }))}
                  />
                </View>

                {/* Reminder Type Selection */}
                <Text style={[styles.subSectionTitle, { color: theme.colors.onSurface, marginTop: 16 }]}>
                  Chọn kiểu nhắc *
                </Text>

                <RadioButton.Group
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, reminderType: value as 'specific' | 'shift' }));
                    setErrors(prev => ({ ...prev, reminderDateTime: '', reminderShifts: '' }));
                  }}
                  value={formData.reminderType}
                >
                  <View style={styles.radioOption}>
                    <RadioButton value="specific" />
                    <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                      Đặt lịch cụ thể
                    </Text>
                  </View>

                  <View style={styles.radioOption}>
                    <RadioButton value="shift" />
                    <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                      Nhắc theo ca làm việc
                    </Text>
                  </View>
                </RadioButton.Group>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Specific Date/Time or Shift Selection */}
        {formData.hasReminder && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              {formData.reminderType === 'specific' ? (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Đặt lịch cụ thể *
                  </Text>

                  <View style={styles.dateTimeContainer}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowDatePicker(true)}
                      style={styles.dateTimeButton}
                      icon="calendar"
                    >
                      📅 {format(formData.reminderDateTime, 'dd/MM/yyyy', { locale: currentLanguage === 'vi' ? vi : enUS })}
                    </Button>

                    <Button
                      mode="outlined"
                      onPress={() => setShowTimePicker(true)}
                      style={styles.dateTimeButton}
                      icon="clock-outline"
                    >
                      🕐 {format(formData.reminderDateTime, 'HH:mm', { locale: currentLanguage === 'vi' ? vi : enUS })}
                    </Button>
                  </View>

                  <HelperText type="error" visible={!!errors.reminderDateTime}>
                    {errors.reminderDateTime}
                  </HelperText>
                </>
              ) : (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Nhắc theo ca *
                  </Text>
                  <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
                    Nhắc nhở sẽ được đặt trước 5 phút giờ xuất phát (departureTime) của (các) ca đã chọn.
                  </Text>

                  {/* Hiển thị thông tin thời gian nhắc nhở tiếp theo */}
                  {formData.associatedShiftIds.length > 0 && (
                    <View style={[styles.reminderInfoContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.reminderInfoTitle, { color: theme.colors.onSurfaceVariant }]}>
                        📅 Thời gian nhắc nhở tiếp theo:
                      </Text>
                      {formData.associatedShiftIds.map(shiftId => {
                        const shift = state.shifts.find(s => s.id === shiftId);
                        if (!shift) return null;

                        // Tính toán thời gian nhắc nhở tiếp theo cho shift này
                        const { timeSyncService } = require('../services/timeSync');
                        const nextReminderTime = timeSyncService.getNextShiftBasedReminderTime(shift);

                        return (
                          <Text key={shiftId} style={[styles.reminderInfoText, { color: theme.colors.onSurfaceVariant }]}>
                            • {shift.name}: {nextReminderTime
                              ? format(nextReminderTime, 'dd/MM/yyyy HH:mm', { locale: currentLanguage === 'vi' ? vi : enUS })
                              : 'Không có lịch nhắc nhở trong 7 ngày tới'
                            }
                          </Text>
                        );
                      })}
                    </View>
                  )}

                  {state.shifts.length > 0 ? (
                    <View style={styles.shiftsContainer}>
                      {state.shifts.map((shift) => (
                        <View key={shift.id} style={styles.shiftCheckboxRow}>
                          <Checkbox
                            status={formData.associatedShiftIds.includes(shift.id) ? 'checked' : 'unchecked'}
                            onPress={() => handleShiftToggle(shift.id)}
                          />
                          <Text style={[styles.shiftLabel, { color: theme.colors.onSurface }]}>
                            {shift.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.noShiftsText, { color: theme.colors.onSurfaceVariant }]}>
                      Chưa có ca làm việc nào. Hãy tạo ca làm việc trước hoặc chọn "Đặt lịch cụ thể".
                    </Text>
                  )}

                  <HelperText type="error" visible={!!errors.reminderShifts}>
                    {errors.reminderShifts}
                  </HelperText>
                </>
              )}
            </Card.Content>
          </Card>
        )}

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

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={[styles.confirmTitle, { color: theme.colors.onErrorContainer }]}>
                ⚠️ Xác nhận xóa
              </Text>
              <Text style={[styles.confirmMessage, { color: theme.colors.onErrorContainer }]}>
                Bạn có chắc chắn muốn xóa ghi chú "{formData.title.trim()}" không?
                {'\n'}Hành động này không thể hoàn tác.
              </Text>
              <View style={styles.confirmActions}>
                <Button
                  mode="outlined"
                  onPress={() => setDeleteConfirm(false)}
                  style={styles.cancelButton}
                  textColor={theme.colors.onErrorContainer}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmDelete}
                  style={[styles.confirmButton, { backgroundColor: theme.colors.error }]}
                  textColor={theme.colors.onError}
                >
                  Xóa
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Delete Button - Only show when editing */}
        {isEditing && !deleteConfirm && (
          <View style={styles.deleteButtonContainer}>
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.deleteButton}
              icon="delete"
              textColor={theme.colors.error}
            >
              XÓA GHI CHÚ
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.reminderDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={formData.reminderDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          is24Hour={true}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSaveButton: {
    minWidth: 60,
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
  sectionDescription: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    marginBottom: 4,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  timePickerButton: {
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  dateTimeButton: {
    flex: 0.48,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  shiftsContainer: {
    marginTop: 8,
  },
  shiftCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 4,
  },
  shiftLabel: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  noShiftsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  deleteButtonContainer: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  deleteButton: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
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
  reminderInfoContainer: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  reminderInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  reminderInfoText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
});
