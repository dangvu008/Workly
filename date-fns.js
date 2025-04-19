// Simple date-fns replacement functions

// Format a date to a string
export function format(date, formatStr) {
  if (!date) return '';
  
  const d = new Date(date);
  
  // Basic formatting options
  switch (formatStr) {
    case 'HH:mm':
      return formatTime(d, true);
    case 'HH:mm:ss':
      return formatTime(d, true, true);
    case 'h:mm a':
      return formatTime(d, false);
    case 'yyyy-MM-dd':
      return formatDate(d);
    case 'dd/MM/yyyy':
      return `${padZero(d.getDate())}/${padZero(d.getMonth() + 1)}/${d.getFullYear()}`;
    case 'MMMM d, yyyy':
      return `${getMonthName(d.getMonth())} ${d.getDate()}, ${d.getFullYear()}`;
    case 'EEEE':
      return getDayName(d.getDay());
    default:
      return d.toLocaleString();
  }
}

// Parse ISO string to Date object
export function parseISO(dateString) {
  return new Date(dateString);
}

// Format time as HH:mm or h:mm AM/PM
function formatTime(date, use24Hour = false, includeSeconds = false) {
  let hours = date.getHours();
  const minutes = padZero(date.getMinutes());
  const seconds = includeSeconds ? `:${padZero(date.getSeconds())}` : '';
  
  if (!use24Hour) {
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hours}:${minutes}${seconds} ${period}`;
  }
  
  return `${padZero(hours)}:${minutes}${seconds}`;
}

// Format date as yyyy-MM-dd
function formatDate(date) {
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  
  return `${year}-${month}-${day}`;
}

// Add leading zero to numbers less than 10
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}

// Get month name
function getMonthName(monthIndex) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months[monthIndex];
}

// Get day name
function getDayName(dayIndex) {
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ];
  
  return days[dayIndex];
}

// Locale support (simplified)
export const vi = {
  code: 'vi',
  formatLong: {
    date: 'dd/MM/yyyy',
    time: 'HH:mm',
    dateTime: 'dd/MM/yyyy HH:mm'
  },
  localize: {
    month: (n) => {
      const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];
      return months[n];
    },
    day: (n) => {
      const days = [
        'Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 
        'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'
      ];
      return days[n];
    }
  }
};
