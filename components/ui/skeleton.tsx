// components/ui/skeleton.tsx
// Brand-styled loading placeholder. A soft Paper Cut line fill that pulses while
// data streams in (issue #9). The pulse is automatically stilled for users who
// prefer reduced motion via the global rule in app/globals.css.
//
// Skeletons are decoration: mark them aria-hidden and let the surrounding
// loading.tsx expose a single role="status" with an accessible label.
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-2xl bg-[var(--pc-line)]", className)}
      {...props}
    />
  );
}
