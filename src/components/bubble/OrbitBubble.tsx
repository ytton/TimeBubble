import { BubbleIcon } from "../common/BubbleIcon";
import type { BubbleType } from "../../types/domain";

const STACK_POSITIONS = [
  { x: -132, y: 20, s: 1.03 },
  { x: 116, y: 28, s: 1 },
  { x: -70, y: 116, s: 0.94 },
  { x: 76, y: 124, s: 0.93 },
  { x: -158, y: 138, s: 0.8 },
  { x: 158, y: 144, s: 0.8 },
  { x: -8, y: 202, s: 0.74 },
  { x: 128, y: 210, s: 0.68 }
];

export function getOrbitDefaultPosition(index: number) {
  return STACK_POSITIONS[index % STACK_POSITIONS.length];
}

interface OrbitBubbleProps {
  bubbleType: BubbleType;
  radius: number;
  position?: { x: number; y: number; angle: number };
  active: boolean;
  onClick: () => void;
  onEdit: () => void;
  onPointerDown: (event: React.PointerEvent) => void;
  wasDragged: () => boolean;
}

export function OrbitBubble({
  bubbleType,
  radius,
  position,
  active,
  onClick,
  onEdit,
  onPointerDown,
  wasDragged
}: OrbitBubbleProps) {
  const x = position?.x ?? 0;
  const y = position?.y ?? 0;

  function handleClick() {
    if (wasDragged()) return;
    onClick();
  }

  return (
    <button
      className={`orbit-bubble stack-bubble physics-bubble ${active ? "orbit-bubble-active" : ""}`}
      style={
        {
          "--bubble-color": bubbleType.color,
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          left: `${x}px`,
          top: `${y}px`,
          transform: "translate(-50%, -50%)"
        } as React.CSSProperties
      }
      onPointerDown={onPointerDown}
      onClick={handleClick}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onEdit();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onEdit();
      }}
      aria-label={`切换到${bubbleType.name}`}
    >
      <span className="orbit-icon">
        <BubbleIcon name={bubbleType.icon} size={Math.max(20, radius * 0.58)} strokeWidth={1.9} />
      </span>
      <span className="orbit-name">{bubbleType.name}</span>
    </button>
  );
}
