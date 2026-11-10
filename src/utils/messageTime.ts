import {
  differenceInCalendarDays,
  format,
  isSameDay,
  isSameYear,
  parseISO,
} from 'date-fns';

/** Within this many days, a day is named by its weekday. */
const WEEKDAY_WITHIN_DAYS = 6;

/** The day a message was sent on, as a conversation separates them:
 * "Today", "Yesterday", the weekday within the week, then the date - with
 * its year only when it isn't this one. */
export function messageDayLabel(sentAt: string, now: Date): string {
  const day = parseISO(sentAt);
  const daysAgo = differenceInCalendarDays(now, day);
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo <= WEEKDAY_WITHIN_DAYS) return format(day, 'EEEE');
  return format(day, isSameYear(day, now) ? 'MMM d' : 'MMM d, yyyy');
}

/** When a message was sent, under it. */
export function messageClockTime(sentAt: string): string {
  return format(parseISO(sentAt), 'HH:mm');
}

/** When a conversation's last message was sent, as an inbox shows it: the
 * time today, then as messageDayLabel names the day - "Yesterday", the
 * weekday, the date. */
export function conversationTime(sentAt: string, now: Date): string {
  const day = parseISO(sentAt);
  return isSameDay(day, now)
    ? messageClockTime(sentAt)
    : messageDayLabel(sentAt, now);
}
