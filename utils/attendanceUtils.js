import { timeToMinutes, formatDuration } from './dateUtils';

/**
 * Calculate the time difference in minutes between two timestamps
 * @param {string} startTime - Start time in ISO format
 * @param {string} endTime - End time in ISO format
 * @returns {number} - Time difference in minutes
 */
export const calculateTimeDifference = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return Math.floor((end - start) / (1000 * 60));
};

/**
 * Check if a log is valid for a shift
 * @param {Object} log - Attendance log
 * @param {Object} shift - Shift data
 * @returns {boolean} - Whether the log is valid
 */
export const isLogValidForShift = (log, shift) => {
  if (!log || !shift) return false;
  
  const logTime = new Date(log.timestamp);
  const logHour = logTime.getHours();
  const logMinute = logTime.getMinutes();
  const logTimeMinutes = logHour * 60 + logMinute;
  
  const shiftStartMinutes = timeToMinutes(shift.startTime);
  const shiftEndMinutes = timeToMinutes(shift.endTime);
  
  // Handle overnight shifts
  if (shiftEndMinutes < shiftStartMinutes) {
    // For overnight shifts, the valid time range is from shift start to midnight
    // and from midnight to shift end
    return (
      (logTimeMinutes >= shiftStartMinutes && logTimeMinutes <= 24 * 60) ||
      (logTimeMinutes >= 0 && logTimeMinutes <= shiftEndMinutes)
    );
  }
  
  // For regular shifts, the valid time range is from shift start to shift end
  const buffer = 120; // 2 hours buffer before and after shift
  return (
    logTimeMinutes >= shiftStartMinutes - buffer &&
    logTimeMinutes <= shiftEndMinutes + buffer
  );
};

/**
 * Calculate attendance status based on logs
 * @param {Array} logs - Array of attendance logs
 * @param {Object} shift - Shift data
 * @returns {Object} - Attendance status
 */
export const calculateAttendanceStatus = (logs, shift) => {
  if (!logs || !shift) {
    return {
      type: 'unknown',
      icon: 'help',
      color: '#888',
      details: {},
    };
  }
  
  // Filter logs by type
  const goWorkLog = logs.find(log => log.type === 'go_work');
  const checkInLog = logs.find(log => log.type === 'check_in');
  const checkOutLog = logs.find(log => log.type === 'check_out');
  const completeLog = logs.find(log => log.type === 'complete');
  
  // If no logs, return unknown
  if (!goWorkLog) {
    return {
      type: 'unknown',
      icon: 'help',
      color: '#888',
      details: {},
    };
  }
  
  // Calculate shift times in minutes
  const shiftStartMinutes = timeToMinutes(shift.startTime);
  const shiftEndMinutes = timeToMinutes(shift.endTime);
  
  // If we have all logs, check if attendance is complete
  if (goWorkLog && checkInLog && checkOutLog && completeLog) {
    // Calculate check-in and check-out times
    const checkInTime = new Date(checkInLog.timestamp);
    const checkOutTime = new Date(checkOutLog.timestamp);
    
    const checkInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();
    const checkOutMinutes = checkOutTime.getHours() * 60 + checkOutTime.getMinutes();
    
    // Check if check-in is late
    const isLate = checkInMinutes > shiftStartMinutes + 15; // 15 minutes grace period
    
    // Check if check-out is early
    let isEarly = false;
    
    // Handle overnight shifts
    if (shiftEndMinutes < shiftStartMinutes) {
      // For overnight shifts, check-out time could be the next day
      if (checkOutTime.getDate() === checkInTime.getDate()) {
        // Same day, check-out should be after midnight
        isEarly = checkOutMinutes < shiftEndMinutes;
      } else {
        // Next day, check if it's before the end time
        isEarly = checkOutMinutes < shiftEndMinutes;
      }
    } else {
      // Regular shift
      isEarly = checkOutMinutes < shiftEndMinutes - 15; // 15 minutes grace period
    }
    
    // Calculate work duration
    const workDuration = calculateTimeDifference(
      checkInLog.timestamp,
      checkOutLog.timestamp
    );
    
    // If late or early, mark as RV (late/early)
    if (isLate || isEarly) {
      return {
        type: 'rv',
        icon: 'schedule',
        color: '#FFA500',
        details: {
          goWorkTime: goWorkLog.timestamp,
          checkInTime: checkInLog.timestamp,
          checkOutTime: checkOutLog.timestamp,
          completeTime: completeLog.timestamp,
          workDuration,
          isLate,
          isEarly,
        },
      };
    }
    
    // Otherwise, mark as complete
    return {
      type: 'complete',
      icon: 'check-circle',
      color: '#4CAF50',
      details: {
        goWorkTime: goWorkLog.timestamp,
        checkInTime: checkInLog.timestamp,
        checkOutTime: checkOutLog.timestamp,
        completeTime: completeLog.timestamp,
        workDuration,
      },
    };
  }
  
  // If we have some logs but not all, mark as incomplete
  if (goWorkLog) {
    return {
      type: 'incomplete',
      icon: 'error',
      color: '#FFC107',
      details: {
        goWorkTime: goWorkLog.timestamp,
        checkInTime: checkInLog?.timestamp,
        checkOutTime: checkOutLog?.timestamp,
        completeTime: completeLog?.timestamp,
      },
    };
  }
  
  // Default case
  return {
    type: 'unknown',
    icon: 'help',
    color: '#888',
    details: {},
  };
};

/**
 * Format attendance status for display
 * @param {Object} status - Attendance status
 * @param {Function} t - Translation function
 * @returns {string} - Formatted status text
 */
export const formatAttendanceStatus = (status, t) => {
  if (!status) return '';
  
  switch (status.type) {
    case 'complete':
      return t('attendance.statusComplete');
    case 'incomplete':
      return t('attendance.statusIncomplete');
    case 'absent':
      return t('attendance.statusAbsent');
    case 'leave':
      return t('attendance.statusLeave');
    case 'sick':
      return t('attendance.statusSick');
    case 'holiday':
      return t('attendance.statusHoliday');
    case 'rv':
      return t('attendance.statusRV');
    default:
      return t('attendance.statusUnknown');
  }
};

/**
 * Format attendance details for display
 * @param {Object} status - Attendance status
 * @param {Function} formatDate - Date formatting function
 * @param {Function} t - Translation function
 * @returns {string} - Formatted details text
 */
export const formatAttendanceDetails = (status, formatDate, t) => {
  if (!status || !status.details) return '';
  
  const details = [];
  
  if (status.details.goWorkTime) {
    details.push(`${t('home.logGoWork')}: ${formatDate(new Date(status.details.goWorkTime), 'time')}`);
  }
  
  if (status.details.checkInTime) {
    details.push(`${t('home.logCheckIn')}: ${formatDate(new Date(status.details.checkInTime), 'time')}`);
  }
  
  if (status.details.checkOutTime) {
    details.push(`${t('home.logCheckOut')}: ${formatDate(new Date(status.details.checkOutTime), 'time')}`);
  }
  
  if (status.details.completeTime) {
    details.push(`${t('home.logComplete')}: ${formatDate(new Date(status.details.completeTime), 'time')}`);
  }
  
  if (status.details.workDuration) {
    details.push(`${t('attendance.workDuration')}: ${formatDuration(status.details.workDuration, t)}`);
  }
  
  if (status.details.isLate) {
    details.push(`${t('attendance.late')}`);
  }
  
  if (status.details.isEarly) {
    details.push(`${t('attendance.early')}`);
  }
  
  return details.join('\n');
};
