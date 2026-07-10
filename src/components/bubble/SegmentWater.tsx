import type { BubbleType, DailyBubble, TimeSegment } from "../../types/domain";
import { getSegmentDuration } from "../../utils/stats";

interface SegmentWaterProps {
  bubbleTypes: BubbleType[];
  segments: TimeSegment[];
  dailyBubble?: DailyBubble;
  now: number;
  className?: string;
}

export function SegmentWater({ bubbleTypes, segments, dailyBubble, now, className }: SegmentWaterProps) {
  const typeMap = new Map(bubbleTypes.map((type) => [type.id, type]));
  const visibleSegments = segments
    .filter((segment) => getSegmentDuration(segment, now) > 0)
    .sort((a, b) => a.startTime - b.startTime);
  const totalDuration = dailyBubble
    ? Math.max(1, dailyBubble.endTime - dailyBubble.startTime)
    : Math.max(1, visibleSegments.reduce((sum, segment) => sum + getSegmentDuration(segment, now), 0));
  let runningPercent = 0;
  const layers = visibleSegments.map((segment, index) => {
    const duration = getSegmentDuration(segment, now);
    const type = typeMap.get(segment.bubbleTypeId);
    const segmentPercent = Math.max(0, Math.min(1, duration / totalDuration));
    runningPercent = Math.min(1, runningPercent + segmentPercent);

    return {
      id: segment.id,
      color: type?.color ?? "#94A3B8",
      top: Math.max(0, Math.min(100, 100 - runningPercent * 100)),
      zIndex: visibleSegments.length - index
    };
  });

  return (
    <div className={`segment-water-stack ${className ?? ""}`}>
      {layers.map((layer) => (
        <div
          key={layer.id}
          className="time-wave-group"
          style={
            {
              "--layer-color": layer.color,
              "--wave-top": `${layer.top}%`,
              "--wave-z": layer.zIndex
            } as React.CSSProperties
          }
        >
          <span className="time-wave" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
