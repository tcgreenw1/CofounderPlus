/**
 * Calendar Utility Functions
 */

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  return { daysInMonth, startingDayOfWeek, year, month };
}

export function isToday(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

export function getWeekDays(currentDate: Date): Date[] {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

export function getEventsForDate(events: any[], date: Date | null) {
  if (!date) return [];
  return events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.getDate() === date.getDate() &&
           eventDate.getMonth() === date.getMonth() &&
           eventDate.getFullYear() === date.getFullYear();
  });
}

export function getEventsForHour(events: any[], date: Date, hour: number) {
  return events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventHour = eventDate.getHours();
    
    return eventDate.getDate() === date.getDate() &&
           eventDate.getMonth() === date.getMonth() &&
           eventDate.getFullYear() === date.getFullYear() &&
           eventHour === hour;
  });
}

export function getEventsForTimeSlot(events: any[], date: Date, hour: number, minute: number) {
  return events.filter(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    const slotTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
    const slotEndTime = new Date(slotTime.getTime() + 15 * 60 * 1000); // 15 minutes later
    
    // Event overlaps with this 15-minute slot
    return eventStart < slotEndTime && eventEnd > slotTime &&
           eventStart.getDate() === date.getDate() &&
           eventStart.getMonth() === date.getMonth() &&
           eventStart.getFullYear() === date.getFullYear();
  });
}

export function formatTime(hour: number, minute: number = 0): string {
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour < 12 ? 'AM' : 'PM';
  const minuteStr = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : '';
  return `${displayHour}${minuteStr} ${period}`;
}
