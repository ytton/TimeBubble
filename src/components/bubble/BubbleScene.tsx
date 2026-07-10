import { AnimatePresence } from "framer-motion";
import { BarChart3, CalendarDays, Plus, Settings } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { BubbleType } from "../../types/domain";
import { useNow } from "../../hooks";
import { useAppStore } from "../../store/appStore";
import { AddBubbleDialog } from "./AddBubbleDialog";
import { MainBubble } from "./MainBubble";
import { OrbitBubble } from "./OrbitBubble";
import { useBubblePhysics, type PhysicsBubbleItem } from "./useBubblePhysics";

const MAIN_RADIUS = 132;
const ADD_RADIUS = 32;

export function BubbleScene() {
  const now = useNow(1000);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const {
    bubbleTypes,
    segments,
    currentSegment,
    currentDailyBubble,
    switchBubbleType,
    createBubbleType,
    updateBubbleType,
    deleteBubbleType,
    navigate,
    finishToday
  } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<BubbleType | null>(null);

  const visibleTypes = bubbleTypes.filter((type) => !type.hidden).slice(0, 9);
  const currentType = bubbleTypes.find((type) => type.id === currentSegment?.bubbleTypeId);
  const elapsed = currentSegment ? Math.max(0, now - currentSegment.startTime) : 0;
  const reachedEnd = currentDailyBubble ? now >= currentDailyBubble.endTime && !currentDailyBubble.exploded : false;
  const physicsItems = useMemo<PhysicsBubbleItem[]>(
    () => [
      { id: "main", kind: "main", radius: MAIN_RADIUS },
      ...visibleTypes.map((type, index) => ({
        id: type.id,
        kind: "orbit" as const,
        index,
        radius: getOrbitRadius(index)
      })),
      { id: "add", kind: "add", radius: ADD_RADIUS }
    ],
    [visibleTypes]
  );
  const physics = useBubblePhysics(physicsItems, sceneRef);

  return (
    <main
      className="home-page"
      style={{ "--active-color": currentType?.color ?? "#5B8DEF" } as React.CSSProperties}
    >
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <div className="bubble-particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ "--i": index } as React.CSSProperties} />
        ))}
      </div>

      <header className="home-topbar">
        <button className="icon-button" onClick={() => navigate("settings")} aria-label="设置">
          <Settings size={22} />
        </button>
        <div className="now-copy" aria-hidden="true" />
        <div className="topbar-actions">
          <button className="icon-button" onClick={() => navigate("stats")} aria-label="统计">
            <BarChart3 size={22} />
          </button>
          <button className="icon-button" onClick={() => navigate("calendar")} aria-label="日历">
            <CalendarDays size={22} />
          </button>
        </div>
      </header>

      <section className="scene-stage" aria-label="时间泡泡首页">
        <div className="scene-core physics-scene" ref={sceneRef}>
          <MainBubble
            currentType={currentType}
            dailyBubble={currentDailyBubble}
            bubbleTypes={bubbleTypes}
            segments={segments.filter((segment) => segment.dayId === currentDailyBubble?.dayId)}
            now={now}
            elapsed={elapsed}
            disabled={currentDailyBubble?.exploded}
            position={physics.positions.main}
            onPointerDown={(event) => physics.startDrag("main", event)}
          />

          {visibleTypes.map((type, index) => (
            <OrbitBubble
              key={type.id}
              bubbleType={type}
              radius={getOrbitRadius(index)}
              position={physics.positions[type.id]}
              active={type.id === currentSegment?.bubbleTypeId}
              onClick={() => switchBubbleType(type.id)}
              onEdit={() => setEditing(type)}
              onPointerDown={(event) => physics.startDrag(type.id, event)}
              wasDragged={() => physics.consumeDragged(type.id)}
            />
          ))}

          <button
            className="orbit-bubble add-orbit physics-add-bubble"
            style={
              {
                "--bubble-color": "#7C8CFF",
                width: `${ADD_RADIUS * 2}px`,
                height: `${ADD_RADIUS * 2}px`,
                left: `${physics.positions.add?.x ?? 0}px`,
                top: `${physics.positions.add?.y ?? 0}px`,
                transform: "translate(-50%, -50%)"
              } as React.CSSProperties
            }
            onPointerDown={(event) => physics.startDrag("add", event)}
            onClick={() => {
              if (!physics.consumeDragged("add")) setAdding(true);
            }}
            aria-label="添加时间类型"
          >
            <Plus size={28} />
          </button>
        </div>
      </section>

      {reachedEnd && (
        <footer className="home-footer end-only-footer">
          <button className="soft-action" onClick={() => finishToday()}>
            结束今天
          </button>
        </footer>
      )}

      <AnimatePresence>
        {adding && (
          <AddBubbleDialog
            onClose={() => setAdding(false)}
            onCreate={async (input) => {
              await createBubbleType(input);
            }}
          />
        )}
        {editing && (
          <AddBubbleDialog
            key={editing.id}
            title="编辑时间泡泡"
            liveEdit
            initialValue={{
              name: editing.name,
              color: editing.color,
              icon: editing.icon
            }}
            onClose={() => setEditing(null)}
            onCreate={async (input) => {
              await updateBubbleType(editing.id, input);
            }}
            onDelete={
              currentSegment?.bubbleTypeId === editing.id
                ? undefined
                : async () => {
                    await deleteBubbleType(editing.id);
                  }
            }
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function getOrbitRadius(index: number) {
  const radii = [47, 46, 42, 42, 36, 36, 33, 31];
  return radii[index % radii.length];
}
