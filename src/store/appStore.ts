import { create } from "zustand";
import { db } from "../database/db";
import type {
  AppView,
  BubbleInput,
  BubbleType,
  DailyBubble,
  Settings,
  TimeSegment
} from "../types/domain";
import { DEFAULT_BUBBLE_TYPES, DEFAULT_SETTINGS, IDLE_BUBBLE_ID } from "../utils/constants";
import { createId, getDayId, getEndTimeForDay } from "../utils/time";

interface AppState {
  initialized: boolean;
  loading: boolean;
  view: AppView;
  selectedDayId: string;
  monthAnchor: string;
  bubbleTypes: BubbleType[];
  segments: TimeSegment[];
  dailyBubbles: DailyBubble[];
  settings: Settings;
  currentDailyBubble?: DailyBubble;
  currentSegment?: TimeSegment;
  lastSwitchColor?: string;
  initialize: () => Promise<void>;
  navigate: (view: AppView, dayId?: string) => void;
  setMonthAnchor: (value: string) => void;
  createBubbleType: (input: BubbleInput) => Promise<BubbleType>;
  updateBubbleType: (id: string, input: BubbleInput) => Promise<void>;
  deleteBubbleType: (id: string) => Promise<void>;
  switchBubbleType: (bubbleTypeId: string) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  finishToday: () => Promise<void>;
  refresh: () => Promise<void>;
}

async function readAll() {
  const [bubbleTypes, segments, dailyBubbles, settingsRows] = await Promise.all([
    db.bubbleTypes.toArray(),
    db.segments.toArray(),
    db.dailyBubbles.toArray(),
    db.settings.toArray()
  ]);

  return {
    bubbleTypes,
    segments,
    dailyBubbles,
    settings: settingsRows[0] ?? DEFAULT_SETTINGS
  };
}

async function ensureDefaults() {
  const now = Date.now();
  const settings = await db.settings.get("settings");
  if (!settings) {
    await db.settings.put({ ...DEFAULT_SETTINGS, updatedAt: now });
  }

  const bubbleCount = await db.bubbleTypes.count();
  if (bubbleCount === 0) {
    await db.bubbleTypes.bulkPut(
      DEFAULT_BUBBLE_TYPES.map((type) => ({ ...type, createdAt: now, updatedAt: now }))
    );
  }
}

