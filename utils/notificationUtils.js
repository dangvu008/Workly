import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { timeToMinutes } from './dateUtils';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 * @returns {Promise<boolean>} - Whether permissions were granted
 */
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === 'granted') {
    return true;
  }
  
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/**
 * Schedule a notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Date} triggerDate - When to trigger the notification
 * @param {Object} data - Additional data to include with the notification
 * @returns {Promise<string>} - Notification identifier
 */
export const scheduleNotification = async (title, body, triggerDate, data = {}) => {
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return null;
  }
  
  const trigger = triggerDate ? { date: triggerDate } : null;
  
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: 'high',
      },
      trigger,
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel a specific notification
 * @param {string} notificationId - Notification identifier
 */
export const cancelNotification = async (notificationId) => {
  if (!notificationId) return;
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

/**
 * Schedule shift reminder notifications
 * @param {Object} shift - Shift data
 * @param {Date} date - Date for the shift
 * @param {Object} userSettings - User settings
 * @returns {Promise<Array<string>>} - Array of notification identifiers
 */
export const scheduleShiftReminders = async (shift, date, userSettings) => {
  if (!shift || !date || !userSettings.alarmSoundEnabled) {
    return [];
  }
  
  const notificationIds = [];
  const today = new Date();
  const shiftDate = new Date(date);
  
  // Only schedule for today or future dates
  if (shiftDate < today && shiftDate.getDate() !== today.getDate()) {
    return [];
  }
  
  // Set hours and minutes for the reminders
  const startTimeMinutes = timeToMinutes(shift.startTime);
  const endTimeMinutes = timeToMinutes(shift.endTime);
  
  // Start time reminder
  if (shift.remindBeforeStart > 0) {
    const startHours = Math.floor(startTimeMinutes / 60);
    const startMinutes = startTimeMinutes % 60;
    
    const startReminderDate = new Date(shiftDate);
    startReminderDate.setHours(startHours, startMinutes - shift.remindBeforeStart, 0);
    
    // Only schedule if it's in the future
    if (startReminderDate > today) {
      const startId = await scheduleNotification(
        'Shift Reminder',
        `Your shift "${shift.name}" starts in ${shift.remindBeforeStart} minutes.`,
        startReminderDate,
        { type: 'shift_start', shiftId: shift.id }
      );
      
      if (startId) {
        notificationIds.push(startId);
      }
    }
  }
  
  // End time reminder
  if (shift.remindAfterEnd > 0) {
    const endHours = Math.floor(endTimeMinutes / 60);
    const endMinutes = endTimeMinutes % 60;
    
    const endReminderDate = new Date(shiftDate);
    endReminderDate.setHours(endHours, endMinutes - shift.remindAfterEnd, 0);
    
    // Handle overnight shifts
    if (endTimeMinutes < startTimeMinutes) {
      endReminderDate.setDate(endReminderDate.getDate() + 1);
    }
    
    // Only schedule if it's in the future
    if (endReminderDate > today) {
      const endId = await scheduleNotification(
        'Shift Reminder',
        `Your shift "${shift.name}" ends in ${shift.remindAfterEnd} minutes.`,
        endReminderDate,
        { type: 'shift_end', shiftId: shift.id }
      );
      
      if (endId) {
        notificationIds.push(endId);
      }
    }
  }
  
  return notificationIds;
};

/**
 * Schedule note reminder notifications
 * @param {Object} note - Note data
 * @param {Array} shifts - All shifts
 * @param {Object} userSettings - User settings
 * @returns {Promise<Array<string>>} - Array of notification identifiers
 */
export const scheduleNoteReminders = async (note, shifts, userSettings) => {
  if (!note || !userSettings.alarmSoundEnabled) {
    return [];
  }
  
  const notificationIds = [];
  const today = new Date();
  const reminderTimeMinutes = timeToMinutes(note.reminderTime);
  const reminderHours = Math.floor(reminderTimeMinutes / 60);
  const reminderMinutes = reminderTimeMinutes % 60;
  
  // If note is associated with shifts
  if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
    for (const shiftId of note.associatedShiftIds) {
      const shift = shifts.find(s => s.id === shiftId);
      
      if (shift) {
        // Get days when this shift occurs
        const shiftDays = shift.daysApplied || [];
        
        // Schedule for the next 7 days
        for (let i = 0; i < 7; i++) {
          const reminderDate = new Date(today);
          reminderDate.setDate(today.getDate() + i);
          
          // Get day of week (0-6, where 0 is Sunday)
          const dayOfWeek = reminderDate.getDay();
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          // Check if this shift occurs on this day
          if (shiftDays.includes(dayNames[dayOfWeek])) {
            reminderDate.setHours(reminderHours, reminderMinutes, 0);
            
            // Only schedule if it's in the future
            if (reminderDate > today) {
              const id = await scheduleNotification(
                note.title,
                note.content,
                reminderDate,
                { type: 'note_reminder', noteId: note.id, shiftId }
              );
              
              if (id) {
                notificationIds.push(id);
              }
            }
          }
        }
      }
    }
  } 
  // If note has explicit reminder days
  else if (note.explicitReminderDays && note.explicitReminderDays.length > 0) {
    // Schedule for the next 7 days
    for (let i = 0; i < 7; i++) {
      const reminderDate = new Date(today);
      reminderDate.setDate(today.getDate() + i);
      
      // Get day of week (0-6, where 0 is Sunday)
      const dayOfWeek = reminderDate.getDay();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Check if this note should be reminded on this day
      if (note.explicitReminderDays.includes(dayNames[dayOfWeek])) {
        reminderDate.setHours(reminderHours, reminderMinutes, 0);
        
        // Only schedule if it's in the future
        if (reminderDate > today) {
          const id = await scheduleNotification(
            note.title,
            note.content,
            reminderDate,
            { type: 'note_reminder', noteId: note.id }
          );
          
          if (id) {
            notificationIds.push(id);
          }
        }
      }
    }
  }
  
  return notificationIds;
};

/**
 * Schedule weather alert notification
 * @param {string} message - Alert message
 * @param {Date} triggerDate - When to trigger the notification (optional, defaults to now)
 * @returns {Promise<string>} - Notification identifier
 */
export const scheduleWeatherAlert = async (message, triggerDate = null) => {
  return await scheduleNotification(
    'Weather Alert',
    message,
    triggerDate,
    { type: 'weather_alert' }
  );
};

/**
 * Set up notification listeners
 * @param {Function} onNotificationReceived - Callback for when notification is received
 * @param {Function} onNotificationResponse - Callback for when user responds to notification
 * @returns {Function} - Cleanup function to remove listeners
 */
export const setupNotificationListeners = (onNotificationReceived, onNotificationResponse) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );
  
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    onNotificationResponse
  );
  
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};
