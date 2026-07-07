import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, Card } from "@/components/twogether/primitives";
import { useCurrentUser } from "@/lib/currentUser";

export const Route = createFileRoute("/")({
  component: HomePlaceholder,
});

function HomePlaceholder() {
  const { currentUser, partner } = useCurrentUser();
  return (
    <div>
      <AppHeader
        title={`Good morning, ${currentUser.name}`}
        subtitle={`You & ${partner.name}`}
        right={
          <span
            className="grid h-10 w-10 place-items-center rounded-full text-lg"
            style={{ background: "var(--blush)" }}
          >
            {currentUser.avatarEmoji}
          </span>
        }
      />
      <div className="px-4">
        <Card>
          <p className="font-display text-[18px] font-bold text-[color:var(--ink)]">
            Home feed coming next
          </p>
          <p className="mt-1 text-[13.5px] text-[color:var(--ink-soft)]">
            Section 1 is scaffolded: theme, shared components, bottom nav, FAB with quick-add,
            mock data + service layer, and the dev A/M toggle (bottom-left).
          </p>
        </Card>
      </div>
    </div>
  );
}
