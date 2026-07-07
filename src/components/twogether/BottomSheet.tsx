import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  primaryCta,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  primaryCta?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50 flex items-end justify-center",
        open && "pointer-events-auto",
      )}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-[rgba(43,35,64,0.35)] transition-opacity duration-[180ms]",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      {/* sheet */}
      <div
        className={cn(
          "relative mx-auto w-full max-w-[430px] rounded-t-[28px] bg-[color:var(--surface)]",
          "transition-transform duration-[220ms] ease-out",
          "flex max-h-[85dvh] flex-col",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        <div className="flex flex-col items-center pt-2">
          <span className="h-1.5 w-10 rounded-full bg-[color:var(--line)]" />
        </div>
        {title && (
          <div className="px-5 pt-3 pb-1">
            <h2 className="font-display text-[20px] font-bold text-[color:var(--ink)]">{title}</h2>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-4 pt-2">{children}</div>
        {primaryCta && (
          <div className="border-t border-[color:var(--line)] bg-[color:var(--surface)] px-5 pt-3">
            {primaryCta}
          </div>
        )}
      </div>
    </div>
  );
}
