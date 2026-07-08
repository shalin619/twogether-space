import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BottomSheet } from "./BottomSheet";
import { AddExpenseSheet } from "./money/AddExpenseSheet";
import { AddWishlistSheet } from "./lists/Wishlists";
import { SaveIdeaSheet }    from "./plans/Dates";
import {
  addWishlistItem, addDateIdea, addTask, addBill,
} from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import { cn } from "@/lib/utils";

type Kind = null | "expense" | "wishlist" | "date" | "task" | "reminder";

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<Kind>(null);
  const qc = useQueryClient();
  const { currentUserId } = useCurrentUser();

  const rows: { k: Exclude<Kind, null>; icon: string; title: string; hint: string }[] = [
    { k: "expense",  icon: "💸", title: "Expense",       hint: "Log a transaction" },
    { k: "wishlist", icon: "🎁", title: "Wishlist item", hint: "Add to your wishlist" },
    { k: "date",     icon: "💞", title: "Date idea",     hint: "Save one for later" },
    { k: "task",     icon: "✅", title: "Task",          hint: "Assign to you or partner" },
    { k: "reminder", icon: "⏰", title: "Reminder",      hint: "Bill, occasion, anything" },
  ];

  const closeAll = () => { setKind(null); onClose(); };

  return (
    <>
      <BottomSheet open={open && kind === null} onClose={onClose} title="Quick add">
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.k}>
              <button
                onClick={() => setKind(r.k)}
                className="flex w-full min-h-14 items-center gap-4 rounded-[16px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-left transition-transform duration-[180ms] active:scale-[0.98] active:bg-[color:var(--mist)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--blush)] text-xl">
                  {r.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-bold text-[color:var(--ink)]">{r.title}</span>
                  <span className="block text-[12.5px] text-[color:var(--ink-soft)]">{r.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>

      {/* Delegate to real sheets */}
      <AddExpenseSheet    open={kind === "expense"}  onClose={closeAll} />
      <AddWishlistSheet
        open={kind === "wishlist"}
        onClose={() => setKind(null)}
        onAdd={async (p) => {
          await addWishlistItem({ ...p, ownerId: "ours" });
          qc.invalidateQueries({ queryKey: ["wishlist"] });
          toast.success("Added to Ours wishlist 🎁");
          closeAll();
        }}
      />
      <SaveIdeaSheet
        open={kind === "date"}
        onClose={() => setKind(null)}
        onAdd={async (p) => {
          await addDateIdea(p);
          qc.invalidateQueries({ queryKey: ["dateIdeas"] });
          toast.success("Date idea saved 💞");
          closeAll();
        }}
      />

      <MiniTaskSheet
        open={kind === "task"}
        onClose={() => setKind(null)}
        defaultAssignee={currentUserId}
        onSubmit={async (payload) => {
          await addTask(payload);
          qc.invalidateQueries({ queryKey: ["tasks"] });
          toast.success("Task added ✅");
          closeAll();
        }}
      />

      <MiniReminderSheet
        open={kind === "reminder"}
        onClose={() => setKind(null)}
        onSubmit={async (payload) => {
          await addBill(payload);
          qc.invalidateQueries({ queryKey: ["bills"] });
          toast.success("Reminder set ⏰");
          closeAll();
        }}
      />
    </>
  );
}

function MiniTaskSheet({
  open, onClose, defaultAssignee, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultAssignee: "aarav" | "meera";
  onSubmit: (t: { title: string; assignee: "aarav" | "meera" | "ours"; dueDate?: string; status?: "todo" }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState<"aarav" | "meera" | "ours">(defaultAssignee);
  const [date, setDate] = useState("");
  const opts: { v: "aarav" | "meera" | "ours"; label: string; color: string }[] = [
    { v: defaultAssignee, label: "Me",      color: "var(--accent)" },
    { v: defaultAssignee === "aarav" ? "meera" : "aarav", label: "Partner", color: "var(--accent-2)" },
    { v: "ours",    label: "Ours",    color: "transparent" },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title="New task">
      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          autoFocus
          className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
        />
        <div>
          <div className="mb-1 text-[12px] font-semibold text-[color:var(--ink-soft)]">Assign to</div>
          <div className="inline-flex rounded-full bg-[color:var(--mist)] p-1">
            {opts.map((o) => (
              <button
                key={o.v}
                onClick={() => setAssignee(o.v)}
                className={cn(
                  "min-h-9 rounded-full px-4 text-[12.5px] font-semibold transition-all",
                  assignee === o.v && o.v !== "ours" && "text-white",
                  assignee === o.v && o.v === "ours" && "text-white bg-ours",
                  assignee !== o.v && "text-[color:var(--ink-soft)]",
                )}
                style={assignee === o.v && o.v !== "ours" ? { background: o.color } : undefined}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[12px] font-semibold text-[color:var(--ink-soft)]">Due (optional)</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
          />
        </div>
        <button
          disabled={!title.trim()}
          onClick={async () => {
            await onSubmit({
              title: title.trim(),
              assignee,
              dueDate: date || undefined,
              status: "todo",
            });
            setTitle(""); setDate("");
          }}
          className="w-full min-h-12 rounded-full bg-[color:var(--accent)] text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Add task
        </button>
      </div>
    </BottomSheet>
  );
}

function MiniReminderSheet({
  open, onClose, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (b: { name: string; amount: number; dueDate: string; payer: "joint"; autopay: false; repeat: "monthly" | "yearly" | "none" }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [repeat, setRepeat] = useState<"monthly" | "yearly" | "none">("none");

  return (
    <BottomSheet open={open} onClose={onClose} title="New reminder">
      <div className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What should we remember?"
          autoFocus
          className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 text-[12px] font-semibold text-[color:var(--ink-soft)]">Amount ₹ (optional)</div>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
            />
          </div>
          <div>
            <div className="mb-1 text-[12px] font-semibold text-[color:var(--ink-soft)]">Due</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[12px] font-semibold text-[color:var(--ink-soft)]">Repeat</div>
          <div className="inline-flex rounded-full bg-[color:var(--mist)] p-1">
            {(["none", "monthly", "yearly"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRepeat(r)}
                className={cn(
                  "min-h-9 rounded-full px-4 text-[12.5px] font-semibold transition-colors",
                  repeat === r
                    ? "bg-[color:var(--surface)] text-[color:var(--ink)] shadow-[0_1px_4px_rgba(43,35,64,0.08)]"
                    : "text-[color:var(--ink-soft)]",
                )}
              >
                {r === "none" ? "Once" : r === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>
        <button
          disabled={!name.trim()}
          onClick={async () => {
            await onSubmit({
              name: name.trim(),
              amount: amount ? parseInt(amount) : 0,
              dueDate: date,
              payer: "joint",
              autopay: false,
              repeat,
            });
            setName(""); setAmount("");
          }}
          className="w-full min-h-12 rounded-full bg-[color:var(--accent)] text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Add reminder
        </button>
      </div>
    </BottomSheet>
  );
}
