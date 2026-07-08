import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, ShoppingBag, Check } from "lucide-react";
import { Chip, SkeletonCard, EmptyState } from "@/components/twogether/primitives";
import { addListItem, getListItems, toggleListItem } from "@/data/service";
import type { ListItem } from "@/data/types";
import { cn } from "@/lib/utils";

const GROC_LIST = "l_groc";

export function Grocery() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["listItems"], queryFn: getListItems });
  const items = (q.data ?? []).filter((i) => i.listId === GROC_LIST);
  const [shopping, setShopping] = useState(false);
  const [input, setInput] = useState("");
  const gingerFiredRef = useRef(false);

  // Fake realtime: 3s after entering shopping mode, Meera adds ginger
  useEffect(() => {
    if (!shopping || gingerFiredRef.current) return;
    const alreadyHasGinger = items.some(
      (i) => i.title.toLowerCase() === "ginger" && !i.done,
    );
    if (alreadyHasGinger) return;
    const t = setTimeout(async () => {
      gingerFiredRef.current = true;
      await addListItem({
        listId: GROC_LIST, title: "Ginger", aisle: "Produce", addedBy: "meera",
      });
      await qc.invalidateQueries({ queryKey: ["listItems"] });
      toast("Meera added ginger just now 🫚", { description: "Live sync" });
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopping]);

  const active   = items.filter((i) => !i.done);
  const done     = items.filter((i) =>  i.done);
  const usuals   = items.filter((i) => i.favorite);
  const byAisle  = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    active.forEach((i) => {
      const k = i.aisle ?? "Other";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(i);
    });
    return Array.from(map.entries());
  }, [active]);

  async function toggle(id: string) {
    await toggleListItem(id);
    await qc.invalidateQueries({ queryKey: ["listItems"] });
  }
  async function add(title: string) {
    if (!title.trim()) return;
    await addListItem({ listId: GROC_LIST, title: title.trim(), aisle: "Other", addedBy: "aarav" });
    setInput("");
    await qc.invalidateQueries({ queryKey: ["listItems"] });
  }
  async function reAddUsual(item: ListItem) {
    if (active.some((i) => i.title === item.title)) {
      toast("Already on the list ✓");
      return;
    }
    await addListItem({
      listId: GROC_LIST, title: item.title, aisle: item.aisle,
      favorite: true, addedBy: "aarav",
    });
    await qc.invalidateQueries({ queryKey: ["listItems"] });
  }

  if (q.isLoading) {
    return (
      <div className="flex flex-col gap-2 px-4 pb-24">
        <SkeletonCard height={40} /><SkeletonCard height={40} />
        <SkeletonCard height={40} /><SkeletonCard height={40} />
      </div>
    );
  }

  return (
    <div className={cn(
      "pb-32 transition-colors",
      shopping && "bg-[#F0F5F1]",
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2">
        {shopping ? (
          <div className="flex-1">
            <div className="text-[13px] font-semibold uppercase tracking-wide text-[color:var(--accent-2)]">
              Shopping mode
            </div>
            <div className="font-display text-[24px] font-bold text-[color:var(--ink)]">
              {done.length} of {items.length}
            </div>
          </div>
        ) : (
          <span className="section-header">🛒 Groceries · {active.length} left</span>
        )}
        <button
          onClick={() => setShopping((s) => !s)}
          className={cn(
            "flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors",
            shopping
              ? "bg-[color:var(--accent-2)] text-white"
              : "bg-[color:var(--mist)] text-[color:var(--ink)]",
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {shopping ? "Exit" : "Shopping mode"}
        </button>
      </div>

      {/* Usuals */}
      {!shopping && usuals.length > 0 && (
        <div className="px-4 pb-3">
          <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">Usuals</div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {usuals.map((u) => (
              <button
                key={u.id}
                onClick={() => reAddUsual(u)}
                className="flex min-h-[36px] shrink-0 items-center gap-1 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[12.5px] font-semibold text-[color:var(--ink)]"
              >
                <Plus className="h-3 w-3" /> {u.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aisle groups */}
      {active.length === 0 ? (
        <EmptyState emoji="🧺" line="List's empty. Add what you need below." />
      ) : (
        <div className="flex flex-col gap-4 px-4">
          {byAisle.map(([aisle, list]) => (
            <div key={aisle}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wide text-[color:var(--ink-soft)]">{aisle}</span>
                <div className="h-px flex-1 bg-[color:var(--line)]" />
              </div>
              <ul className="flex flex-col gap-1">
                {list.map((i) => (
                  <GroceryRow key={i.id} item={i} big={shopping} onToggle={() => toggle(i.id)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Done collapse */}
      {done.length > 0 && (
        <details className="mx-4 mt-4 rounded-2xl border border-[color:var(--line)]/60 bg-[color:var(--surface)]">
          <summary className="cursor-pointer list-none px-3 py-2 text-[12.5px] font-semibold text-[color:var(--ink-soft)]">
            Done ({done.length})
          </summary>
          <ul className="border-t border-[color:var(--line)] p-1">
            {done.map((i) => (
              <GroceryRow key={i.id} item={i} big={false} onToggle={() => toggle(i.id)} />
            ))}
          </ul>
        </details>
      )}

      {/* Input pinned bottom */}
      <div
        className="fixed bottom-16 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-[color:var(--line)] bg-[color:var(--surface)]/95 px-4 py-2 backdrop-blur"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); add(input); }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add item… e.g. Curd"
            className="min-h-[44px] flex-1 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-[13.5px]"
          />
          <button
            type="submit"
            className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--ink)] text-white"
            aria-label="Add"
          >
            <Plus className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function GroceryRow({
  item, big, onToggle,
}: { item: ListItem; big: boolean; onToggle: () => void }) {
  const [pop, setPop] = useState(false);
  return (
    <li className={cn(
      "flex items-center gap-3 rounded-xl px-2 transition-colors",
      big ? "py-3" : "py-2",
      item.done && "opacity-60",
    )}>
      <button
        onClick={() => { setPop(true); setTimeout(() => setPop(false), 260); onToggle(); }}
        className={cn(
          "grid shrink-0 place-items-center rounded-full border-2 transition-all",
          big ? "h-8 w-8" : "h-7 w-7",
          item.done
            ? "border-[color:var(--accent-2)] bg-[color:var(--accent-2)] text-white"
            : "border-[color:var(--line)] bg-[color:var(--surface)]",
          pop && "scale-125",
        )}
        aria-label={item.done ? "Uncheck" : "Check"}
      >
        {item.done && <Check className="h-4 w-4" />}
      </button>
      <div className={cn(
        "flex-1 truncate",
        big ? "text-[16px]" : "text-[14px]",
        item.done && "line-through text-[color:var(--ink-soft)]",
      )}>
        {item.title}
        {item.qty && <span className="ml-1.5 text-[11.5px] text-[color:var(--ink-soft)]">· {item.qty}</span>}
      </div>
      {item.favorite && !item.done && <Chip tone="gold">★</Chip>}
    </li>
  );
}
