import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, Menu, TouchableRipple, Card, Divider } from 'react-native-paper';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { FastIcon } from './WorklyIcon';
import { DailyWorkStatus, Shift, AttendanceLog } from '../types';
import { WEEKLY_STATUS } from '../constants';
import { TimeEditModal } from './TimeEditModal';
import { storageService } from '../services/storage';
import { useApp } from '../contexts/AppContext';
import { t } from '../i18n';

interface ManualStatusUpdateModalProps {
  visible: boolean;
  onDismiss: () => void;
  date: string;
  currentStatus: DailyWorkStatus | null;
  shift: Shift | null;
  availableShifts: Shift[];
  onStatusUpdate: (data: {
    selectedShiftId: string;
    status: DailyWorkStatus['status'];
    checkInTime?: string;
    checkOutTime?: string;
  }) => Promise<void>;
  onTimeEdit?: (checkInTime: string, checkOutTime: string) => Promise<void>;
  onRecalculateFromLogs?: () => Promise<void>;
  onClearManualStatus?: () => Promise<void>;
}

/**
 * Modal cập nhật trạng thái làm việc với thiết kế mới
 * - Thứ tự: Ca làm việc → Trạng thái → Giờ chấm công (conditional)
 * - Logic editability: Giờ chỉ editable khi chọn trạng thái làm việc
 * - Validation theo ngữ cảnh
 */
