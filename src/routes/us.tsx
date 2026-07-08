import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { PillTabs, PairedAvatar, Chip } from "@/components/twogether/primitives";
import { getCouple } from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import { Moments } from "@/components/twogether/us/Moments";
import { Rituals } from "@/components/twogether/us/Rituals";
import { Occasions } from "@/components/twogether/us/Occasions";
import { UsStats } from "@/components/twogether/us/UsStats";

type Tab = "moments" | "rituals" | "occasions" | "stats";

export const Route = createFileRoute("/us")({
  component: UsPage,
  head: () => ({
    meta: [
      { title: "Us · Twogether" },
      { name: "description", content: "The story you're writing together — moments, rituals, and occasions." },
    ],
  }),
});

function UsPage() {
  const [tab, setTab] = useState<Tab>("moments");
  const { currentUser, partner } = useCurrentUser();
  const coupleQ = useQuery({ queryKey: ["couple"], queryFn: getCouple });

  const anniv = coupleQ.data?.anniversary;
  const started = coupleQ.data?.startedAt;

  const countdown = useMemo(() => {
    if (!anniv) return null;
    // next anniversary from today
    const today = new Date();
    let next = parseISO(anniv);
    if (next < today) next = new Date(next.setFullYear(today.getFullYear() + 1));
    const days = differenceInCalendarDays(next, today);
    return days;
  }, [anniv]);

  const yearsTogether = useMemo(() => {
    if (!started) return 0;
    return Math.max(1, Math.floor(differenceInCalendarDays(new Date(), parseISO(started)) / 365));
  }, [started]);
  const yearsMarried = useMemo(() => {
    if (!anniv) return 0;
    const a = parseISO(anniv);
    const now = new Date();
    let y = now.getFullYear() - a.getFullYear();
    if (now < new Date(now.getFullYear(), a.getMonth(), a.getDate())) y -= 1;
    return Math.max(1, y);
  }, [anniv]);

  const aEmoji = (currentUser.id === "aarav" ? currentUser : partner).avatarEmoji;
  const mEmoji = (currentUser.id === "meera" ? currentUser : partner).avatarEmoji;

  return (
    <div className="pb-24">
      {/* Header couple card */}
      <div className="px-4 pt-3">
        <div
          className="relative overflow-hidden rounded-[24px] border border-[color:var(--line)]/60 p-4"
          style={{
            background:
              "linear-gradient(135deg, var(--blush) 0%, #F7E6DE 45%, #E4EEE9 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <PairedAvatar a={aEmoji} b={mEmoji} size={52} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[22px] font-bold leading-tight text-[color:var(--ink)]">
                Aarav &amp; Meera
              </h1>
              <p className="mt-0.5 text-[13px] text-[color:var(--ink-soft)]">
                Together {yearsTogether} years · Married {yearsMarried} 💛
              </p>
            </div>
          </div>
          {countdown !== null && (
            <div className="mt-3 flex items-center justify-between">
              <Chip tone="gold">💍 Anniversary in {countdown} days</Chip>
              <span className="text-[11.5px] text-[color:var(--ink-soft)]">
                9 Dec · year {yearsMarried + 1}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar overflow-x-auto px-4 pb-2 pt-3">
        <PillTabs<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "moments",   label: "Moments" },
            { value: "rituals",   label: "Rituals" },
            { value: "occasions", label: "Occasions" },
            { value: "stats",     label: "Us stats" },
          ]}
        />
      </div>

      <div className="mt-1 animate-[fade-in_220ms_ease-out]" key={tab}>
        {tab === "moments"   && <Moments />}
        {tab === "rituals"   && <Rituals />}
        {tab === "occasions" && <Occasions />}
        {tab === "stats"     && <UsStats />}
      </div>
    </div>
  );
}
