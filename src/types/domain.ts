export type ThemeMode = "light" | "dark" | "system";

export type AnimationSpeed = "fast" | "normal" | "slow";

export type AppView = "home" | "calendar" | "daily" | "settings" | "stats" | "ended";

export interface BubbleType {
  id: string;
  name: string;
  color: string;
  icon: string;
  hidden: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TimeSegment {
  id: string;
  bubbleTypeId: string;
  startTime: number;
  endTime?: number;
  dayId: string;
  createdAt: number;
  updatedAt: number;
}

export interface DailyBubble {
  id: string;
  dayId: string;
  startTime: number;
  endTime: number;
  exploded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  id: string;
  bubbleEndTime: string;
  themeMode: ThemeMode;
  animationSpeed: AnimationSpeed;
  soundEnabled: boolean;
  ambientEnabled: boolean;
  floatingEnabled: boolean;
  updatedAt: number;
}

export interface BubbleInput {
  name: string;
  color: string;
  icon: string;
}

export interface TypeTotal {
  bubbleType: BubbleType;
  duration: number;
  percent: number;
}

export interface DailyStats {
  dayId: string;
  totalDuration: number;
  totals: TypeTotal[];
  dominant?: TypeTotal;
  segments: TimeSegment[];
}

export interface CalendarDaySummary {
  dayId: string;
  date: Date;
  isToday: boolean;
  isFuture: boolean;
  hasData: boolean;
  dominantColor: string;
  dominantName?: string;
  totalDuration: number;
}
