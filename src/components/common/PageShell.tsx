import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/appStore";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function PageShell({ title, subtitle, children, action }: PageShellProps) {
  const navigate = useAppStore((state) => state.navigate);

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="page-header">
        <button className="icon-button" onClick={() => navigate("home")} aria-label="返回首页">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="page-action">{action}</div>
      </header>
      {children}
    </main>
  );
}
