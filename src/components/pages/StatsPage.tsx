import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { PageShell } from "../common/PageShell";
import { useNow } from "../../hooks";
import { useAppStore } from "../../store/appStore";
import { buildDailyStats } from "../../utils/stats";
import { formatDuration, getDayId } from "../../utils/time";
import { BubbleIcon } from "../common/BubbleIcon";

type StatsTab = "day" | "week" | "month";

export function StatsPage() {
  const now = useNow(30000);
  const [tab, setTab] = useState<StatsTab>("day");
  const { segments, bubbleTypes } = useAppStore();
  const todayId = getDayId(now);
  const todayStats = buildDailyStats(todayId, segments, bubbleTypes, now);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, index) =>
        dayjs(todayId)
          .startOf("week")
          .add(index, "day")
          .format("YYYY-MM-DD")
      ),
    [todayId]
  );

  const monthDays = useMemo(() => {
    const start = dayjs(todayId).startOf("month");
    return Array.from({ length: dayjs(todayId).daysInMonth() }).map((_, index) =>
      start.add(index, "day").format("YYYY-MM-DD")
    );
  }, [todayId]);

  const weekStats = weekDays.map((dayId) => buildDailyStats(dayId, segments, bubbleTypes, now));
  const monthStats = monthDays.map((dayId) => buildDailyStats(dayId, segments, bubbleTypes, now));
  const activeStats = tab === "day" ? [todayStats] : tab === "week" ? weekStats : monthStats;
  const mergedTotals = mergeTotals(activeStats);
  const totalDuration = mergedTotals.reduce((sum, item) => sum + item.duration, 0);
  const conic = buildConic(mergedTotals);
  const dominant = mergedTotals[0];

  return (
    <PageShell title="统计" subtitle="回看时间最终流向了哪里">
      <section className="stats-tabs glass-panel">
        {[
          ["day", "日"] as const,
          ["week", "周"] as const,
          ["month", "月"] as const
        ].map(([value, label]) => (
          <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </section>

      <section className="stats-hero glass-panel">
        <div className="stats-orb" style={{ "--bubble-color": dominant?.color ?? "#5B8DEF" } as React.CSSProperties}>
          <span>
            <BubbleIcon name={dominant?.icon} size={42} />
          </span>
          <strong>{dominant?.name ?? "暂无记录"}</strong>
          <em>{dominant ? `${dominant.percent.toFixed(0)}%` : "0%"}</em>
        </div>
        <div className="stats-copy">
          <span>{tab === "day" ? "今天" : tab === "week" ? "本周" : "本月"}</span>
          <h2>{dominant ? `你的时间主要属于：${dominant.name}` : "还没有足够的时间轨迹"}</h2>
          <p>总记录 {formatDuration(totalDuration, true)}</p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="glass-panel stats-card">
          <h3>时间占比</h3>
          <div className="stats-donut" style={{ background: conic }}>
            <div>
              <span>总计</span>
              <strong>{formatDuration(totalDuration, true)}</strong>
            </div>
          </div>
          <div className="stats-legend-list">
            {mergedTotals.map((item) => (
              <div key={item.id}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.name}
                </span>
                <strong>{item.percent.toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel stats-card">
          <h3>{tab === "day" ? "今日时间流" : tab === "week" ? "每日分布" : "月度热力"}</h3>
          {tab === "day" ? (
            <div className="stats-timeline-mini">
              {todayStats.segments.slice(-8).map((segment) => {
                const type = bubbleTypes.find((item) => item.id === segment.bubbleTypeId);
                const duration = Math.max(0, (segment.endTime ?? now) - segment.startTime);
                const percent = todayStats.totalDuration > 0 ? (duration / todayStats.totalDuration) * 100 : 0;
                return (
                  <div
                    className="stats-flow-row"
                    key={segment.id}
                    style={
                      {
                        "--bubble-color": type?.color ?? "#94A3B8",
                        "--flow-percent": `${Math.max(3, percent)}%`
                      } as React.CSSProperties
                    }
                  >
                    <span className="stats-flow-time">{dayjs(segment.startTime).format("HH:mm")}</span>
                    <div className="stats-flow-label">
                      <i />
                      <strong>{type?.name ?? "其他"}</strong>
                    </div>
                    <div className="stats-flow-track">
                      <span />
                    </div>
                    <em className="stats-flow-percent">{percent.toFixed(1)}%</em>
                    <em className="stats-flow-duration">{formatDuration(duration, true)}</em>
                  </div>
                );
              })}
              {todayStats.segments.length === 0 && <p className="empty-copy">今天还没有时间轨迹。</p>}
            </div>
          ) : tab === "week" ? (
            <div className="week-bars">
              {weekStats.map((stats) => (
                <div className="week-distribution" key={stats.dayId} title={`${stats.dayId} ${formatDuration(stats.totalDuration, true)}`}>
                  <div
                    className="week-stack"
                    style={
                      {
                        "--height": `${Math.max(10, Math.min(100, stats.totalDuration / 36_000))}%`
                      } as React.CSSProperties
                    }
                  >
                    {stats.totals.length > 0 ? (
                      stats.totals.map((item) => (
                        <span
                          key={item.bubbleType.id}
                          style={
                            {
                              "--bubble-color": item.bubbleType.color,
                              "--segment-size": `${item.percent}%`
                            } as React.CSSProperties
                          }
                          title={`${item.bubbleType.name} ${item.percent.toFixed(1)}% ${formatDuration(item.duration, true)}`}
                        />
                      ))
                    ) : (
                      <span
                        className="week-stack-empty"
                        style={
                          {
                            "--segment-size": "100%",
                            "--bubble-color": "#475569"
                          } as React.CSSProperties
                        }
                      />
                    )}
                  </div>
                  <em>{dayjs(stats.dayId).format("dd")}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="month-heat">
              {monthStats.map((stats) => (
                <div
                  key={stats.dayId}
                  className="period-cell"
                  style={
                    {
                      "--bubble-color": stats.dominant?.bubbleType.color ?? "#475569",
                      "--height": `${Math.max(8, Math.min(100, stats.totalDuration / 36_000))}%`
                    } as React.CSSProperties
                  }
                  title={`${stats.dayId} ${formatDuration(stats.totalDuration, true)}`}
                >
                  <span>{dayjs(stats.dayId).format("D")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function mergeTotals(statsList: ReturnType<typeof buildDailyStats>[]) {
  const map = new Map<
    string,
    {
      id: string;
      name: string;
      icon: string;
      color: string;
      duration: number;
      percent: number;
    }
  >();

  for (const stats of statsList) {
    for (const item of stats.totals) {
      const current = map.get(item.bubbleType.id);
      map.set(item.bubbleType.id, {
        id: item.bubbleType.id,
        name: item.bubbleType.name,
        icon: item.bubbleType.icon,
        color: item.bubbleType.color,
        duration: (current?.duration ?? 0) + item.duration,
        percent: 0
      });
    }
  }

  const list = Array.from(map.values()).sort((a, b) => b.duration - a.duration);
  const total = list.reduce((sum, item) => sum + item.duration, 0);
  return list.map((item) => ({ ...item, percent: total > 0 ? (item.duration / total) * 100 : 0 }));
}

function buildConic(items: ReturnType<typeof mergeTotals>) {
  if (items.length === 0) return "conic-gradient(#475569 0% 100%)";

  let cursor = 0;
  const stops = items.map((item) => {
    const start = cursor;
    const end = cursor + item.percent;
    cursor = end;
    return `${item.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}
