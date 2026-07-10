import type { BubbleType, Settings } from "../types/domain";

export const IDLE_BUBBLE_ID = "system-idle";

export const DEFAULT_BUBBLE_COLORS = {
  idle: "#94A3B8",
  study: "#5B8DEF",
  work: "#4CAF50",
  entertainment: "#A855F7",
  reading: "#F59E0B",
  exercise: "#EF4444"
};

export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  bubbleEndTime: "22:00",
  themeMode: "dark",
  animationSpeed: "normal",
  soundEnabled: true,
  ambientEnabled: false,
  floatingEnabled: true,
  updatedAt: Date.now()
};

export const DEFAULT_BUBBLE_TYPES: BubbleType[] = [
  {
    id: IDLE_BUBBLE_ID,
    name: "无所事事",
    color: DEFAULT_BUBBLE_COLORS.idle,
    icon: "timer",
    hidden: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "default-study",
    name: "学习",
    color: DEFAULT_BUBBLE_COLORS.study,
    icon: "book",
    hidden: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "default-work",
    name: "工作",
    color: DEFAULT_BUBBLE_COLORS.work,
    icon: "briefcase",
    hidden: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "default-entertainment",
    name: "娱乐",
    color: DEFAULT_BUBBLE_COLORS.entertainment,
    icon: "gamepad",
    hidden: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "default-reading",
    name: "阅读",
    color: DEFAULT_BUBBLE_COLORS.reading,
    icon: "book",
    hidden: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "default-exercise",
    name: "运动",
    color: DEFAULT_BUBBLE_COLORS.exercise,
    icon: "dumbbell",
    hidden: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const BUBBLE_COLOR_OPTIONS = [
  "#5B8DEF",
  "#4CAF50",
  "#A855F7",
  "#F59E0B",
  "#EF4444",
  "#38BDF8",
  "#EC4899",
  "#14B8A6",
  "#EAB308",
  "#94A3B8"
];

export const BUBBLE_ICON_OPTIONS = [
  "book",
  "briefcase",
  "gamepad",
  "dumbbell",
  "music",
  "code",
  "palette",
  "heart",
  "star",
  "lightbulb",
  "timer",
  "trophy"
];
