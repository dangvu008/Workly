"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native"
import { COLORS } from "../constants/colors"
import { MaterialIcons } from "@expo/vector-icons"
import { useAppContext } from "../context/AppContext"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useTranslation } from "../i18n/useTranslation"

const NoteForm = memo(({ visible, onClose, noteToEdit = null }) => {
  const { shifts, addNote, updateNote, isNoteDuplicate } = useAppContext()
  const { t } = useTranslation()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [reminderTime, setReminderTime] = useState("08:00")
  const [associatedShiftIds, setAssociatedShiftIds] = useState([])
  const [explicitReminderDays, setExplicitReminderDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"])

  const [errors, setErrors] = useState({})
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Reset form
  const resetForm = useCallback(() => {
    setTitle("")
    setContent("")
    setReminderTime("08:00")
    setAssociatedShiftIds([])
    setExplicitReminderDays(["Mon", "Tue", "Wed", "Thu", "Fri"])
    setErrors({})
  }, [])

  // Khởi tạo form khi mở
  useEffect(() => {
    if (visible) {
      if (noteToEdit) {
        // Chế độ sửa
        setTitle(noteToEdit.title || "")
        setContent(noteToEdit.content || "")
        setReminderTime(noteToEdit.reminderTime || "08:00")
        setAssociatedShiftIds(noteToEdit.associatedShiftIds || [])
        setExplicitReminderDays(noteToEdit.explicitReminderDays || ["Mon", "Tue", "Wed", "Thu", "Fri"])
      } else {
        // Chế độ thêm mới
        resetForm()
      }
      setErrors({})
    }
  }, [visible, noteToEdit, resetForm])

  // Tối ưu hóa danh sách ca làm việc bằng useMemo
  const availableShifts = useMemo(() => {
    return shifts.filter((shift) => shift.name && shift.id)
  }, [shifts])

  // Tối ưu hóa danh sách ngày trong tuần bằng useMemo
  const weekDays = useMemo(() => {
    return [
      { day: "Mon", label: t("shifts.days.mon") },
      { day: "Tue", label: t("shifts.days.tue") },
      { day: "Wed", label: t("shifts.days.wed") },
      { day: "Thu", label: t("shifts.days.thu") },
      { day: "Fri", label: t("shifts.days.fri") },
      { day: "Sat", label: t("shifts.days.sat") },
      { day: "Sun", label: t("shifts.days.sun") },
    ]
  }, [t])

  // Tối ưu hóa validateForm bằng useMemo
  const formErrors = useMemo(() => {
    const newErrors = {}

    // Kiểm tra tiêu đề
    if (!title.trim()) {
      newErrors.title = t("notes.validation.titleRequired")
    } else if (title.length > 100) {
      newErrors.title = t("notes.validation.titleRequired")
    }

    // Kiểm tra nội dung
    if (!content.trim()) {
      newErrors.content = t("notes.validation.contentRequired")
    } else if (content.length > 300) {
      newErrors.content = t("notes.validation.contentRequired")
    }

    // Kiểm tra thời gian nhắc nhở
    if (!reminderTime) {
      newErrors.reminderTime = t("notes.validation.reminderTimeRequired")
    }

    // Kiểm tra ngày nhắc nhở (nếu không có ca liên kết)
    if (associatedShiftIds.length === 0 && explicitReminderDays.length === 0) {
      newErrors.explicitReminderDays = t("notes.validation.reminderDaysRequired")
    }

    // Kiểm tra trùng lặp
    if (title.trim() && content.trim() && isNoteDuplicate(title, content, noteToEdit?.id)) {
      newErrors.duplicate = t("notes.validation.duplicateNote")
    }

    return newErrors
  }, [title, content, reminderTime, associatedShiftIds, explicitReminderDays, noteToEdit?.id, isNoteDuplicate, t])

  // Sử dụng formErrors trong validateForm
  const validateForm = useCallback(() => {
    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }, [formErrors])

  // Xử lý lưu ghi chú
  const handleSave = useCallback(() => {
    if (!validateForm()) return

    Alert.alert(t("common.confirm"), t("notes.saveConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.save"),
        onPress: () => {
          const noteData = {
            title: title.trim(),
            content: content.trim(),
            reminderTime,
            associatedShiftIds,
            explicitReminderDays: associatedShiftIds.length > 0 ? [] : explicitReminderDays,
          }

          if (noteToEdit) {
            updateNote(noteToEdit.id, noteData)
          } else {
            addNote(noteData)
          }

          onClose()
        },
      },
    ])
  }, [
    validateForm,
    t,
    title,
    content,
    reminderTime,
    associatedShiftIds,
    explicitReminderDays,
    noteToEdit,
    updateNote,
    addNote,
    onClose,
  ])

  // Tối ưu hóa handleTimeChange
  const handleTimeChange = useCallback((event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios")

    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0")
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0")
      setReminderTime(`${hours}:${minutes}`)
    }
  }, [])

  // Tối ưu hóa toggleShift
  const toggleShift = useCallback((shiftId) => {
    setAssociatedShiftIds((prev) => {
      if (prev.includes(shiftId)) {
        return prev.filter((id) => id !== shiftId)
      } else {
        return [...prev, shiftId]
      }
    })
  }, [])

  // Tối ưu hóa toggleDay
  const toggleDay = useCallback((day) => {
    setExplicitReminderDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }, [])

  // Tối ưu hóa showTimePickerModal
  const showTimePickerModal = useCallback(() => {
    setShowTimePicker(true)
  }, [])

  // Tối ưu hóa formatDisplayTime bằng useMemo
  const formattedReminderTime = useMemo(() => {
    if (!reminderTime) return ""

    const [hours, minutes] = reminderTime.split(":").map(Number)

    if (isNaN(hours) || isNaN(minutes)) return reminderTime

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }, [reminderTime])

  // Tối ưu hóa DateTimePicker
  const timePickerDate = useMemo(() => {
    const [hours, minutes] = reminderTime.split(":").map(Number)
    const date = new Date()
    date.setHours(hours || 0, minutes || 0, 0, 0)
    return date
  }, [reminderTime])

  // Tối ưu hóa render danh sách ca làm việc
  const renderShifts = useMemo(() => {
    if (availableShifts.length === 0) {
      return <Text style={styles.noShiftsText}>{t("shifts.noShifts")}</Text>
    }

    return availableShifts.map((shift) => (
      <View key={shift.id} style={styles.shiftItem}>
        <Text style={styles.shiftName}>{shift.name}</Text>
        <Switch
          value={associatedShiftIds.includes(shift.id)}
          onValueChange={() => toggleShift(shift.id)}
          trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
          thumbColor={associatedShiftIds.includes(shift.id) ? COLORS.accent : COLORS.white}
        />
      </View>
    ))
  }, [availableShifts, associatedShiftIds, toggleShift, t])

  // Tối ưu hóa render danh sách ngày
  const renderDays = useMemo(() => {
    return weekDays.map(({ day, label }) => (
      <TouchableOpacity
        key={day}
        style={[styles.dayButton, explicitReminderDays.includes(day) ? styles.dayButtonActive : {}]}
        onPress={() => toggleDay(day)}
      >
        <Text style={[styles.dayButtonText, explicitReminderDays.includes(day) ? styles.dayButtonTextActive : {}]}>
          {label}
        </Text>
      </TouchableOpacity>
    ))
  }, [weekDays, explicitReminderDays, toggleDay])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{noteToEdit ? t("notes.editNote") : t("notes.addNote")}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Tiêu đề */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t("notes.title")}</Text>
              <TextInput
                style={[styles.input, errors.title ? styles.inputError : null]}
                value={title}
                onChangeText={setTitle}
                placeholder={t("notes.title")}
                maxLength={100}
              />
              <View style={styles.inputFooter}>
                {errors.title ? (
                  <Text style={styles.errorText}>{errors.title}</Text>
                ) : (
                  <Text style={styles.charCount}>{t("notes.characterCount", { current: title.length, max: 100 })}</Text>
                )}
              </View>
            </View>

            {/* Nội dung */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t("notes.content")}</Text>
              <TextInput
                style={[styles.textArea, errors.content ? styles.inputError : null]}
                value={content}
                onChangeText={setContent}
                placeholder={t("notes.content")}
                multiline
                numberOfLines={4}
                maxLength={300}
                textAlignVertical="top"
              />
              <View style={styles.inputFooter}>
                {errors.content ? (
                  <Text style={styles.errorText}>{errors.content}</Text>
                ) : (
                  <Text style={styles.charCount}>
                    {t("notes.characterCount", { current: content.length, max: 300 })}
                  </Text>
                )}
              </View>
            </View>

            {/* Thời gian nhắc nhở */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t("notes.reminderTime")}</Text>
              <TouchableOpacity
                style={[styles.timePicker, errors.reminderTime ? styles.inputError : null]}
                onPress={showTimePickerModal}
              >
                <Text style={styles.timePickerText}>{formattedReminderTime}</Text>
                <MaterialIcons name="access-time" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              {errors.reminderTime && <Text style={styles.errorText}>{errors.reminderTime}</Text>}

              {showTimePicker && (
                <DateTimePicker
                  value={timePickerDate}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            {/* Ca làm việc liên kết */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t("notes.associatedShifts")}</Text>
              {availableShifts.length > 0 ? (
                <View style={styles.shiftsContainer}>{renderShifts}</View>
              ) : (
                <Text style={styles.noShiftsText}>{t("shifts.noShifts")}</Text>
              )}
            </View>

            {/* Ngày nhắc nhở (nếu không theo ca) */}
            {associatedShiftIds.length === 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t("notes.reminderDays")}</Text>
                <View style={styles.daysContainer}>{renderDays}</View>
                {errors.explicitReminderDays && <Text style={styles.errorText}>{errors.explicitReminderDays}</Text>}
              </View>
            )}

            {/* Lỗi trùng lặp */}
            {errors.duplicate && <Text style={[styles.errorText, styles.duplicateError]}>{errors.duplicate}</Text>}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, Object.keys(errors).length > 0 ? styles.disabledButton : {}]}
              onPress={handleSave}
              disabled={Object.keys(errors).length > 0}
            >
              <Text style={styles.saveButtonText}>{t("common.save")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
})

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    width: "90%",
    maxWidth: 600,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkGray,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.gray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: COLORS.darkGray,
    minHeight: 100,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
  },
  timePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    padding: 12,
  },
  timePickerText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  shiftsContainer: {
    marginTop: 8,
  },
  shiftItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.light,
    borderRadius: 4,
    marginBottom: 8,
  },
  shiftName: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dayButton: {
    backgroundColor: COLORS.light,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: "13%",
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  dayButtonTextActive: {
    color: COLORS.white,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.darkGray,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  duplicateError: {
    marginTop: 8,
    textAlign: "center",
  },
  noShiftsText: {
    fontSize: 16,
    color: COLORS.gray,
    fontStyle: "italic",
    marginTop: 8,
  },
})

export default memo(NoteForm)
