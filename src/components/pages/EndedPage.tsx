import { motion } from "framer-motion";
import { Moon, Sparkles } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { buildDailyStats } from "../../utils/stats";
import { formatDuration, getReadableDate } from "../../utils/time";

export function EndedPage() {
  const { selectedDayId, segments, bubbleTypes, navigate } = useAppStore();
  const stats = buildDailyStats(selectedDayId, segments, bubbleTypes);

  return (
    <main className="ended-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-three" />
      <motion.div
        className="explosion-orb"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: [0.7, 1.1, 1], opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ "--i": index } as React.CSSProperties} />
        ))}
        <Moon size={42} />
      </motion.div>
      <section className="ended-copy glass-panel">
        <Sparkles size={22} />
        <span>{getReadableDate(selectedDayId)}</span>
        <h1>今天结束啦</h1>
        <p>你的时间最终变成了这样一颗 Bubble。</p>
        <strong>{formatDuration(stats.totalDuration, true)}</strong>
        <button className="primary-button" onClick={() => navigate("daily", selectedDayId)}>
          查看今日总结
        </button>
        <button className="ghost-button centered" onClick={() => navigate("home")}>
          回到首页
        </button>
      </section>
    </main>
  );
}
