"use client"

import { View, Text, TouchableOpacity, useMemo, useCallback, memo } from "react-native"
import { useAppContext } from "../context/AppContext"
import { getDayOfWeek, isToday, getWeekDates } from "../utils/dateUtils"
import { weeklyStatusGridStyles } from "../styles/components/weeklyStatusGrid"
import { useTheme } from "../context/ThemeContext"

const WeeklyStatusGrid = memo(({ onDayPress }) => {
  const { userSettings, shifts, attendanceRecords } = useAppContext()
  const { colors } = useTheme()

  // Tối ưu hóa tính toán ngày trong tuần
  const { weekDays, dayNames } = useMemo(() => {
    const today = new Date()
    const { startOfWeek } = getWeekDates(today, userSettings.firstDayOfWeek)

    // Generate array of dates for the current week
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return date
    })

    // Get short day names based on first day of week
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    const dayNames = userSettings.firstDayOfWeek === "Mon" ? [...days.slice(1), days[0]] : days

    return { weekDays, dayNames }
  }, [userSettings.firstDayOfWeek])

  // Tạo cache cho các ngày có ca làm việc
  const scheduledDays = useMemo(() => {
    const daysMap = {}
    shifts.forEach((shift) => {
      if (shift.daysApplied && Array.isArray(shift.daysApplied)) {
        shift.daysApplied.forEach((day) => {
          daysMap[day] = true
        })
      }
    })
    return daysMap
  }, [shifts])

  // Tạo cache cho trạng thái chấm công
  const attendanceStatusMap = useMemo(() => {
    const statusMap = {}

    // Nhóm các bản ghi theo ngày
    attendanceRecords.forEach((record) => {
      if (!record.date) return

      const dateStr = record.date.split("T")[0]
      if (!statusMap[dateStr]) {
        statusMap[dateStr] = { checkIn: false, checkOut: false }
      }

      if (record.type === "check-in") {
        statusMap[dateStr].checkIn = true
      } else if (record.type === "check-out") {
        statusMap[dateStr].checkOut = true
      }
    })

    return statusMap
  }, [attendanceRecords])

  // Tối ưu hóa kiểm tra ca làm việc
  const isShiftScheduled = useCallback(
    (date) => {
      const dayOfWeek = getDayOfWeek(date)
      return !!scheduledDays[dayOfWeek]
    },
    [scheduledDays],
  )

  // Tối ưu hóa kiểm tra trạng thái chấm công
  const getAttendanceStatus = useCallback(
    (date) => {
      const dateStr = date.toISOString().split("T")[0]
      const status = attendanceStatusMap[dateStr]

      if (!status) return null

      if (status.checkIn && status.checkOut) {
        return "complete"
      } else if (status.checkIn) {
        return "partial"
      }

      return null
    },
    [attendanceStatusMap],
  )

  // Tối ưu hóa render header
  const renderHeaderCells = useMemo(() => {
    return dayNames.map((day, index) => (
      <View key={`header-${index}`} style={weeklyStatusGridStyles.headerCell}>
        <Text style={[weeklyStatusGridStyles.headerText, { color: colors.darkGray }]}>{day}</Text>
      </View>
    ))
  }, [dayNames, colors.darkGray])

  // Tối ưu hóa xử lý khi nhấn vào ngày
  const handleDayPress = useCallback(
    (date) => {
      onDayPress(date)
    },
    [onDayPress],
  )

  // Tối ưu hóa render các ô ngày
  const renderDayCells = useMemo(() => {
    return weekDays.map((date, index) => {
      const scheduled = isShiftScheduled(date)
      const attendanceStatus = getAttendanceStatus(date)
      const isCurrentDay = isToday(date)

      return (
        <TouchableOpacity
          key={`day-${index}`}
          style={[
            weeklyStatusGridStyles.dayCell,
            isCurrentDay && weeklyStatusGridStyles.currentDay,
            scheduled && weeklyStatusGridStyles.scheduledDay,
            attendanceStatus === "complete" && weeklyStatusGridStyles.completeDay,
            attendanceStatus === "partial" && weeklyStatusGridStyles.partialDay,
          ]}
          onPress={() => handleDayPress(date)}
        >
          <Text
            style={[
              weeklyStatusGridStyles.dayText,
              isCurrentDay && weeklyStatusGridStyles.currentDayText,
              (scheduled || attendanceStatus) && weeklyStatusGridStyles.activeDayText,
            ]}
          >
            {date.getDate()}
          </Text>
        </TouchableOpacity>
      )
    })
  }, [weekDays, isShiftScheduled, getAttendanceStatus, handleDayPress])

  return (
    <View style={[weeklyStatusGridStyles.container, { backgroundColor: colors.card }]}>
      <View style={[weeklyStatusGridStyles.headerRow, { backgroundColor: colors.lightGray }]}>{renderHeaderCells}</View>

      <View style={weeklyStatusGridStyles.daysRow}>{renderDayCells}</View>
    </View>
  )
})

WeeklyStatusGrid.displayName = "WeeklyStatusGrid"

export default WeeklyStatusGrid
