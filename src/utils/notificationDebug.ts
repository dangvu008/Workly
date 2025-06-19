/**
 * Debug utilities cho notification timing
 */

import { Shift } from '../types';

export class NotificationDebugger {
  
  static parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Debug thời gian notification cho ca đêm
   */
  static debugNightShiftTiming(shift: Shift, targetDate: Date = new Date()): void {
    console.log('\n🔍 === NIGHT SHIFT TIMING DEBUG ===');
    console.log(`Ca: ${shift.name}`);
    console.log(`isNightShift: ${shift.isNightShift}`);
    console.log(`Target Date: ${targetDate.toDateString()}`);
    console.log(`Current Time: ${new Date().toLocaleString()}`);
    
    // Departure Time
    const departureTime = this.parseTime(shift.departureTime);
    const departureDateTime = new Date(targetDate);
    departureDateTime.setHours(departureTime.hours, departureTime.minutes, 0, 0);
    
    console.log('\n📍 DEPARTURE REMINDER:');
    console.log(`  Original: ${shift.departureTime} → ${departureDateTime.toLocaleString()}`);
    console.log(`  Should trigger: ${departureDateTime > new Date() ? '✅ Future' : '❌ Past'}`);
    
    // Check-in Time  
    const startTime = this.parseTime(shift.startTime);
    const reminderMinutes = shift.remindBeforeStart || 15;
    const checkinReminderDateTime = new Date(targetDate);
    checkinReminderDateTime.setHours(startTime.hours, startTime.minutes - reminderMinutes, 0, 0);
    
    console.log('\n📥 CHECK-IN REMINDER:');
    console.log(`  Start Time: ${shift.startTime}`);
    console.log(`  Remind Before: ${reminderMinutes} minutes`);
    console.log(`  Calculated: ${checkinReminderDateTime.toLocaleString()}`);
    console.log(`  Should trigger: ${checkinReminderDateTime > new Date() ? '✅ Future' : '❌ Past'}`);
    
    // Check-out Time
    const endTime = this.parseTime(shift.endTime);
    const checkoutReminderMinutes = shift.remindAfterEnd || 10;
    const checkoutReminderDateTime = new Date(targetDate);
    checkoutReminderDateTime.setHours(endTime.hours, endTime.minutes + checkoutReminderMinutes, 0, 0);
    
    // Apply night shift logic for checkout
    if (shift.isNightShift) {
      checkoutReminderDateTime.setDate(checkoutReminderDateTime.getDate() + 1);
    }
    
    console.log('\n📤 CHECK-OUT REMINDER:');
    console.log(`  End Time: ${shift.endTime}`);
    console.log(`  Remind After: ${checkoutReminderMinutes} minutes`);
    console.log(`  Calculated: ${checkoutReminderDateTime.toLocaleString()}`);
    console.log(`  Night Shift Adjusted: ${shift.isNightShift ? '✅ +1 day' : '❌ No adjustment'}`);
    console.log(`  Should trigger: ${checkoutReminderDateTime > new Date() ? '✅ Future' : '❌ Past'}`);
    
    console.log('\n=== END DEBUG ===\n');
  }

  /**
   * Kiểm tra tất cả notifications đã được lập lịch
   */
  static async debugScheduledNotifications(): Promise<void> {
    try {
      const { Notifications } = await import('expo-notifications');
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      console.log('\n📋 === SCHEDULED NOTIFICATIONS ===');
      console.log(`Total: ${scheduled.length}`);
      
      const shiftNotifications = scheduled.filter((n: any) => 
        n.identifier.includes('departure_') || 
        n.identifier.includes('checkin_') || 
        n.identifier.includes('checkout_')
      );
      
      console.log(`Shift-related: ${shiftNotifications.length}`);
      
      shiftNotifications.forEach((notification: any) => {
        const trigger = notification.trigger;
        const triggerDate = trigger?.date ? new Date(trigger.date * 1000) : 'Immediate';
        
        console.log(`  ${notification.identifier}:`);
        console.log(`    Title: ${notification.content.title}`);
        console.log(`    Trigger: ${triggerDate}`);
        console.log(`    Is Future: ${triggerDate !== 'Immediate' && triggerDate > new Date() ? '✅' : '❌'}`);
      });
      
      console.log('=== END SCHEDULED NOTIFICATIONS ===\n');
    } catch (error) {
      console.error('Error debugging scheduled notifications:', error);
    }
  }

  /**
   * Test với ca đêm mẫu
   */
  static testNightShiftSample(): void {
    const nightShift: Shift = {
      id: 'test_night_shift',
      name: 'Ca 3 (Đêm)',
      startTime: '22:00',
      endTime: '06:30',
      officeEndTime: '06:00',
      departureTime: '21:15',
      remindBeforeStart: 20,
      remindAfterEnd: 15,
      isNightShift: true,
      workDays: [1, 2, 3, 4, 5, 6],
      daysApplied: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      showPunch: true,
      breakMinutes: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('🧪 Testing with sample night shift...');
    this.debugNightShiftTiming(nightShift);
  }
}

// Export cho global debugging
(global as any).NotificationDebugger = NotificationDebugger;