async function ensureToday(settings: Settings) {
  const now = Date.now();
  const dayId = getDayId(now);
  const endTime = getEndTimeForDay(dayId, settings.bubbleEndTime);
  const existingDaily = await db.dailyBubbles.where("dayId").equals(dayId).first();
  let currentDailyBubble = existingDaily;

  if (!currentDailyBubble) {
    currentDailyBubble = {
      id: createId("day"),
      dayId,
      startTime: now,
      endTime,
      exploded: false,
      createdAt: now,
      updatedAt: now
    };
    await db.dailyBubbles.put(currentDailyBubble);
  } else if (currentDailyBubble.endTime !== endTime) {
    currentDailyBubble = { ...currentDailyBubble, endTime, updatedAt: now };
    await db.dailyBubbles.put(currentDailyBubble);
  }

  const openSegments = await db.segments.filter((segment) => segment.endTime === undefined).toArray();
  const currentOpen = openSegments.find((segment) => segment.dayId === dayId);

  for (const segment of openSegments) {
    if (segment.dayId !== dayId) {
      await db.segments.put({ ...segment, endTime: now, updatedAt: now });
    }
  }

  if (!currentOpen && !currentDailyBubble.exploded) {
    await db.segments.put({
      id: createId("segment"),
      bubbleTypeId: IDLE_BUBBLE_ID,
      startTime: now,
      dayId,
      createdAt: now,
      updatedAt: now
    });
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  loading: false,
  view: "home",
  selectedDayId: getDayId(),
  monthAnchor: getDayId(),
  bubbleTypes: [],
  segments: [],
  dailyBubbles: [],
  settings: DEFAULT_SETTINGS,
  currentDailyBubble: undefined,
  currentSegment: undefined,
  lastSwitchColor: undefined,

  initialize: async () => {
    if (get().initialized || get().loading) return;

    set({ loading: true });
    await ensureDefaults();
    const settings = (await db.settings.get("settings")) ?? DEFAULT_SETTINGS;
    await ensureToday(settings);
    const data = await readAll();
    const dayId = getDayId();
    const currentDailyBubble = data.dailyBubbles.find((bubble) => bubble.dayId === dayId);
    const currentSegment = data.segments.find(
      (segment) => segment.dayId === dayId && segment.endTime === undefined
    );

    set({
      ...data,
      currentDailyBubble,
      currentSegment,
      initialized: true,
      loading: false,
      selectedDayId: dayId,
      monthAnchor: dayId
    });
  },

  navigate: (view, dayId) => {
    set((state) => ({
      view,
      selectedDayId: dayId ?? state.selectedDayId
    }));
  },

  setMonthAnchor: (value) => set({ monthAnchor: value }),

  createBubbleType: async (input) => {
    const now = Date.now();
    const bubbleType: BubbleType = {
      id: createId("type"),
      name: input.name.trim(),
      color: input.color,
      icon: input.icon,
      hidden: false,
      createdAt: now,
      updatedAt: now
    };

    await db.bubbleTypes.put(bubbleType);
    await get().refresh();
    return bubbleType;
  },

  updateBubbleType: async (id, input) => {
    const existing = await db.bubbleTypes.get(id);
    if (!existing || existing.hidden) return;

    await db.bubbleTypes.put({
      ...existing,
      name: input.name.trim(),
      color: input.color,
      icon: input.icon,
      updatedAt: Date.now()
    });
    await get().refresh();
  },

  deleteBubbleType: async (id) => {
    const state = get();
    const existing = await db.bubbleTypes.get(id);
    if (!existing || existing.hidden || id === IDLE_BUBBLE_ID) return;
    if (state.currentSegment?.bubbleTypeId === id) return;

    const used = state.segments.some((segment) => segment.bubbleTypeId === id);
    if (used) {
      await db.bubbleTypes.put({ ...existing, hidden: true, updatedAt: Date.now() });
    } else {
      await db.bubbleTypes.delete(id);
    }

    await get().refresh();
  },

  switchBubbleType: async (bubbleTypeId) => {
    const state = get();
    const now = Date.now();
    const dayId = getDayId(now);
    const target = state.bubbleTypes.find((type) => type.id === bubbleTypeId);

    if (!target || state.currentDailyBubble?.exploded) return;
    if (state.currentSegment?.bubbleTypeId === bubbleTypeId) return;

    if (!state.currentDailyBubble || state.currentDailyBubble.dayId !== dayId) {
      await ensureToday(state.settings);
      await get().refresh();
    }

    const currentSegment = get().currentSegment;
    if (currentSegment) {
      await db.segments.put({ ...currentSegment, endTime: now, updatedAt: now });
    }

    const nextSegment: TimeSegment = {
      id: createId("segment"),
      bubbleTypeId,
      startTime: now,
      dayId,
      createdAt: now,
      updatedAt: now
    };
    await db.segments.put(nextSegment);
    await get().refresh();
    set({ lastSwitchColor: target.color });
  },

  updateSettings: async (patch) => {
    const now = Date.now();
    const current = get().settings;
    const next = { ...current, ...patch, id: "settings", updatedAt: now };
    await db.settings.put(next);

    const daily = get().currentDailyBubble;
    if (daily && patch.bubbleEndTime) {
      const updatedEndTime = getEndTimeForDay(daily.dayId, patch.bubbleEndTime);
      const shouldResumeToday = daily.dayId === getDayId(now) && updatedEndTime > now;
      const updatedDaily = {
        ...daily,
        endTime: updatedEndTime,
        exploded: shouldResumeToday ? false : daily.exploded,
        updatedAt: now
      };
      await db.dailyBubbles.put(updatedDaily);

      if (shouldResumeToday) {
        const openSegment = await db.segments
          .where("dayId")
          .equals(daily.dayId)
          .filter((segment) => segment.endTime === undefined)
          .first();

        if (!openSegment) {
          const lastSegment = (await db.segments.where("dayId").equals(daily.dayId).toArray()).sort(
            (a, b) => b.startTime - a.startTime
          )[0];

          if (lastSegment) {
            await db.segments.put({
              ...lastSegment,
              endTime: undefined,
              updatedAt: now
            });
          } else {
            await db.segments.put({
              id: createId("segment"),
              bubbleTypeId: IDLE_BUBBLE_ID,
              startTime: now,
              dayId: daily.dayId,
              createdAt: now,
              updatedAt: now
            });
          }
        }
      }
    }

    await get().refresh();
  },

  finishToday: async () => {
    const now = Date.now();
    const { currentDailyBubble, currentSegment } = get();

    if (!currentDailyBubble) return;

    if (currentSegment && !currentSegment.endTime) {
      await db.segments.put({ ...currentSegment, endTime: now, updatedAt: now });
    }

    await db.dailyBubbles.put({ ...currentDailyBubble, exploded: true, updatedAt: now });
    await get().refresh();
    set({ view: "ended", selectedDayId: currentDailyBubble.dayId });
  },

  refresh: async () => {
    const data = await readAll();
    const dayId = getDayId();
    const currentDailyBubble = data.dailyBubbles.find((bubble) => bubble.dayId === dayId);
    const currentSegment = data.segments.find(
      (segment) => segment.dayId === dayId && segment.endTime === undefined
    );

    set({
      ...data,
      currentDailyBubble,
      currentSegment
    });
  }
}));
