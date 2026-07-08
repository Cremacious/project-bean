// components/story/ending-screen.tsx
"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export function EndingScreen({
  endingLabel,
  progress,
  onReadAgain,
}: {
  endingLabel: string | null;
  progress: { found: number; total: number } | null;
  onReadAgain: () => void;
}) {
  return (
    <div className="text-center space-y-6 py-10">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">The End</p>
      {endingLabel && <h2 className="text-3xl font-semibold">{endingLabel}</h2>}
      {progress && (
        <p className="text-lg">
          You&apos;ve found <strong>{progress.found}</strong> of{" "}
          <strong>{progress.total}</strong> endings!
        </p>
      )}
      <div className="flex items-center justify-center gap-3">
        <Button onClick={onReadAgain}>Read again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to library
        </Link>
      </div>
    </div>
  );
}
