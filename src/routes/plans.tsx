import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, EmptyState } from "@/components/twogether/primitives";

export const Route = createFileRoute("/plans")({
  component: PlansPlaceholder,
});

function PlansPlaceholder() {
  return (
    <div>
      <AppHeader title="Plans" subtitle="Dates, trips, and occasions" />
      <EmptyState emoji="🗓️" line="Calendar, date ideas, and Bali trip land here." />
    </div>
  );
}
