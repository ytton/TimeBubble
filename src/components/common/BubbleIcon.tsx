import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Dumbbell,
  Gamepad2,
  Heart,
  Lightbulb,
  Music,
  Palette,
  Star,
  Timer,
  Trophy
} from "lucide-react";

const ICONS = {
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  gamepad: Gamepad2,
  dumbbell: Dumbbell,
  music: Music,
  code: Code2,
  palette: Palette,
  heart: Heart,
  star: Star,
  lightbulb: Lightbulb,
  timer: Timer,
  trophy: Trophy
};

export type BubbleIconName = keyof typeof ICONS;

export function BubbleIcon({
  name,
  size = 28,
  strokeWidth = 1.9
}: {
  name?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = ICONS[(name as BubbleIconName) || "book"] ?? BookOpen;
  return <Icon size={size} strokeWidth={strokeWidth} />;
}
