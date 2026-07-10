import type {
  BubbleType,
  CalendarDaySummary,
  DailyBubble,
  DailyStats,
  TimeSegment,
  TypeTotal
} from "../types/domain";
import { DEFAULT_BUBBLE_COLORS } from "./constants";
import { getDayId } from "./time";

export function getSegmentDuration(segment: TimeSegment, now = Date.now()) {
  return Math.max(0, (segment.endTime ?? now) - segment.startTime);
}

export function buildDailyStats(
  dayId: string,
  segments: TimeSegment[],
  bubbleTypes: BubbleType[],
  now = Date.now()
): DailyStats {
  const typeMap = new Map(bubbleTypes.map((type) => [type.id, type]));
  const daySegments = segments
    .filter((segment) => segment.dayId === dayId)
    .sort((a, b) => a.startTime - b.startTime);

  const totalsMap = new Map<string, number>();
  for (const segment of daySegments) {
    totalsMap.set(
      segment.bubbleTypeId,
      (totalsMap.get(segment.bubbleTypeId) ?? 0) + getSegmentDuration(segment, now)
    );
  }

  const totalDuration = Array.from(totalsMap.values()).reduce((sum, duration) => sum + duration, 0);
  const totals: TypeTotal[] = Array.from(totalsMap.entries())
    .map(([bubbleTypeId, duration]) => {
      const bubbleType =
        typeMap.get(bubbleTypeId) ??
        ({
          id: bubbleTypeId,
          name: "其他",
          color: DEFAULT_BUBBLE_COLORS.idle,
          icon: "·",
          hidden: false,
          createdAt: 0,
          updatedAt: 0
        } satisfies BubbleType);

      return {
        bubbleType,
        duration,
        percent: totalDuration > 0 ? (duration / totalDuration) * 100 : 0
      };
    })
    .sort((a, b) => b.duration - a.duration);

  return {
    dayId,
    totalDuration,
    totals,
    dominant: totals[0],
    segments: daySegments
  };
}

export function buildCalendarSummary(
  date: Date,
  dailyBubbles: DailyBubble[],
  segments: TimeSegment[],
  bubbleTypes: BubbleType[],
  now = Date.now()
): CalendarDaySummary {
  const dayId = getDayId(date.getTime());
  const stats = buildDailyStats(dayId, segments, bubbleTypes, now);
  const isFuture = date.getTime() > new Date().setHours(23, 59, 59, 999);
  const hasDailyBubble = dailyBubbles.some((bubble) => bubble.dayId === dayId);
  const hasData = stats.segments.length > 0 || hasDailyBubble;

  return {
    dayId,
    date,
    isToday: dayId === getDayId(now),
    isFuture,
    hasData,
    dominantColor: stats.dominant?.bubbleType.color ?? DEFAULT_BUBBLE_COLORS.idle,
    dominantName: stats.dominant?.bubbleType.name,
    totalDuration: stats.totalDuration
  };
}

export function getTimelineSegments(segments: TimeSegment[], dayId: string) {
  return segments.filter((segment) => segment.dayId === dayId).sort((a, b) => a.startTime - b.startTime);
}
