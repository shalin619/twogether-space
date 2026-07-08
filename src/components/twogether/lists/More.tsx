import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Clock, Check, ListPlus } from "lucide-react";
import { Card, Chip, SkeletonCard, EmptyState } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import {
  addList, addListItem, getListItems, getLists, getRecipes, toggleListItem,
} from "@/data/service";
import type { Recipe } from "@/data/types";
import { cn } from "@/lib/utils";

const GROC_LIST = "l_groc";
const MOVIES_LIST = "l_movies";

export function More() {
  const qc = useQueryClient();
  const recipesQ = useQuery({ queryKey: ["recipes"],   queryFn: getRecipes });
  const itemsQ   = useQuery({ queryKey: ["listItems"], queryFn: getListItems });
  const listsQ   = useQuery({ queryKey: ["lists"],     queryFn: getLists });

  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const movies = (itemsQ.data ?? []).filter((i) => i.listId === MOVIES_LIST);
  const customLists = (listsQ.data ?? []).filter(
    (l) => l.id !== GROC_LIST && l.id !== MOVIES_LIST && l.kind !== "todo",
  );

  async function toggleMovie(id: string) {
    await toggleListItem(id);
    await qc.invalidateQueries({ queryKey: ["listItems"] });
  }

  async function addRecipeToGrocery(r: Recipe) {
    const existing = new Set(
      (itemsQ.data ?? [])
        .filter((i) => i.listId === GROC_LIST && !i.done)
        .map((i) => i.title.toLowerCase()),
    );
    let added = 0;
    for (const ing of r.ingredients ?? []) {
      if (existing.has(ing.toLowerCase())) continue;
      await addListItem({
        listId: GROC_LIST, title: ing, aisle: "Recipe", addedBy: "aarav",
      });
      added++;
    }
    await qc.invalidateQueries({ queryKey: ["listItems"] });
    toast(`Added ${added} ingredients to groceries 🛒`, {
      description: r.title,
    });
    setOpenRecipe(null);
  }

  async function createList() {
    if (!newListName.trim()) return;
    await addList({ name: newListName.trim(), emoji: "📝", kind: "custom" });
    setNewListName("");
    setNewListOpen(false);
    await qc.invalidateQueries({ queryKey: ["lists"] });
    toast("List created ✨");
  }

  return (
    <div className="pb-24">
      {/* Recipes */}
      <div className="px-4 pb-2 pt-1">
        <span className="section-header">Recipes</span>
      </div>
      {recipesQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          <SkeletonCard height={180} /><SkeletonCard height={180} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {(recipesQ.data ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => setOpenRecipe(r)}
              className="overflow-hidden rounded-[20px] border border-[color:var(--line)]/60 bg-[color:var(--surface)] card-shadow text-left"
            >
              {r.image ? (
                <div className="aspect-[4/3] overflow-hidden bg-[color:var(--mist)]">
                  <img src={r.image} alt={r.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-[color:var(--mist)] text-4xl">{r.emoji}</div>
              )}
              <div className="p-2.5">
                <div className="line-clamp-1 text-[13px] font-bold text-[color:var(--ink)]">{r.emoji} {r.title}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[color:var(--ink-soft)]">
                  <Clock className="h-3 w-3" /> {r.minutes} min
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Movies together */}
      <div className="px-4 pb-2 pt-5">
        <span className="section-header">🎬 Movies together</span>
      </div>
      {movies.length === 0 ? (
        <EmptyState emoji="🍿" line="Nothing on the watchlist yet." />
      ) : (
        <div className="mx-4 flex flex-col gap-1 rounded-[20px] border border-[color:var(--line)]/60 bg-[color:var(--surface)] p-2">
          {movies.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleMovie(m.id)}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left",
                m.done && "opacity-60",
              )}
            >
              <span className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                m.done ? "border-[color:var(--accent-2)] bg-[color:var(--accent-2)] text-white" : "border-[color:var(--line)]",
              )}>
                {m.done && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className={cn("flex-1 text-[14px]", m.done && "line-through text-[color:var(--ink-soft)]")}>{m.title}</span>
              {m.done && <Chip tone="success">watched</Chip>}
            </button>
          ))}
        </div>
      )}

      {/* Custom lists */}
      {customLists.length > 0 && (
        <>
          <div className="px-4 pb-2 pt-5"><span className="section-header">Your lists</span></div>
          <div className="mx-4 flex flex-col gap-2">
            {customLists.map((l) => (
              <Card key={l.id} className="flex items-center gap-3 p-3">
                <span className="text-2xl">{l.emoji}</span>
                <span className="flex-1 text-[14px] font-semibold text-[color:var(--ink)]">{l.name}</span>
                <Chip tone="neutral">{l.kind}</Chip>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* New list */}
      <div className="px-4 pt-5">
        <button
          onClick={() => setNewListOpen(true)}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-dashed border-[color:var(--line)] text-[13px] font-semibold text-[color:var(--ink-soft)]"
        >
          <ListPlus className="h-4 w-4" /> New list
        </button>
      </div>

      {/* Recipe sheet */}
      <BottomSheet
        open={!!openRecipe}
        onClose={() => setOpenRecipe(null)}
        title={openRecipe?.title}
        primaryCta={
          openRecipe && (
            <button
              onClick={() => addRecipeToGrocery(openRecipe)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--ink)] text-[14px] font-bold text-white"
            >
              <Plus className="h-4 w-4" /> Add ingredients to grocery
            </button>
          )
        }
      >
        {openRecipe && (
          <div>
            {openRecipe.image && (
              <img src={openRecipe.image} alt="" className="mb-3 h-40 w-full rounded-2xl object-cover" />
            )}
            <div className="mb-3 flex items-center gap-2 text-[12.5px] text-[color:var(--ink-soft)]">
              <Clock className="h-3.5 w-3.5" /> {openRecipe.minutes} min
              <span>·</span>
              {openRecipe.tags?.map((t) => <Chip key={t} tone="neutral">{t}</Chip>)}
            </div>
            <div className="mb-2 text-[13px] font-bold text-[color:var(--ink)]">Ingredients</div>
            <ul className="space-y-1">
              {(openRecipe.ingredients ?? []).map((ing) => (
                <li key={ing} className="flex items-center gap-2 text-[13.5px] text-[color:var(--ink)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-2)]" /> {ing}
                </li>
              ))}
            </ul>
          </div>
        )}
      </BottomSheet>

      {/* New list sheet */}
      <BottomSheet
        open={newListOpen}
        onClose={() => setNewListOpen(false)}
        title="New list"
        primaryCta={
          <button
            onClick={createList}
            disabled={!newListName.trim()}
            className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[color:var(--ink)] text-[14px] font-bold text-white disabled:opacity-50"
          >
            Create
          </button>
        }
      >
        <input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="e.g. Home improvement"
          className="min-h-[44px] w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-[14px]"
        />
      </BottomSheet>
    </div>
  );
}
