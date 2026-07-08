import { toast } from "sonner";

// Universal placeholder for any UI affordance that isn't wired to a real
// action yet. Guarantees zero silent buttons — every tap has feedback.
export function comingSoon(label?: string) {
  toast("Coming soon in your space ✨", {
    description: label,
    duration: 2200,
  });
}
