import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  type IEventCollision,
  type IEventTimestamped
} from "matter-js";
import { getOrbitDefaultPosition } from "./OrbitBubble";

export interface PhysicsBubbleItem {
  id: string;
  kind: "main" | "orbit" | "add";
  index?: number;
  radius: number;
}

export interface PhysicsBubblePosition {
  x: number;
  y: number;
  angle: number;
}

interface DragState {
  id: string;
  body: Body;
  offsetX: number;
  offsetY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  velocityX: number;
  velocityY: number;
  moved: boolean;
}

const WALL_THICKNESS = 120;

export function useBubblePhysics(items: PhysicsBubbleItem[], containerRef: RefObject<HTMLElement | null>) {
  const [bounds, setBounds] = useState({ width: 430, height: 620 });
  const [positions, setPositions] = useState<Record<string, PhysicsBubblePosition>>({});
  const engineRef = useRef<Engine | null>(null);
  const bodiesRef = useRef<Map<string, Body>>(new Map());
  const dragRef = useRef<DragState | null>(null);
  const draggedIdsRef = useRef<Set<string>>(new Set());
  const itemsKey = useMemo(() => items.map((item) => `${item.id}:${item.kind}:${item.radius}`).join("|"), [items]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateBounds = () => {
      const rect = element.getBoundingClientRect();
      setBounds({
        width: Math.max(320, rect.width),
        height: Math.max(560, rect.height)
      });
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const engine = Engine.create({
      gravity: { x: 0, y: 0 }
    });
    engine.positionIterations = 8;
    engine.velocityIterations = 6;
    engineRef.current = engine;

    const walls = [
      Bodies.rectangle(bounds.width / 2, -WALL_THICKNESS / 2, bounds.width + WALL_THICKNESS * 2, WALL_THICKNESS, {
        isStatic: true,
        restitution: 0.9
      }),
      Bodies.rectangle(
        bounds.width / 2,
        bounds.height + WALL_THICKNESS / 2,
        bounds.width + WALL_THICKNESS * 2,
        WALL_THICKNESS,
        { isStatic: true, restitution: 0.9 }
      ),
      Bodies.rectangle(-WALL_THICKNESS / 2, bounds.height / 2, WALL_THICKNESS, bounds.height + WALL_THICKNESS * 2, {
        isStatic: true,
        restitution: 0.9
      }),
      Bodies.rectangle(
        bounds.width + WALL_THICKNESS / 2,
        bounds.height / 2,
        WALL_THICKNESS,
        bounds.height + WALL_THICKNESS * 2,
        { isStatic: true, restitution: 0.9 }
      )
    ];

    const bodies = items.map((item) => {
      const initial = getInitialPosition(item, bounds.width, bounds.height);
      const body = Bodies.circle(initial.x, initial.y, item.radius, {
        restitution: item.kind === "main" ? 0.92 : 0.86,
        friction: 0.02,
        frictionAir: item.kind === "main" ? 0.006 : item.kind === "add" ? 0.026 : 0.018,
        density: item.kind === "main" ? 0.0048 : item.kind === "add" ? 0.0009 : 0.0014,
        label: item.id
      });
      Body.setAngularVelocity(body, item.kind === "main" ? 0.002 : (item.index ?? 1) % 2 ? 0.006 : -0.006);
      return body;
    });

    bodiesRef.current = new Map(bodies.map((body) => [body.label, body]));
    Composite.add(engine.world, [...walls, ...bodies]);

    Events.on(engine, "collisionStart", (event: IEventCollision<Engine>) => {
      for (const pair of event.pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        if (!bodyA.isStatic) Body.setAngularVelocity(bodyA, bodyA.angularVelocity * 0.8);
        if (!bodyB.isStatic) Body.setAngularVelocity(bodyB, bodyB.angularVelocity * 0.8);
      }
    });

    let frame = 0;
    let last = performance.now();

    const tick = (time: number) => {
      const delta = Math.min(32, time - last || 16.67);
      last = time;
      applyAmbientForces(bodies, time);
      Engine.update(engine, delta);

      const next: Record<string, PhysicsBubblePosition> = {};
      for (const body of bodies) {
        next[body.label] = {
          x: body.position.x,
          y: body.position.y,
          angle: body.angle
        };
      }
      setPositions(next);
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
      bodiesRef.current.clear();
    };
  }, [bounds.height, bounds.width, itemsKey]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragRef.current;
      const element = containerRef.current;
      if (!drag || !element) return;

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - drag.offsetX;
      const y = event.clientY - rect.top - drag.offsetY;
      const now = performance.now();
      const dt = Math.max(16, now - drag.lastTime);
      drag.velocityX = ((x - drag.lastX) / dt) * 16.67;
      drag.velocityY = ((y - drag.lastY) / dt) * 16.67;
      drag.lastX = x;
      drag.lastY = y;
      drag.lastTime = now;
      if (Math.hypot(drag.velocityX, drag.velocityY) > 0.8) drag.moved = true;

      Body.setPosition(drag.body, {
        x: clamp(x, drag.body.circleRadius ?? 20, bounds.width - (drag.body.circleRadius ?? 20)),
        y: clamp(y, drag.body.circleRadius ?? 20, bounds.height - (drag.body.circleRadius ?? 20))
      });
      Body.setVelocity(drag.body, { x: drag.velocityX, y: drag.velocityY });
    }

    function handlePointerUp() {
      const drag = dragRef.current;
      if (!drag) return;
      Body.setVelocity(drag.body, {
        x: drag.velocityX * 1.25,
        y: drag.velocityY * 1.25
      });
      Body.setAngularVelocity(drag.body, clamp(drag.velocityX / 120, -0.16, 0.16));
      if (drag.moved) draggedIdsRef.current.add(drag.id);
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [bounds.height, bounds.width, containerRef]);

  function startDrag(id: string, event: React.PointerEvent) {
    const body = bodiesRef.current.get(id);
    const element = containerRef.current;
    if (!body || !element) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rect = element.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    dragRef.current = {
      id,
      body,
      offsetX: pointerX - body.position.x,
      offsetY: pointerY - body.position.y,
      lastX: body.position.x,
      lastY: body.position.y,
      lastTime: performance.now(),
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      moved: false
    };
    Body.setVelocity(body, { x: 0, y: 0 });
  }

  function consumeDragged(id: string) {
    const didDrag = draggedIdsRef.current.has(id);
    if (didDrag) draggedIdsRef.current.delete(id);
    return didDrag;
  }

  return {
    positions,
    startDrag,
    consumeDragged
  };
}

function getInitialPosition(item: PhysicsBubbleItem, width: number, height: number) {
  const centerX = width / 2;

  if (item.kind === "main") {
    return {
      x: centerX,
      y: Math.min(205, height * 0.3)
    };
  }

  if (item.kind === "add") {
    return {
      x: centerX,
      y: Math.min(height - 62, height * 0.86)
    };
  }

  const position = getOrbitDefaultPosition(item.index ?? 0);
  const spread = Math.min(1.85, Math.max(1, width / 430));
  return {
    x: centerX + position.x * spread,
    y: height * 0.62 + position.y
  };
}

function applyAmbientForces(bodies: Body[], time: number) {
  for (let index = 0; index < bodies.length; index++) {
    const body = bodies[index];
    if (body.isStatic) continue;
    const radius = body.circleRadius ?? 40;
    const forceScale = radius > 100 ? 0.000008 : 0.000014;
    Body.applyForce(body, body.position, {
      x: Math.sin(time / (1800 + index * 130)) * forceScale * body.mass,
      y: Math.cos(time / (2200 + index * 170)) * forceScale * body.mass
    });
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
