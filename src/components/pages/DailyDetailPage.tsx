import { Edit3, Share2 } from "lucide-react";
import { useNow } from "../../hooks";
import { useAppStore } from "../../store/appStore";
import { buildDailyStats } from "../../utils/stats";
import { formatClock, formatDuration, getReadableDate, getWeekday } from "../../utils/time";
import { BubbleIcon } from "../common/BubbleIcon";
import { PageShell } from "../common/PageShell";

export function DailyDetailPage() {
  const now = useNow(1000);
  const { selectedDayId, segments, bubbleTypes } = useAppStore();
  const stats = buildDailyStats(selectedDayId, segments, bubbleTypes, now);
  const typeMap = new Map(bubbleTypes.map((type) => [type.id, type]));
  const conic = stats.totals.length
    ? `conic-gradient(${stats.totals
        .reduce<{ cursor: number; stops: string[] }>(
          (acc, item) => {
            const start = acc.cursor;
            const end = start + item.percent;
            acc.stops.push(`${item.bubbleType.color} ${start}% ${end}%`);
            acc.cursor = end;
            return acc;
          },
          { cursor: 0, stops: [] }
        )
        .stops.join(", ")})`
    : "conic-gradient(#475569 0% 100%)";

  return (
    <PageShell
      title={getReadableDate(selectedDayId)}
      subtitle={`${getWeekday(selectedDayId)} · 时间流详情`}
      action={
        <button className="icon-button" aria-label="分享">
          <Share2 size={20} />
        </button>
      }
    >
      <section className="daily-hero glass-panel">
        <div className="donut" style={{ background: conic }}>
          <div>
            <span>总计</span>
            <strong>{formatDuration(stats.totalDuration, true)}</strong>
          </div>
        </div>
        <div className="daily-hero-copy">
          <span>今天主要属于</span>
          <strong>{stats.dominant?.bubbleType.name ?? "还没有记录"}</strong>
          <p>
            {stats.dominant ? `${stats.dominant.percent.toFixed(1)}% 的时间流向了这里` : "打开首页，让第一段时间开始流动。"}
          </p>
        </div>
      </section>

      <section className="type-total-list glass-panel">
        <h2>时间占比</h2>
        {stats.totals.length === 0 && <p className="empty-copy">这一天还没有形成时间泡泡。</p>}
        {stats.totals.map((item) => (
          <div className="type-total-row" key={item.bubbleType.id}>
            <div className="type-name">
              <i style={{ background: item.bubbleType.color }} />
              <span className="inline-type-icon">
                <BubbleIcon name={item.bubbleType.icon} size={16} />
              </span>
              <strong>{item.bubbleType.name}</strong>
            </div>
            <div className="type-bar">
              <span style={{ width: `${item.percent}%`, background: item.bubbleType.color }} />
            </div>
            <div className="type-value">
              <strong>{formatDuration(item.duration, true)}</strong>
              <span>{item.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </section>

      <section className="timeline-panel glass-panel">
        <div className="panel-heading">
          <h2>时间流</h2>
          <button className="ghost-button">
            <Edit3 size={16} />
            编辑
          </button>
        </div>
        {stats.segments.length === 0 && <p className="empty-copy">没有 Segment。时间还没有留下轨迹。</p>}
        <div className="timeline-list">
          {stats.segments.map((segment) => {
            const type = typeMap.get(segment.bubbleTypeId);
            return (
              <div className="timeline-item" key={segment.id}>
                <div className="timeline-time">
                  <strong>{formatClock(segment.startTime)}</strong>
                  <span>{segment.endTime ? formatClock(segment.endTime) : "现在"}</span>
                </div>
                <div className="timeline-dot" style={{ "--bubble-color": type?.color ?? "#94A3B8" } as React.CSSProperties} />
                <div className="timeline-content">
                  <strong>
                    <span className="inline-type-icon">
                      <BubbleIcon name={type?.icon} size={16} />
                    </span>
                    {type?.name ?? "其他"}
                  </strong>
                  <span>{formatDuration((segment.endTime ?? now) - segment.startTime, true)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
