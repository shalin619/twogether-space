import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, PillTabs } from "@/components/twogether/primitives";
import { Overview } from "@/components/twogether/money/Overview";
import { Activity } from "@/components/twogether/money/Activity";
import { Budgets } from "@/components/twogether/money/Budgets";
import { Goals }   from "@/components/twogether/money/Goals";
import { Bills }   from "@/components/twogether/money/Bills";

type Tab = "overview" | "activity" | "budgets" | "goals" | "bills";

export const Route = createFileRoute("/money")({
  component: MoneyPage,
});

function MoneyPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div>
      <AppHeader title="Money" subtitle="Together, kindly" />
      <div className="no-scrollbar overflow-x-auto px-4 pb-2">
        <PillTabs<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "activity", label: "Activity" },
            { value: "budgets",  label: "Budgets" },
            { value: "goals",    label: "Goals" },
            { value: "bills",    label: "Bills" },
          ]}
        />
      </div>

      <div className="mt-2 animate-[fade-in_220ms_ease-out]" key={tab}>
        {tab === "overview" && <Overview />}
        {tab === "activity" && <Activity />}
        {tab === "budgets"  && <Budgets />}
        {tab === "goals"    && <Goals />}
        {tab === "bills"    && <Bills />}
      </div>
    </div>
  );
}
