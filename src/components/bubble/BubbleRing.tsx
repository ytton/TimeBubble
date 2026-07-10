import { motion } from "framer-motion";
import type { BubbleType, DailyBubble, TimeSegment } from "../../types/domain";
import { clamp } from "../../utils/time";

interface BubbleRingProps {
  dailyBubble?: DailyBubble;
  segments: TimeSegment[];
  bubbleTypes: BubbleType[];
  now: number;
}

interface RingPart {
  id: string;
  color: string;
  startRatio: number;
  ratio: number;
}

export function BubbleRing({ dailyBubble, segments, bubbleTypes, now }: BubbleRingProps) {
  const radius = 132;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const typeMap = new Map(bubbleTypes.map((type) => [type.id, type]));

  const visibleSegments = dailyBubble
    ? segments
        .filter((segment) => segment.dayId === dailyBubble.dayId)
        .sort((a, b) => a.startTime - b.startTime)
    : [];

  const lifecycle = dailyBubble ? Math.max(1, dailyBubble.endTime - dailyBubble.startTime) : 1;
  const parts: RingPart[] = [];

  for (const segment of visibleSegments) {
    if (!dailyBubble) continue;
    const startRatio = clamp((segment.startTime - dailyBubble.startTime) / lifecycle, 0, 1);
    const end = segment.endTime ?? now;
    const endRatio = clamp((end - dailyBubble.startTime) / lifecycle, 0, 1);
    const ratio = Math.max(0.002, endRatio - startRatio);

    if (endRatio > 0 && ratio > 0) {
      parts.push({
        id: segment.id,
        color: typeMap.get(segment.bubbleTypeId)?.color ?? "#94A3B8",
        startRatio,
        ratio
      });
    }
  }

  return (
    <svg className="bubble-ring" viewBox="0 0 320 320" aria-hidden="true">
      <defs>
        <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        className="bubble-ring-track"
        cx="160"
        cy="160"
        r={radius}
        strokeWidth={stroke}
        fill="none"
      />
      {parts.map((part) => (
        <motion.circle
          key={part.id}
          cx="160"
          cy="160"
          r={radius}
          stroke={part.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          filter="url(#ringGlow)"
          initial={{ opacity: 0, strokeDashoffset: circumference * (1 - part.startRatio) }}
          animate={{
            opacity: 0.92,
            strokeDasharray: `${part.ratio * circumference} ${circumference}`,
            strokeDashoffset: circumference * (1 - part.startRatio)
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}
