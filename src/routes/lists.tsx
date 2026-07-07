import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, EmptyState } from "@/components/twogether/primitives";

export const Route = createFileRoute("/lists")({
  component: ListsPlaceholder,
});

function ListsPlaceholder() {
  return (
    <div>
      <AppHeader title="Lists" subtitle="Groceries, tasks, wishlists" />
      <EmptyState emoji="🧺" line="Shared lists, tasks, and wishlists land here." />
    </div>
  );
}
