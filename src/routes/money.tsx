import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, EmptyState } from "@/components/twogether/primitives";

export const Route = createFileRoute("/money")({
  component: MoneyPlaceholder,
});

function MoneyPlaceholder() {
  return (
    <div>
      <AppHeader title="Money" subtitle="Together, kindly" />
      <EmptyState emoji="🪙" line="Accounts, budgets, and goals land here in Section 2." />
    </div>
  );
}
