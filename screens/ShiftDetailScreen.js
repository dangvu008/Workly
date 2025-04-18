"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useAppContext } from "../context/AppContext"
import { timeToMinutes } from "../utils/dateUtils"
import { useTranslation } from "../i18n/useTranslation"
import { useTheme } from "../context/ThemeContext"
import { shiftDetailScreenStyles } from "../styles/screens/shiftDetailScreen"
import { MaterialIcons } from "@expo/vector-icons"

// Hằng số
const MIN_WORK_DURATION = 120 // 2 giờ = 120 phút
const MIN_OT_DURATION = 30 // Tối thiểu 30 phút OT
const MIN_DEPARTURE_BUFFER = 5 // Tối thiểu 5 phút từ giờ xuất phát đến giờ bắt đầu

const ShiftDetailScreen = memo(({ route, navigation }) => {
  const { shiftId, isNew } = route.params || {}
  const { shifts, addShift, updateShift } = useAppContext()
  const { t } = useTranslation()
  const { colors } = useTheme()

  // State
  const [name, setName] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [officeEndTime, setOfficeEndTime] = useState("17:00")
  const [endTime, setEndTime] = useState("17:30")
  const [departureTime, setDepartureTime] = useState("07:30")
  const [daysApplied, setDaysApplied] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [remindBeforeStart, setRemindBeforeStart] = useState(15)
  const [remindAfterEnd, setRemindAfterEnd] = useState(15)
  const [showPunch, setShowPunch] = useState(false)
  const [breakMinutes, setBreakMinutes] = useState(60)
  const [penaltyRoundingMinutes, setPenaltyRoundingMinutes] = useState(30)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Danh sách ngày trong tuần
  const weekDays = useMemo(
    () => [
      { day: "Mon", label: t("shifts.days.mon") },
      { day: "Tue", label: t("shifts.days.tue") },
      { day: "Wed", label: t("shifts.days.wed") },
      { day: "Thu", label: t("shifts.days.thu") },
      { day: "Fri", label: t("shifts.days.fri") },
      { day: "Sat", label: t("shifts.days.sat") },
      { day: "Sun", label: t("shifts.days.sun") },
    ],
    [t],
  )

  // Load shift data if editing
  useEffect(() => {
    if (!isNew && shiftId) {
      const shift = shifts.find((s) => s.id === shiftId)
      if (shift) {
        setName(shift.name)
        setStartTime(shift.startTime)
        setOfficeEndTime(shift.officeEndTime)
        setEndTime(shift.endTime)
        setDepartureTime(shift.departureTime)
        setDaysApplied(shift.daysApplied)
        setRemindBeforeStart(shift.remindBeforeStart)
        setRemindAfterEnd(shift.remindAfterEnd)
        setShowPunch(shift.showPunch)
        setBreakMinutes(shift.breakMinutes)
        setPenaltyRoundingMinutes(shift.penaltyRoundingMinutes)
      }
    }
    setInitialLoad(false)
  }, [isNew, shiftId, shifts])

  // Set title based on whether we're adding or editing
  useEffect(() => {
    navigation.setOptions({
      title: isNew ? t("shifts.addShift") : t("shifts.shiftDetails"),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={hasErrors || isSubmitting}
          style={{ marginRight: 16, opacity: hasErrors || isSubmitting ? 0.5 : 1 }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MaterialIcons name="save" size={24} color={colors.white} />
          )}
        </TouchableOpacity>
      ),
    })
  }, [isNew, navigation, t, hasErrors, isSubmitting, colors.white])

  // Tối ưu hóa các hàm validation bằng useCallback
  const validateName = useCallback(
    (value) => {
      // Kiểm tra rỗng
      if (!value.trim()) {
        return t("shifts.validation.nameRequired")
      }

      // Kiểm tra độ dài
      if (value.length > 200) {
        return "Tên ca quá dài (tối đa 200 ký tự)."
      }

      // Kiểm tra ký tự hợp lệ - cho phép chữ cái, chữ số và khoảng trắng
      // Regex này cho phép Unicode cho các ngôn ngữ khác nhau
      const validNameRegex = /^[\p{L}\p{N}\s]+$/u
      if (!validNameRegex.test(value)) {
        return "Tên ca chứa ký tự không hợp lệ."
      }

      // Kiểm tra trùng lặp
      const normalizedValue = value.trim().toLowerCase()
      const isDuplicate = shifts.some(
        (shift) => shift.id !== shiftId && shift.name.trim().toLowerCase() === normalizedValue,
      )
      if (isDuplicate) {
        return "Tên ca này đã tồn tại."
      }

      return null
    },
    [shifts, shiftId, t],
  )

  const validateDepartureTime = useCallback((depTime, startT) => {
    const depMinutes = timeToMinutes(depTime)
    let startMinutes = timeToMinutes(startT)

    // Xử lý trường hợp qua đêm
    if (depMinutes > startMinutes) {
      startMinutes += 24 * 60 // Thêm 24 giờ
    }

    // Kiểm tra khoảng cách tối thiểu 5 phút
    if (startMinutes - depMinutes < MIN_DEPARTURE_BUFFER) {
      return "Giờ xuất phát phải trước giờ bắt đầu ít nhất 5 phút."
    }

    return null
  }, [])

  const validateStartAndOfficeEnd = useCallback(
    (startT, officeEndT) => {
      const startMinutes = timeToMinutes(startT)
      let officeEndMinutes = timeToMinutes(officeEndT)

      // Xử lý trường hợp qua đêm
      if (officeEndMinutes < startMinutes) {
        officeEndMinutes += 24 * 60 // Thêm 24 giờ
      }

      // Kiểm tra start phải trước office end
      if (startMinutes >= officeEndMinutes) {
        return t("shifts.validation.startBeforeEnd")
      }

      // Kiểm tra khoảng thời gian làm việc tối thiểu 2 giờ
      if (officeEndMinutes - startMinutes < MIN_WORK_DURATION) {
        return "Thời gian làm việc HC tối thiểu phải là 2 giờ."
      }

      return null
    },
    [t],
  )

  const validateOfficeEndAndEnd = useCallback(
    (officeEndT, endT) => {
      const officeEndMinutes = timeToMinutes(officeEndT)
      let endMinutes = timeToMinutes(endT)

      // Xử lý trường hợp qua đêm
      if (endMinutes < officeEndMinutes) {
        endMinutes += 24 * 60 // Thêm 24 giờ
      }

      // Kiểm tra end phải sau hoặc bằng office end
      if (endMinutes < officeEndMinutes) {
        return t("shifts.validation.officeEndBeforeMax")
      }

      // Nếu end sau office end (có OT), kiểm tra khoảng cách tối thiểu 30 phút
      if (endMinutes > officeEndMinutes && endMinutes - officeEndMinutes < MIN_OT_DURATION) {
        return "Nếu có OT, giờ kết thúc ca phải sau giờ kết thúc HC ít nhất 30 phút."
      }

      return null
    },
    [t],
  )

  const validateDaysApplied = useCallback(
    (days) => {
      if (!days || days.length === 0) {
        return t("shifts.validation.daysRequired")
      }
      return null
    },
    [t],
  )

  // Tối ưu hóa validateAllFields bằng useMemo thay vì useCallback
  const formErrors = useMemo(() => {
    const nameError = validateName(name)
    const departureTimeError = validateDepartureTime(departureTime, startTime)
    const startOfficeEndError = validateStartAndOfficeEnd(startTime, officeEndTime)
    const officeEndEndError = validateOfficeEndAndEnd(officeEndTime, endTime)
    const daysAppliedError = validateDaysApplied(daysApplied)

    return {
      name: nameError,
      departureTime: departureTimeError,
      startTime: startOfficeEndError,
      officeEndTime: startOfficeEndError || officeEndEndError,
      endTime: officeEndEndError,
      daysApplied: daysAppliedError,
    }
  }, [
    validateName,
    name,
    validateDepartureTime,
    departureTime,
    startTime,
    validateStartAndOfficeEnd,
    officeEndTime,
    validateOfficeEndAndEnd,
    endTime,
    validateDaysApplied,
    daysApplied,
  ])

  // Kiểm tra xem có lỗi nào không
  const hasErrors = useMemo(() => {
    return Object.values(formErrors).some((error) => error !== null)
  }, [formErrors])

  // Cập nhật errors khi formErrors thay đổi, nhưng bỏ qua lần đầu tiên load
  useEffect(() => {
    if (!initialLoad) {
      setErrors(formErrors)
    }
  }, [formErrors, initialLoad])

  // Tối ưu hóa các hàm xử lý sự kiện bằng useCallback
  const handleNameChange = useCallback((value) => {
    setName(value)
  }, [])

  const handleDepartureTimeChange = useCallback((value) => {
    setDepartureTime(value)
  }, [])

  const handleStartTimeChange = useCallback((value) => {
    setStartTime(value)
  }, [])

  const handleOfficeEndTimeChange = useCallback((value) => {
    setOfficeEndTime(value)
  }, [])

  const handleEndTimeChange = useCallback((value) => {
    setEndTime(value)
  }, [])

  const handleBreakMinutesChange = useCallback((text) => {
    const value = Number.parseInt(text) || 0
    setBreakMinutes(value)
  }, [])

  const handleRemindBeforeStartChange = useCallback((text) => {
    const value = Number.parseInt(text) || 0
    setRemindBeforeStart(value)
  }, [])

  const handleRemindAfterEndChange = useCallback((text) => {
    const value = Number.parseInt(text) || 0
    setRemindAfterEnd(value)
  }, [])

  const handlePenaltyRoundingMinutesChange = useCallback((text) => {
    const value = Number.parseInt(text) || 0
    setPenaltyRoundingMinutes(value)
  }, [])

  const handleShowPunchChange = useCallback((value) => {
    setShowPunch(value)
  }, [])

  const toggleDay = useCallback((day) => {
    setDaysApplied((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }, [])

  const handleSave = useCallback(() => {
    if (hasErrors) {
      // Hiển thị thông báo lỗi
      Alert.alert(t("common.error"), "Vui lòng kiểm tra lại thông tin ca làm việc.", [{ text: t("common.ok") }])
      return
    }

    setIsSubmitting(true)

    // Giả lập độ trễ nhỏ để UX tốt hơn
    setTimeout(() => {
      try {
        const shiftData = {
          name,
          startTime,
          officeEndTime,
          endTime,
          departureTime,
          daysApplied,
          remindBeforeStart,
          remindAfterEnd,
          showPunch,
          breakMinutes,
          penaltyRoundingMinutes,
        }

        if (isNew) {
          addShift(shiftData)
        } else {
          updateShift(shiftId, shiftData)
        }

        navigation.goBack()
      } catch (error) {
        console.error("Error saving shift:", error)
        Alert.alert(t("common.error"), "Có lỗi xảy ra khi lưu ca làm việc. Vui lòng thử lại.", [
          { text: t("common.ok") },
        ])
      } finally {
        setIsSubmitting(false)
      }
    }, 300)
  }, [
    hasErrors,
    t,
    name,
    startTime,
    officeEndTime,
    endTime,
    departureTime,
    daysApplied,
    remindBeforeStart,
    remindAfterEnd,
    showPunch,
    breakMinutes,
    penaltyRoundingMinutes,
    isNew,
    addShift,
    updateShift,
    shiftId,
    navigation,
  ])

  // Tối ưu hóa render danh sách ngày
  const renderDays = useMemo(() => {
    return weekDays.map(({ day, label }) => (
      <TouchableOpacity
        key={day}
        style={[
          shiftDetailScreenStyles.dayButton,
          daysApplied.includes(day) ? shiftDetailScreenStyles.dayButtonActive : {},
          {
            borderColor: colors.primary,
            backgroundColor: daysApplied.includes(day) ? colors.primary : "transparent",
          },
        ]}
        onPress={() => toggleDay(day)}
      >
        <Text
          style={[
            shiftDetailScreenStyles.dayButtonText,
            daysApplied.includes(day) ? shiftDetailScreenStyles.dayButtonTextActive : {},
            {
              color: daysApplied.includes(day) ? colors.white : colors.primary,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    ))
  }, [weekDays, daysApplied, toggleDay, colors.primary, colors.white])

  // Tối ưu hóa các styles
  const themedStyles = useMemo(
    () => ({
      container: [shiftDetailScreenStyles.container, { backgroundColor: colors.background }],
      formGroup: shiftDetailScreenStyles.formGroup,
      label: [shiftDetailScreenStyles.label, { color: colors.text }],
      input: [
        shiftDetailScreenStyles.input,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text,
        },
      ],
      inputError: [shiftDetailScreenStyles.inputError, { borderColor: colors.error }],
      errorText: [shiftDetailScreenStyles.errorText, { color: colors.error }],
      switchContainer: shiftDetailScreenStyles.switchContainer,
      switchLabel: [shiftDetailScreenStyles.switchLabel, { color: colors.text }],
      daysContainer: shiftDetailScreenStyles.daysContainer,
      saveButton: [shiftDetailScreenStyles.saveButton, { backgroundColor: colors.primary }],
      disabledButton: [shiftDetailScreenStyles.disabledButton, { backgroundColor: colors.gray }],
      saveButtonText: [shiftDetailScreenStyles.saveButtonText, { color: colors.white }],
    }),
    [colors],
  )

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={themedStyles.container}>
        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.shiftName")}</Text>
          <TextInput
            style={[themedStyles.input, errors.name ? themedStyles.inputError : null]}
            value={name}
            onChangeText={handleNameChange}
            placeholder={t("shifts.shiftName")}
            placeholderTextColor={colors.gray}
          />
          {errors.name && <Text style={themedStyles.errorText}>{errors.name}</Text>}
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.departureTime")}</Text>
          <TextInput
            style={[themedStyles.input, errors.departureTime ? themedStyles.inputError : null]}
            value={departureTime}
            onChangeText={handleDepartureTimeChange}
            placeholder="HH:MM"
            placeholderTextColor={colors.gray}
            keyboardType="numbers-and-punctuation"
          />
          {errors.departureTime && <Text style={themedStyles.errorText}>{errors.departureTime}</Text>}
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.startTime")}</Text>
          <TextInput
            style={[themedStyles.input, errors.startTime ? themedStyles.inputError : null]}
            value={startTime}
            onChangeText={handleStartTimeChange}
            placeholder="HH:MM"
            placeholderTextColor={colors.gray}
            keyboardType="numbers-and-punctuation"
          />
          {errors.startTime && <Text style={themedStyles.errorText}>{errors.startTime}</Text>}
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.officeEndTime")}</Text>
          <TextInput
            style={[themedStyles.input, errors.officeEndTime ? themedStyles.inputError : null]}
            value={officeEndTime}
            onChangeText={handleOfficeEndTimeChange}
            placeholder="HH:MM"
            placeholderTextColor={colors.gray}
            keyboardType="numbers-and-punctuation"
          />
          {errors.officeEndTime && <Text style={themedStyles.errorText}>{errors.officeEndTime}</Text>}
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.maxEndTime")}</Text>
          <TextInput
            style={[themedStyles.input, errors.endTime ? themedStyles.inputError : null]}
            value={endTime}
            onChangeText={handleEndTimeChange}
            placeholder="HH:MM"
            placeholderTextColor={colors.gray}
            keyboardType="numbers-and-punctuation"
          />
          {errors.endTime && <Text style={themedStyles.errorText}>{errors.endTime}</Text>}
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.breakMinutes")}</Text>
          <TextInput
            style={themedStyles.input}
            value={breakMinutes.toString()}
            onChangeText={handleBreakMinutesChange}
            placeholder="Nhập số phút"
            placeholderTextColor={colors.gray}
            keyboardType="number-pad"
          />
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.remindBeforeStart")}</Text>
          <TextInput
            style={themedStyles.input}
            value={remindBeforeStart.toString()}
            onChangeText={handleRemindBeforeStartChange}
            placeholder="Nhập số phút"
            placeholderTextColor={colors.gray}
            keyboardType="number-pad"
          />
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.remindAfterEnd")}</Text>
          <TextInput
            style={themedStyles.input}
            value={remindAfterEnd.toString()}
            onChangeText={handleRemindAfterEndChange}
            placeholder="Nhập số phút"
            placeholderTextColor={colors.gray}
            keyboardType="number-pad"
          />
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.penaltyRoundingMinutes")}</Text>
          <TextInput
            style={themedStyles.input}
            value={penaltyRoundingMinutes.toString()}
            onChangeText={handlePenaltyRoundingMinutesChange}
            placeholder="Nhập số phút"
            placeholderTextColor={colors.gray}
            keyboardType="number-pad"
          />
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.requirePunch")}</Text>
          <View style={themedStyles.switchContainer}>
            <Switch
              value={showPunch}
              onValueChange={handleShowPunchChange}
              trackColor={{ false: colors.lightGray, true: colors.primary + "80" }}
              thumbColor={showPunch ? colors.primary : colors.white}
              ios_backgroundColor={colors.lightGray}
            />
            <Text style={themedStyles.switchLabel}>{showPunch ? t("common.yes") : t("common.no")}</Text>
          </View>
        </View>

        <View style={themedStyles.formGroup}>
          <Text style={themedStyles.label}>{t("shifts.daysApplied")}</Text>
          <View style={themedStyles.daysContainer}>{renderDays}</View>
          {errors.daysApplied && <Text style={themedStyles.errorText}>{errors.daysApplied}</Text>}
        </View>

        <TouchableOpacity
          style={[themedStyles.saveButton, hasErrors || isSubmitting ? themedStyles.disabledButton : {}]}
          onPress={handleSave}
          disabled={hasErrors || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={themedStyles.saveButtonText}>{t("common.save")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
})

ShiftDetailScreen.displayName = "ShiftDetailScreen"

export default ShiftDetailScreen
