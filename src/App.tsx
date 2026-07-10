import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { BubbleScene } from "./components/bubble/BubbleScene";
import { CalendarPage } from "./components/pages/CalendarPage";
import { DailyDetailPage } from "./components/pages/DailyDetailPage";
import { EndedPage } from "./components/pages/EndedPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { StatsPage } from "./components/pages/StatsPage";
import { useAppStore } from "./store/appStore";

export function App() {
  const { initialized, loading, view, initialize, currentDailyBubble, finishToday } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized || !currentDailyBubble || currentDailyBubble.exploded) return;

    const interval = window.setInterval(() => {
      if (Date.now() >= currentDailyBubble.endTime) {
        finishToday();
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [currentDailyBubble, finishToday, initialized]);

  if (!initialized || loading) {
    return (
      <main className="loading-screen">
        <div className="loading-bubble" />
        <p>正在生成今天的 Bubble</p>
      </main>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.015 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {view === "home" && <BubbleScene />}
        {view === "calendar" && <CalendarPage />}
        {view === "daily" && <DailyDetailPage />}
        {view === "settings" && <SettingsPage />}
        {view === "stats" && <StatsPage />}
        {view === "ended" && <EndedPage />}
      </motion.div>
    </AnimatePresence>
  );
}
