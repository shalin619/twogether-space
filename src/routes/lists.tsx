import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, PillTabs } from "@/components/twogether/primitives";
import { Wishlists } from "@/components/twogether/lists/Wishlists";
import { Grocery }   from "@/components/twogether/lists/Grocery";
import { More }      from "@/components/twogether/lists/More";

type Tab = "wishlists" | "grocery" | "more";

export const Route = createFileRoute("/lists")({
  component: ListsPage,
  head: () => ({
    meta: [
      { title: "Lists · Twogether" },
      { name: "description", content: "Wishlists, groceries, and shared lists for the two of you." },
    ],
  }),
});

function ListsPage() {
  const [tab, setTab] = useState<Tab>("wishlists");
  return (
    <div>
      <AppHeader title="Lists" subtitle="Wishlists, groceries & more" />
      <div className="no-scrollbar overflow-x-auto px-4 pb-2">
        <PillTabs<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "wishlists", label: "Wishlists" },
            { value: "grocery",   label: "Grocery" },
            { value: "more",      label: "More" },
          ]}
        />
      </div>
      <div className="mt-2 animate-[fade-in_220ms_ease-out]" key={tab}>
        {tab === "wishlists" && <Wishlists />}
        {tab === "grocery"   && <Grocery />}
        {tab === "more"      && <More />}
      </div>
    </div>
  );
}
