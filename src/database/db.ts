import Dexie, { type Table } from "dexie";
import type { BubbleType, DailyBubble, Settings, TimeSegment } from "../types/domain";

export class TimeBubbleDatabase extends Dexie {
  bubbleTypes!: Table<BubbleType, string>;
  segments!: Table<TimeSegment, string>;
  dailyBubbles!: Table<DailyBubble, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("time-bubble-db");

    this.version(1).stores({
      bubbleTypes: "id, hidden, updatedAt",
      segments: "id, bubbleTypeId, dayId, startTime, endTime",
      dailyBubbles: "id, dayId, startTime, endTime, exploded",
      settings: "id"
    });
  }
}

export const db = new TimeBubbleDatabase();
