import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Plus, Check } from "lucide-react";
import { Card, Chip, SkeletonCard, EmptyState } from "@/components/twogether/primitives";
import { addTask, getTasks, toggleTask } from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import type { OwnerId, Task } from "@/data/types";
import { cn } from "@/lib/utils";

const TEMPLATES: { label: string; days: number }[] = [
  { label: "Insurance renewal", days: 30 },
  { label: "Car service",       days: 21 },
  { label: "Health checkup",    days: 14 },
  { label: "Lease renewal",     days: 60 },
];

export function Reminders() {
  const qc = useQueryClient();
  const { currentUserId, partner } = useCurrentUser();
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: getTasks });

  const tasks = tasksQ.data ?? [];
  const groups = useMemo(() => {
    const mine: Task[] = [], partners: Task[] = [], ours: Task[] = [];
    tasks.forEach((t) => {
      if (t.assignee === "ours" || t.assignee === "rotating") ours.push(t);
      else if (t.assignee === currentUserId) mine.push(t);
      else partners.push(t);
    });
    return { mine, partners, ours };
  }, [tasks, currentUserId]);

  async function toggle(id: string) {
    await toggleTask(id);
    await qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  async function createFromTemplate(label: string, days: number) {
    const due = new Date();
    due.setDate(due.getDate() + days);
    await addTask({
      title: label,
      assignee: "ours",
      dueDate: due.toISOString(),
      recurring: "yearly",
      status: "todo",
    });
    await qc.invalidateQueries({ queryKey: ["tasks"] });
    toast(`${label} added — due in ${days} days ⏰`);
  }

  if (tasksQ.isLoading) {
    return (
      <div className="flex flex-col gap-2 px-4">
        <SkeletonCard height={60} /><SkeletonCard height={60} /><SkeletonCard height={60} />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Template chips */}
      <div className="px-4 pb-2">
        <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">Quick templates</div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {TEMPLATES.map((t) => (
            <button key={t.label} onClick={() => createFromTemplate(t.label, t.days)}
              className="flex min-h-[36px] shrink-0 items-center gap-1 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[12.5px] font-semibold text-[color:var(--ink)]">
              <Plus className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <Group title="Mine"       list={groups.mine}     onToggle={toggle} viewer={currentUserId} partnerName={partner.name} />
      <Group title={`${partner.name}'s`} list={groups.partners} onToggle={toggle} viewer={currentUserId} partnerName={partner.name} />
      <Group title="Ours"       list={groups.ours}     onToggle={toggle} viewer={currentUserId} partnerName={partner.name} />

      {tasks.length === 0 && (
        <EmptyState emoji="⏰" line="Nothing pending. Golden." />
      )}
    </div>
  );
}

function Group({
  title, list, onToggle, viewer, partnerName,
}: {
  title: string; list: Task[]; onToggle: (id: string) => void;
  viewer: OwnerId; partnerName: string;
}) {
  if (list.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="px-4 pb-2"><span className="section-header">{title}</span></div>
      <div className="mx-4 flex flex-col gap-2">
        {list.map((t) => {
          const waitingOnPartner = t.assignee !== "ours" && t.assignee !== "rotating"
            && t.assignee !== viewer && t.status === "waiting";
          return (
            <Card key={t.id} className="flex items-center gap-3 p-3">
              <button onClick={() => onToggle(t.id)}
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2",
                  t.done ? "border-[color:var(--accent-2)] bg-[color:var(--accent-2)] text-white" : "border-[color:var(--line)]",
                )}
                aria-label={t.done ? "Uncheck" : "Check"}
              >
                {t.done && <Check className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={cn("text-[13.5px] font-semibold text-[color:var(--ink)]", t.done && "line-through text-[color:var(--ink-soft)]")}>
                  {t.title}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-[color:var(--ink-soft)]">
                  {t.dueDate && <span>Due {format(parseISO(t.dueDate), "MMM d")}</span>}
                  {t.recurring && <span>· {t.recurring}</span>}
                  {t.assignee === "rotating" && t.rotation && <span>· 🔁 {t.rotation}'s turn</span>}
                </div>
              </div>
              {waitingOnPartner && (
                <Chip tone="caution">Waiting for {partnerName} ⏳</Chip>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// wrong import guard removed – keep Chip typing tight
function _typesCheck(x: OwnerId) { return x; }
void _typesCheck;
