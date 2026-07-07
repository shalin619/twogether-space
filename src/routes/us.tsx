import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, EmptyState } from "@/components/twogether/primitives";

export const Route = createFileRoute("/us")({
  component: UsPlaceholder,
});

function UsPlaceholder() {
  return (
    <div>
      <AppHeader title="Us" subtitle="The story you're writing" />
      <EmptyState emoji="💞" line="Memories, gratitude, and daily questions land here." />
    </div>
  );
}
