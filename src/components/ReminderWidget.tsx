import { useState, useEffect } from "react";
import { store } from "@/lib/store";
import { Reminder } from "@/lib/types";
import { Bell, X, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, total: diff };
}

function formatCountdown(t: { days: number; hours: number; mins: number; secs: number }) {
  if (t.days > 0) return `${t.days}দিন ${t.hours}ঘ ${t.mins}মি`;
  if (t.hours > 0) return `${t.hours}ঘ ${t.mins}মি ${t.secs}সে`;
  return `${t.mins}মি ${t.secs}সে`;
}

const ReminderWidget = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0);
  const { toast } = useToast();

  // Load and clean expired reminders
  useEffect(() => {
    const sync = () => {
      const all = store.getReminders();
      const now = Date.now();
      const expired = all.filter((r) => new Date(r.targetDate).getTime() <= now);
      const active = all.filter((r) => new Date(r.targetDate).getTime() > now);

      if (expired.length > 0) {
        expired.forEach((r) => {
          toast({ title: `⏰ রিমাইন্ডার শেষ!`, description: r.title });
        });
        store.setReminders(active);
      }
      setReminders(active);
    };
    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, []);

  // Countdown tick
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const visible = reminders.filter((r) => !dismissed.has(r.id));
  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 max-w-[280px]">
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg hover:shadow-xl transition-all"
      >
        <Bell size={14} />
        {visible.length} রিমাইন্ডার
        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="flex flex-col gap-2 w-full animate-fade-in">
          {visible.map((r) => {
            const timeLeft = getTimeLeft(r.targetDate);
            if (!timeLeft) return null;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-lg overflow-hidden"
              >
                <div
                  className="h-1"
                  style={{ backgroundColor: r.color || "hsl(var(--primary))" }}
                />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{r.title}</p>
                      {r.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setDismissed((prev) => new Set(prev).add(r.id))}
                      className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <X size={12} className="text-muted-foreground" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="text-[11px] font-bold px-2 py-1 rounded-lg"
                      style={{
                        backgroundColor: `${r.color || "hsl(var(--primary))"}20`,
                        color: r.color || "hsl(var(--primary))",
                      }}
                    >
                      ⏳ {formatCountdown(timeLeft)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.targetDate).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReminderWidget;
