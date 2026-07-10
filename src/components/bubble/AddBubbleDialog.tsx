import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { BubbleIcon } from "../common/BubbleIcon";
import { BUBBLE_COLOR_OPTIONS, BUBBLE_ICON_OPTIONS } from "../../utils/constants";

interface AddBubbleDialogProps {
  onClose: () => void;
  onCreate: (input: { name: string; color: string; icon: string }) => Promise<void>;
  initialValue?: { name: string; color: string; icon: string };
  title?: string;
  submitLabel?: string;
  onDelete?: () => Promise<void>;
  liveEdit?: boolean;
}

export function AddBubbleDialog({
  onClose,
  onCreate,
  initialValue,
  title = "添加时间类型",
  submitLabel = "创建",
  onDelete,
  liveEdit = false
}: AddBubbleDialogProps) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [color, setColor] = useState(initialValue?.color ?? BUBBLE_COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState(initialValue?.icon ?? BUBBLE_ICON_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const canSave = useMemo(() => name.trim().length > 0 && !saving, [name, saving]);

  useEffect(() => {
    if (!liveEdit || !initialValue || name.trim().length === 0) return;
    const unchanged = name === initialValue.name && color === initialValue.color && icon === initialValue.icon;
    if (unchanged) return;

    const timer = window.setTimeout(() => {
      onCreate({ name, color, icon });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [color, icon, initialValue, liveEdit, name, onCreate]);

  async function handleCreate() {
    if (!canSave) return;
    setSaving(true);
    await onCreate({ name, color, icon });
    setSaving(false);
    onClose();
  }

  return (
    <motion.div
      className="dialog-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className="glass-dialog add-dialog"
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.96 }}
      >
        {onDelete && (
          <button
            className="icon-button dialog-delete"
            onClick={async () => {
              await onDelete();
              onClose();
            }}
            aria-label="删除"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button className="icon-button dialog-close" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>
        <div className="dialog-orb" style={{ "--bubble-color": color } as React.CSSProperties}>
          <BubbleIcon name={icon} size={38} />
        </div>
        <h2>{title}</h2>
        <input
          className="soft-input"
          placeholder="输入名称，例如：写作"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />

        <div className="field-label">选择颜色</div>
        <div className="color-grid">
          {BUBBLE_COLOR_OPTIONS.map((option) => (
            <button
              key={option}
              className={`color-dot ${option === color ? "selected" : ""}`}
              style={{ background: option }}
              onClick={() => setColor(option)}
              aria-label={`选择颜色 ${option}`}
            />
          ))}
        </div>

        <div className="field-label">选择图标</div>
        <div className="icon-grid">
          {BUBBLE_ICON_OPTIONS.map((option) => (
            <button
              key={option}
              className={`icon-choice ${option === icon ? "selected" : ""}`}
              onClick={() => setIcon(option)}
              aria-label={`选择图标 ${option}`}
            >
              <BubbleIcon name={option} size={20} />
            </button>
          ))}
        </div>

        {!liveEdit && (
          <button className="primary-button" onClick={handleCreate} disabled={!canSave}>
            {saving ? "保存中" : submitLabel}
          </button>
        )}
      </motion.section>
    </motion.div>
  );
}
