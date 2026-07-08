import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, PillTabs } from "@/components/twogether/primitives";
import { Calendar }  from "@/components/twogether/plans/Calendar";
import { Dates }     from "@/components/twogether/plans/Dates";
import { Trips }     from "@/components/twogether/plans/Trips";
import { Reminders } from "@/components/twogether/plans/Reminders";

type Tab = "calendar" | "dates" | "trips" | "reminders";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
  head: () => ({
    meta: [
      { title: "Plans · Twogether" },
      { name: "description", content: "Shared calendar, date ideas, trips, and reminders." },
    ],
  }),
});

function PlansPage() {
  const [tab, setTab] = useState<Tab>("calendar");
  return (
    <div>
      <AppHeader title="Plans" subtitle="Calendar · Dates · Trips · Reminders" />
      <div className="no-scrollbar overflow-x-auto px-4 pb-2">
        <PillTabs<Tab>
          value={tab} onChange={setTab}
          options={[
            { value: "calendar",  label: "Calendar" },
            { value: "dates",     label: "Dates" },
            { value: "trips",     label: "Trips" },
            { value: "reminders", label: "Reminders" },
          ]}
        />
      </div>
      <div className="mt-2 animate-[fade-in_220ms_ease-out]" key={tab}>
        {tab === "calendar"  && <Calendar />}
        {tab === "dates"     && <Dates />}
        {tab === "trips"     && <Trips />}
        {tab === "reminders" && <Reminders />}
      </div>
    </div>
  );
}
