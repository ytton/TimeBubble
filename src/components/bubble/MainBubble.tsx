import { motion } from "framer-motion";
import type { BubbleType, DailyBubble, TimeSegment } from "../../types/domain";
import { formatBubbleDuration } from "../../utils/time";
import { SegmentWater } from "./SegmentWater";

interface MainBubbleProps {
  currentType?: BubbleType;
  dailyBubble?: DailyBubble;
  bubbleTypes: BubbleType[];
  segments: TimeSegment[];
  now: number;
  elapsed: number;
  disabled?: boolean;
  position?: { x: number; y: number; angle: number };
  onPointerDown?: (event: React.PointerEvent) => void;
}

export function MainBubble({
  currentType,
  dailyBubble,
  bubbleTypes,
  segments,
  now,
  elapsed,
  disabled,
  position,
  onPointerDown
}: MainBubbleProps) {
  const color = currentType?.color ?? "#94A3B8";

  return (
    <motion.div
      className={`main-bubble physics-main-bubble ${disabled ? "main-bubble-ended" : ""}`}
      style={
        {
          "--bubble-color": color
          ,
          left: position ? `${position.x}px` : undefined,
          top: position ? `${position.y}px` : undefined,
          transform: position ? "translate(-50%, -50%)" : undefined
        } as React.CSSProperties
      }
      onPointerDown={onPointerDown}
    >
      <div className="main-bubble-glass" />
      <SegmentWater bubbleTypes={bubbleTypes} segments={segments} dailyBubble={dailyBubble} now={now} />
      <div className="main-bubble-content">
        <div className="main-bubble-name">{currentType?.name ?? "无所事事"}</div>
        <div className="main-bubble-time">{formatBubbleDuration(elapsed)}</div>
      </div>
    </motion.div>
  );
}
