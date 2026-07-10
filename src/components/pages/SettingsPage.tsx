import { Bell, Moon, Music, Sparkles, Waves } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { AnimationSpeed, ThemeMode } from "../../types/domain";
import { PageShell } from "../common/PageShell";

export function SettingsPage() {
  const { settings, updateSettings } = useAppStore();

  return (
    <PageShell title="设置" subtitle="让今天的泡泡在合适的时间结束">
      <section className="settings-stack">
        <div className="glass-panel setting-card highlight-setting">
          <div>
            <span className="setting-kicker">每日结束时间</span>
            <strong>Bubble End Time</strong>
            <p>到达这个时间后，今天的泡泡会进入结束仪式。</p>
          </div>
          <input
            className="time-input"
            type="time"
            value={settings.bubbleEndTime}
            onChange={(event) => updateSettings({ bubbleEndTime: event.target.value })}
          />
        </div>

        <div className="glass-panel setting-card">
          <Moon size={22} />
          <div>
            <strong>主题模式</strong>
            <p>第一版默认深色，保留浅色入口。</p>
          </div>
          <select
            className="soft-select"
            value={settings.themeMode}
            onChange={(event) => updateSettings({ themeMode: event.target.value as ThemeMode })}
          >
            <option value="dark">深色</option>
            <option value="light">浅色</option>
            <option value="system">自动</option>
          </select>
        </div>

        <div className="glass-panel setting-card">
          <Sparkles size={22} />
          <div>
            <strong>动画速度</strong>
            <p>控制泡泡融合和页面过渡节奏。</p>
          </div>
          <select
            className="soft-select"
            value={settings.animationSpeed}
            onChange={(event) => updateSettings({ animationSpeed: event.target.value as AnimationSpeed })}
          >
            <option value="fast">快</option>
            <option value="normal">正常</option>
            <option value="slow">慢</option>
          </select>
        </div>

        <ToggleSetting
          icon={<Bell size={22} />}
          title="音效"
          description="切换 Bubble 时播放轻柔反馈。"
          checked={settings.soundEnabled}
          onChange={(value) => updateSettings({ soundEnabled: value })}
        />
        <ToggleSetting
          icon={<Music size={22} />}
          title="背景氛围音"
          description="保持安静，默认关闭。"
          checked={settings.ambientEnabled}
          onChange={(value) => updateSettings({ ambientEnabled: value })}
        />
        <ToggleSetting
          icon={<Waves size={22} />}
          title="漂浮动画"
          description="让小泡泡保持轻微运动。"
          checked={settings.floatingEnabled}
          onChange={(value) => updateSettings({ floatingEnabled: value })}
        />
      </section>
    </PageShell>
  );
}

function ToggleSetting({
  icon,
  title,
  description,
  checked,
  onChange
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="glass-panel setting-card">
      {icon}
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        className={`toggle ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
        aria-label={title}
      >
        <span />
      </button>
    </div>
  );
}