export function ManualStatusUpdateModal({
  visible,
  onDismiss,
  date,
  currentStatus,
  shift,
  availableShifts = [],
  onStatusUpdate,
  onTimeEdit,
  onRecalculateFromLogs,
  onClearManualStatus,
}: ManualStatusUpdateModalProps) {
  const theme = useTheme();
  const { state } = useApp();

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  // ✅ Tất cả useState hooks phải được khai báo đầu tiên
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<DailyWorkStatus['status'] | ''>('');
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');
  const [timeFieldsEditable, setTimeFieldsEditable] = useState(false);
  const [shiftMenuVisible, setShiftMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [timeEditModalVisible, setTimeEditModalVisible] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Dữ liệu được load khi modal mở
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [selectedShiftInfo, setSelectedShiftInfo] = useState<Shift | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // ✅ Validation và xử lý date - sử dụng useMemo
  const isValidDate = React.useMemo(() => {
    if (!date || typeof date !== 'string') {
      console.error('ManualStatusUpdateModal: Invalid date prop:', date);
      return false;
    }

    // Kiểm tra format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error('ManualStatusUpdateModal: Invalid date format, expected YYYY-MM-DD:', date);
      return false;
    }

    // Kiểm tra date có thể parse được không
    try {
      const testDate = parseISO(date);
      if (isNaN(testDate.getTime())) {
        console.error('ManualStatusUpdateModal: Date cannot be parsed:', date);
        return false;
      }
      return true;
    } catch (error) {
      console.error('ManualStatusUpdateModal: Error validating date:', error, 'Date:', date);
      return false;
    }
  }, [date]);

  // ✅ Xác định loại ngày và dateObj
  const { dateObj, dateType } = React.useMemo(() => {
    if (!isValidDate) {
      return { dateObj: null, dateType: 'current' as const };
    }

    try {
      const parsedDate = parseISO(date);

      let type: 'past' | 'current' | 'future';
      if (isToday(parsedDate)) {
        type = 'current';
      } else if (isPast(parsedDate)) {
        type = 'past';
      } else {
        type = 'future';
      }

      return { dateObj: parsedDate, dateType: type };
    } catch (error) {
      console.error('ManualStatusUpdateModal: Error parsing date in useMemo:', error, 'Date:', date);
      return { dateObj: null, dateType: 'current' as const };
    }
  }, [date, isValidDate]);

  // Hàm load dữ liệu đầy đủ cho ngày được chọn
  const loadDataForSelectedDate = async () => {
    if (!isValidDate || !dateObj) return;

    try {
      setIsLoadingData(true);

      // Load attendance logs cho ngày được chọn
      const logs = await storageService.getAttendanceLogsForDate(date);
      setAttendanceLogs(logs);

      console.log(`📊 ManualStatusUpdateModal: Loaded ${logs.length} attendance logs for ${date}:`, logs);

    } catch (error) {
      console.error('Error loading data for selected date:', error);
      setAttendanceLogs([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ✅ Khởi tạo dữ liệu khi modal mở - luôn gọi useEffect
  useEffect(() => {
    if (visible && isValidDate && dateObj) {
      // Load dữ liệu đầy đủ
      loadDataForSelectedDate();

      // Khởi tạo ca làm việc
      const initialShiftId = currentStatus?.appliedShiftIdForDay || shift?.id ||
                            (availableShifts.length > 0 ? availableShifts[0].id : '');
      setSelectedShiftId(initialShiftId);

      // Cập nhật thông tin ca làm việc được chọn
      const shiftInfo = availableShifts.find(s => s.id === initialShiftId) || null;
      setSelectedShiftInfo(shiftInfo);

      // Khởi tạo trạng thái - đảm bảo luôn có giá trị hiển thị
      const initialStatus = currentStatus?.status || '';
      setSelectedStatus(initialStatus);

      // Khởi tạo giờ chấm công
      setCheckInTime(currentStatus?.vaoLogTime ?
        format(parseISO(currentStatus.vaoLogTime), 'HH:mm') : '');
      setCheckOutTime(currentStatus?.raLogTime ?
        format(parseISO(currentStatus.raLogTime), 'HH:mm') : '');

      // Khởi tạo editability - ban đầu disabled
      setTimeFieldsEditable(false);
      setErrors({});
    }
  }, [visible, currentStatus, shift, availableShifts, isValidDate, dateObj]);

  // ✅ Early return sau tất cả hooks để tránh lỗi hooks order
  if (!visible || !isValidDate || !dateObj) {
    return null;
  }

  // Danh sách trạng thái theo loại ngày
  const getAvailableStatuses = () => {
    if (dateType === 'future') {
      // Ngày tương lai: chỉ các trạng thái nghỉ
      return [
        { key: 'day_off', ...WEEKLY_STATUS.day_off },
        { key: 'NGHI_PHEP', ...WEEKLY_STATUS.NGHI_PHEP },
        { key: 'NGHI_BENH', ...WEEKLY_STATUS.NGHI_BENH },
        { key: 'NGHI_LE', ...WEEKLY_STATUS.NGHI_LE },
        { key: 'VANG_MAT', ...WEEKLY_STATUS.VANG_MAT },
        { key: 'CONG_TAC', ...WEEKLY_STATUS.CONG_TAC },
      ];
    } else {
      // Ngày quá khứ/hiện tại: đầy đủ options
      return [
        { key: 'TINH_THEO_CHAM_CONG', ...WEEKLY_STATUS.TINH_THEO_CHAM_CONG },
        { key: 'DU_CONG', ...WEEKLY_STATUS.DU_CONG },
        { key: 'DI_MUON', ...WEEKLY_STATUS.DI_MUON },
        { key: 'VE_SOM', ...WEEKLY_STATUS.VE_SOM },
        { key: 'DI_MUON_VE_SOM', ...WEEKLY_STATUS.DI_MUON_VE_SOM },
        { key: 'day_off', ...WEEKLY_STATUS.day_off },
        { key: 'NGHI_PHEP', ...WEEKLY_STATUS.NGHI_PHEP },
        { key: 'NGHI_BENH', ...WEEKLY_STATUS.NGHI_BENH },
        { key: 'NGHI_LE', ...WEEKLY_STATUS.NGHI_LE },
        { key: 'VANG_MAT', ...WEEKLY_STATUS.VANG_MAT },
        { key: 'CONG_TAC', ...WEEKLY_STATUS.CONG_TAC },
        { key: 'THIEU_LOG', ...WEEKLY_STATUS.THIEU_LOG },
        ...(currentStatus?.isManualOverride ? [
          { key: 'XOA_TRANG_THAI_THU_CONG', ...WEEKLY_STATUS.XOA_TRANG_THAI_THU_CONG }
        ] : [])
      ];
    }
  };

  // Xử lý thay đổi trạng thái - Logic editability
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus as DailyWorkStatus['status']);
    
    // Logic kích hoạt sửa giờ
    const workStatuses = ['TINH_THEO_CHAM_CONG', 'DU_CONG', 'DI_MUON', 'VE_SOM', 'DI_MUON_VE_SOM', 'THIEU_LOG'];
    const leaveStatuses = ['day_off', 'NGHI_PHEP', 'NGHI_BENH', 'NGHI_LE', 'VANG_MAT', 'CONG_TAC'];
    
    if (workStatuses.includes(newStatus)) {
      // Kích hoạt chỉnh sửa giờ cho trạng thái làm việc
      setTimeFieldsEditable(true);
      
      // Auto-fill giờ từ ca làm việc nếu chưa có
      const selectedShift = availableShifts.find(s => s.id === selectedShiftId);
      if (selectedShift && !checkInTime) {
        setCheckInTime(selectedShift.startTime);
      }
      if (selectedShift && !checkOutTime) {
        setCheckOutTime(selectedShift.endTime);
      }
    } else if (leaveStatuses.includes(newStatus)) {
      // Vô hiệu hóa chỉnh sửa giờ cho trạng thái nghỉ
      setTimeFieldsEditable(false);
      // Có thể xóa giờ hoặc giữ nguyên tùy logic
    }
    
    setStatusMenuVisible(false);
  };

  // Validation dữ liệu
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!selectedShiftId) {
      newErrors.shift = 'Vui lòng chọn ca làm việc';
    }
    
    if (!selectedStatus) {
      newErrors.status = 'Vui lòng chọn trạng thái';
    }
    
    // Validation cho trạng thái làm việc
    const workStatuses = ['TINH_THEO_CHAM_CONG', 'DU_CONG', 'DI_MUON', 'VE_SOM', 'DI_MUON_VE_SOM', 'THIEU_LOG'];
    if (workStatuses.includes(selectedStatus) && timeFieldsEditable) {
      if (!checkInTime || !checkOutTime) {
        newErrors.time = 'Vui lòng nhập đầy đủ giờ chấm công cho trạng thái này';
      } else {
        // Validation thời gian
        const [inHour, inMin] = checkInTime.split(':').map(Number);
        const [outHour, outMin] = checkOutTime.split(':').map(Number);
        
        if (isNaN(inHour) || isNaN(inMin) || isNaN(outHour) || isNaN(outMin)) {
          newErrors.time = 'Định dạng giờ không hợp lệ (HH:MM)';
        } else {
          const inMinutes = inHour * 60 + inMin;
          const outMinutes = outHour * 60 + outMin;
          
          if (outMinutes <= inMinutes) {
            newErrors.time = 'Giờ ra phải sau giờ vào';
          }
        }
      }
      
      // Validation mâu thuẫn trạng thái vs giờ
      if (selectedStatus === 'DI_MUON' && checkInTime) {
        const selectedShift = availableShifts.find(s => s.id === selectedShiftId);
        if (selectedShift && checkInTime <= selectedShift.startTime) {
          newErrors.consistency = `Giờ vào không khớp với trạng thái 'Vào muộn'. Vui lòng chọn 'Tính theo chấm công' hoặc điều chỉnh giờ.`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý lưu thay đổi
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Xử lý các trường hợp đặc biệt
      if (selectedStatus === 'XOA_TRANG_THAI_THU_CONG') {
        if (onClearManualStatus) {
          await onClearManualStatus();
        }
        onDismiss();
        return;
      }

      if (selectedStatus === 'TINH_THEO_CHAM_CONG') {
        if (onRecalculateFromLogs) {
          await onRecalculateFromLogs();
        }
        onDismiss();
        return;
      }

      // Kiểm tra selectedStatus không rỗng trước khi gọi onStatusUpdate
      if (!selectedStatus) {
        console.error('ManualStatusUpdateModal: selectedStatus is empty');
        return;
      }

      // Chuẩn bị dữ liệu
      const updateData = {
        selectedShiftId,
        status: selectedStatus as Exclude<typeof selectedStatus, ''>, // Type assertion để loại bỏ empty string
        checkInTime: timeFieldsEditable && checkInTime ? checkInTime : undefined,
        checkOutTime: timeFieldsEditable && checkOutTime ? checkOutTime : undefined,
      };

      await onStatusUpdate(updateData);
      onDismiss();
      
    } catch (error) {
      console.error('Error saving status:', error);
      Alert.alert('❌ Lỗi', 'Không thể lưu thay đổi. Vui lòng thử lại.');
    }
  };

  // Render header
  const renderHeader = () => {
    // ✅ Đảm bảo dateObj không null vì đã check ở early return
    if (!dateObj) return null;

    const dayName = format(dateObj, 'EEEE', { locale: currentLanguage === 'vi' ? vi : enUS });
    const dateStr = format(dateObj, 'dd/MM/yyyy');

    let dateTypeIcon = '';
    let dateTypeText = '';

    switch (dateType) {
      case 'current':
        dateTypeIcon = '📅';
        dateTypeText = 'Hôm nay';
        break;
      case 'past':
        dateTypeIcon = '⏪';
        dateTypeText = 'Quá khứ';
        break;
      case 'future':
        dateTypeIcon = '⏩';
        dateTypeText = 'Tương lai';
        break;
    }

    return (
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Cập nhật cho: {dayName}, {dateStr}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {dateTypeIcon} {dateTypeText}
        </Text>
      </View>
    );
  };



  // Render thông tin attendance logs thực tế
  const renderAttendanceLogsInfo = () => {
    if (isLoadingData) {
      return (
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <View style={styles.infoRow}>
              <FastIcon
                name="loading"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                Đang tải dữ liệu chấm công...
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    if (attendanceLogs.length === 0) {
      return (
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
              🕐 Dữ liệu chấm công thực tế
            </Text>
            <View style={styles.infoRow}>
              <FastIcon
                name="clock-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                Chưa có dữ liệu chấm công cho ngày này
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    const logTypeNames = {
      go_work: 'Đi làm',
      check_in: 'Chấm công vào',
      check_out: 'Chấm công ra',
      complete: 'Hoàn tất',
      punch: 'Punch'
    };

    return (
      <Card style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
            🕐 Dữ liệu chấm công thực tế ({attendanceLogs.length} logs)
          </Text>

          {attendanceLogs.map((log, index) => (
            <View key={index} style={styles.infoRow}>
              <FastIcon
                name="clock-check"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                {logTypeNames[log.type] || log.type}: {format(parseISO(log.time), 'HH:mm:ss')}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surfaceVariant }
        ]}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderHeader()}

          {/* Thông tin attendance logs thực tế */}
          {renderAttendanceLogsInfo()}
          
          {/* Ca làm việc áp dụng cho ngày này */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
              Ca làm việc áp dụng cho ngày này: *
            </Text>
            <Menu
              visible={shiftMenuVisible}
              onDismiss={() => setShiftMenuVisible(false)}
              anchor={
                <TouchableRipple
                  style={[styles.dropdown, { borderColor: theme.colors.outline }]}
                  onPress={() => setShiftMenuVisible(true)}
                >
                  <View style={styles.dropdownContent}>
                    <Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
                      {selectedShiftInfo?.name || availableShifts.find(s => s.id === selectedShiftId)?.name || 'Chọn ca làm việc'}
                    </Text>
                    <Text style={[styles.dropdownIcon, { color: theme.colors.onSurfaceVariant }]}>
                      ▼
                    </Text>
                  </View>
                </TouchableRipple>
              }
            >
              {availableShifts.map((shift) => (
                <Menu.Item
                  key={shift.id}
                  onPress={() => {
                    setSelectedShiftId(shift.id);
                    setSelectedShiftInfo(shift); // Cập nhật thông tin ca làm việc được chọn
                    setShiftMenuVisible(false);
                  }}
                  title={shift.name}
                />
              ))}
            </Menu>
            {errors.shift && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.shift}
              </Text>
            )}
          </View>
          
          {/* Trạng thái làm việc */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
              Trạng thái Làm việc: *
            </Text>
            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <TouchableRipple
                  style={[styles.dropdown, { borderColor: theme.colors.outline }]}
                  onPress={() => setStatusMenuVisible(true)}
                >
                  <View style={styles.dropdownContent}>
                    <Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
                      {(() => {
                        const status = getAvailableStatuses().find(s => s.key === selectedStatus);
                        if (!status) {
                          // Nếu không có trạng thái được chọn, hiển thị trạng thái hiện tại hoặc mặc định
                          if (currentStatus?.status) {
                            const currentStatusConfig = WEEKLY_STATUS[currentStatus.status];
                            if (currentStatusConfig) {
                              return typeof currentStatusConfig.text === 'string'
                                ? currentStatusConfig.text
                                : currentStatusConfig.text?.vi || currentStatus.status;
                            }
                          }
                          return 'Chọn trạng thái';
                        }

                        // Xử lý text đa ngôn ngữ
                        if (typeof status.text === 'string') {
                          return status.text;
                        } else {
                          return status.text?.vi || status.key;
                        }
                      })()}
                    </Text>
                    <Text style={[styles.dropdownIcon, { color: theme.colors.onSurfaceVariant }]}>
                      ▼
                    </Text>
                  </View>
                </TouchableRipple>
              }
            >
              {getAvailableStatuses().map((status) => (
                <Menu.Item
                  key={status.key}
                  onPress={() => handleStatusChange(status.key)}
                  title={typeof status.text === 'string' ? status.text : status.text?.vi || status.key}
                  leadingIcon={status.icon}
                />
              ))}
            </Menu>
            {errors.status && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.status}
              </Text>
            )}
          </View>
          
          {/* Giờ chấm công - chỉ hiện khi editable */}
          {timeFieldsEditable && (
            <>
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                  Giờ Chấm Công Vào:
                </Text>
                <TouchableRipple
                  style={[styles.dropdown, { borderColor: theme.colors.outline }]}
                  onPress={() => setTimeEditModalVisible(true)}
                >
                  <View style={styles.dropdownContent}>
                    <Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
                      {checkInTime || 'Chọn giờ vào'}
                    </Text>
                    <Text style={[styles.dropdownIcon, { color: theme.colors.onSurfaceVariant }]}>
                      ▼
                    </Text>
                  </View>
                </TouchableRipple>
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                  Giờ Chấm Công Ra:
                </Text>
                <TouchableRipple
                  style={[styles.dropdown, { borderColor: theme.colors.outline }]}
                  onPress={() => setTimeEditModalVisible(true)}
                >
                  <View style={styles.dropdownContent}>
                    <Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
                      {checkOutTime || 'Chọn giờ ra'}
                    </Text>
                    <Text style={[styles.dropdownIcon, { color: theme.colors.onSurfaceVariant }]}>
                      ▼
                    </Text>
                  </View>
                </TouchableRipple>
              </View>
              
              {(errors.time || errors.consistency) && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.time || errors.consistency}
                </Text>
              )}
            </>
          )}
          
          {/* Nút hành động */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.button}
            >
              HỦY
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
            >
              LƯU THAY ĐỔI
            </Button>
          </View>
        </ScrollView>
        
        {/* Time Edit Modal */}
        <TimeEditModal
          visible={timeEditModalVisible}
          onDismiss={() => setTimeEditModalVisible(false)}
          currentCheckInTime={checkInTime}
          currentCheckOutTime={checkOutTime}
          shift={availableShifts.find(s => s.id === selectedShiftId) || null}
          onSave={(inTime, outTime) => {
            setCheckInTime(inTime);
            setCheckOutTime(outTime);
            setTimeEditModalVisible(false);
          }}
        />
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  // Styles cho info cards
  infoCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});
