import { useEffect, useMemo, useRef, useState } from "react";

// Lightweight canvas-free confetti using absolutely-positioned spans.
// Fires once per key (persisted via sessionStorage). Respects reduced motion.
export function Confetti({ fireKey, count = 24 }: { fireKey: string; count?: number }) {
  const [pieces, setPieces] = useState<
    { id: number; left: number; delay: number; rot: number; color: string; size: number }[]
  >([]);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let seen = false;
    try { seen = sessionStorage.getItem(`confetti:${fireKey}`) === "1"; } catch { /* */ }
    if (seen) return;
    fired.current = true;
    try { sessionStorage.setItem(`confetti:${fireKey}`, "1"); } catch { /* */ }

    const colors = ["#E2725B", "#4E8D7C", "#D9A441", "#F6E7E1"];
    const next = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 200,
      rot: Math.random() * 360,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 6,
    }));
    setPieces(next);
    const t = window.setTimeout(() => setPieces([]), 2200);
    return () => window.clearTimeout(t);
  }, [fireKey, count]);

  if (!pieces.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            animation: `twogether-confetti 1600ms ${p.delay}ms cubic-bezier(0.2,0.6,0.2,1) forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes twogether-confetti {
          0%   { transform: translate3d(0,-10px,0) rotate(0deg);   opacity: 1; }
          100% { transform: translate3d(0,140px,0) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
