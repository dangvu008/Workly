"use client"

import { View, Text, TouchableOpacity, useMemo, useCallback, memo } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useAppContext } from "../context/AppContext"
import { formatDate } from "../utils/dateUtils"
import { useTranslation } from "../i18n/useTranslation"
import { noteItemStyles } from "../styles/components/noteItem"
import { useTheme } from "../context/ThemeContext"

const NoteItem = memo(({ note, onEdit, onDelete }) => {
  const { getNextReminderDate, shifts } = useAppContext()
  const { t } = useTranslation()
  const { colors } = useTheme()

  // Lấy thời gian nhắc nhở tiếp theo - tối ưu hóa bằng useMemo
  const nextReminderDate = useMemo(() => getNextReminderDate(note), [getNextReminderDate, note])

  // Tối ưu hóa formatReminderTime bằng useMemo thay vì useCallback
  const formattedReminderTime = useMemo(() => {
    if (!nextReminderDate) return note.reminderTime

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // Kiểm tra xem có phải hôm nay không
    if (
      nextReminderDate.getDate() === today.getDate() &&
      nextReminderDate.getMonth() === today.getMonth() &&
      nextReminderDate.getFullYear() === today.getFullYear()
    ) {
      return `${t("notes.today")} ${note.reminderTime}`
    }

    // Kiểm tra xem có phải ngày mai không
    if (
      nextReminderDate.getDate() === tomorrow.getDate() &&
      nextReminderDate.getMonth() === tomorrow.getMonth() &&
      nextReminderDate.getFullYear() === tomorrow.getFullYear()
    ) {
      return `${t("notes.tomorrow")} ${note.reminderTime}`
    }

    // Nếu không phải hôm nay hoặc ngày mai, hiển thị ngày đầy đủ
    return formatDate(nextReminderDate, "date") + " " + note.reminderTime
  }, [nextReminderDate, note.reminderTime, t])

  // Tối ưu hóa getAssociatedShiftNames bằng useMemo
  const associatedShiftNames = useMemo(() => {
    if (!note.associatedShiftIds || note.associatedShiftIds.length === 0) return ""

    const shiftNames = note.associatedShiftIds
      .map((id) => {
        const shift = shifts.find((s) => s.id === id)
        return shift ? shift.name : ""
      })
      .filter((name) => name !== "")

    return shiftNames.join(", ")
  }, [note.associatedShiftIds, shifts])

  // Tối ưu hóa các hàm xử lý sự kiện bằng useCallback
  const handleEdit = useCallback(() => {
    if (onEdit) onEdit(note)
  }, [onEdit, note])

  const handleDelete = useCallback(() => {
    if (onDelete) onDelete(note)
  }, [onDelete, note])

  // Tối ưu hóa các styles dựa trên theme
  const themedStyles = useMemo(
    () => ({
      container: [
        noteItemStyles.container,
        {
          backgroundColor: colors.card,
          shadowColor: colors.black,
          borderColor: colors.border,
        },
      ],
      content: noteItemStyles.content,
      title: [noteItemStyles.title, { color: colors.text }],
      noteContent: [noteItemStyles.noteContent, { color: colors.darkGray }],
      reminderInfo: noteItemStyles.reminderInfo,
      reminderText: [noteItemStyles.reminderText, { color: colors.primary }],
      shiftInfo: noteItemStyles.shiftInfo,
      shiftText: [noteItemStyles.shiftText, { color: colors.darkGray }],
      actions: noteItemStyles.actions,
      actionButton: noteItemStyles.actionButton,
    }),
    [colors],
  )

  // Tối ưu hóa render bằng cách tách thành các phần nhỏ
  const renderTitle = useMemo(
    () => (
      <Text style={themedStyles.title} numberOfLines={2} ellipsizeMode="tail">
        {note.title}
      </Text>
    ),
    [note.title, themedStyles.title],
  )

  const renderContent = useMemo(
    () => (
      <Text style={themedStyles.noteContent} numberOfLines={3} ellipsizeMode="tail">
        {note.content}
      </Text>
    ),
    [note.content, themedStyles.noteContent],
  )

  const renderReminderInfo = useMemo(
    () => (
      <View style={themedStyles.reminderInfo}>
        <MaterialIcons name="access-time" size={14} color={colors.primary} />
        <Text style={themedStyles.reminderText}>
          {t("notes.nextReminder")}: {formattedReminderTime}
        </Text>
      </View>
    ),
    [formattedReminderTime, t, themedStyles.reminderInfo, themedStyles.reminderText, colors.primary],
  )

  const renderShiftInfo = useMemo(() => {
    if (!note.associatedShiftIds || note.associatedShiftIds.length === 0) return null

    return (
      <View style={themedStyles.shiftInfo}>
        <MaterialIcons name="work" size={14} color={colors.primary} />
        <Text style={themedStyles.shiftText} numberOfLines={1} ellipsizeMode="tail">
          {associatedShiftNames}
        </Text>
      </View>
    )
  }, [note.associatedShiftIds, associatedShiftNames, themedStyles.shiftInfo, themedStyles.shiftText, colors.primary])

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.content}>
        {renderTitle}
        {renderContent}
        {renderReminderInfo}
        {renderShiftInfo}
      </View>

      <View style={themedStyles.actions}>
        <TouchableOpacity
          style={themedStyles.actionButton}
          onPress={handleEdit}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={themedStyles.actionButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  )
})

// Thêm displayName để dễ debug
NoteItem.displayName = "NoteItem"

export default NoteItem
