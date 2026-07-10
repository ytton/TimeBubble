import dayjs from "dayjs";

export function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function getDayId(time = Date.now()) {
  return dayjs(time).format("YYYY-MM-DD");
}

export function getReadableDate(dayId: string) {
  return dayjs(dayId).format("YYYY年M月D日");
}

export function getWeekday(dayId: string) {
  return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][
    dayjs(dayId).day()
  ];
}

export function getEndTimeForDay(dayId: string, endTime: string) {
  const [hour, minute] = endTime.split(":").map(Number);
  return dayjs(dayId).hour(hour).minute(minute).second(0).millisecond(0).valueOf();
}

export function formatDuration(ms: number, compact = false) {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (compact) {
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, "0")).join(":");
}

export function formatClock(time: number) {
  return dayjs(time).format("HH:mm");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getMonthMatrix(anchor: Date) {
  const monthStart = dayjs(anchor).startOf("month");
  const monthEnd = dayjs(anchor).endOf("month");
  const gridStart = monthStart.startOf("week");
  const gridEnd = monthEnd.endOf("week");
  const days: Date[] = [];

  let cursor = gridStart;
  while (cursor.isBefore(gridEnd) || cursor.isSame(gridEnd, "day")) {
    days.push(cursor.toDate());
    cursor = cursor.add(1, "day");
  }

  return days;
}
