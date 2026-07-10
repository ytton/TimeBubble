import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageShell } from "../common/PageShell";
import { useNow } from "../../hooks";
import { useAppStore } from "../../store/appStore";
import { buildCalendarSummary } from "../../utils/stats";
import { formatDuration, getMonthMatrix } from "../../utils/time";
import { SegmentWater } from "../bubble/SegmentWater";

export function CalendarPage() {
  const now = useNow(30000);
  const {
    monthAnchor,
    setMonthAnchor,
    dailyBubbles,
    segments,
    bubbleTypes,
    navigate
  } = useAppStore();
  const anchor = dayjs(monthAnchor);
  const days = getMonthMatrix(anchor.toDate());
  const summaries = days.map((date) => buildCalendarSummary(date, dailyBubbles, segments, bubbleTypes, now));

  function moveMonth(delta: number) {
    setMonthAnchor(anchor.add(delta, "month").format("YYYY-MM-DD"));
  }

  return (
    <PageShell
      title={anchor.format("YYYY年M月")}
      subtitle="每一天都是一颗时间泡泡"
      action={
        <div className="month-actions">
          <button className="icon-button" onClick={() => moveMonth(-1)} aria-label="上个月">
            <ChevronLeft size={20} />
          </button>
          <button className="icon-button" onClick={() => moveMonth(1)} aria-label="下个月">
            <ChevronRight size={20} />
          </button>
        </div>
      }
    >
      <section className="calendar-panel glass-panel">
        <div className="weekday-row">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="bubble-calendar-grid">
          {summaries.map((summary) => {
            const isOutsideMonth = !dayjs(summary.date).isSame(anchor, "month");
            const dayBubble = dailyBubbles.find((bubble) => bubble.dayId === summary.dayId);
            const daySegments = segments.filter((segment) => segment.dayId === summary.dayId);
            return (
              <button
                key={summary.dayId}
                className={`calendar-bubble ${summary.isToday ? "today" : ""} ${
                  summary.isFuture ? "future" : ""
                } ${isOutsideMonth ? "outside" : ""}`}
                style={{ "--bubble-color": summary.dominantColor } as React.CSSProperties}
                onClick={() => !summary.isFuture && navigate("daily", summary.dayId)}
                disabled={summary.isFuture}
                title={summary.dominantName ?? "无记录"}
              >
                <SegmentWater
                  bubbleTypes={bubbleTypes}
                  segments={daySegments}
                  dailyBubble={dayBubble}
                  now={now}
                  className="calendar-water"
                />
                <span>{dayjs(summary.date).date()}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="legend-row">
        {bubbleTypes
          .filter((type) => !type.hidden)
          .slice(0, 6)
          .map((type) => (
            <span key={type.id}>
              <i style={{ background: type.color }} />
              {type.name}
            </span>
          ))}
      </section>

      <section className="glass-panel calendar-summary-strip">
        <strong>本月有记录的泡泡</strong>
        <span>
          {summaries.filter((item) => item.hasData && dayjs(item.date).isSame(anchor, "month")).length} 天
        </span>
        <strong>当前可见总时长</strong>
        <span>
          {formatDuration(
            summaries
              .filter((item) => dayjs(item.date).isSame(anchor, "month"))
              .reduce((sum, item) => sum + item.totalDuration, 0),
            true
          )}
        </span>
      </section>
    </PageShell>
  );
}
