// components/story/story-reader.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { StoryGraph } from "@/lib/stories/graph";
import { recordEnding } from "@/lib/stories/actions";
import { EndingScreen } from "@/components/story/ending-screen";
import { Button } from "@/components/ui/button";

export function StoryReader({
  slug,
  startKey,
  graph,
}: {
  slug: string;
  startKey: string;
  graph: StoryGraph;
}) {
  const searchParams = useSearchParams();
  const urlKey = searchParams.get("p");
  const initialKey = urlKey && graph.pages[urlKey] ? urlKey : startKey;

  const [currentKey, setCurrentKey] = useState(initialKey);
  const [progress, setProgress] = useState<{ found: number; total: number } | null>(null);

  const current = graph.pages[currentKey] ?? graph.pages[startKey];

  // Keep the URL in sync (shallow) so refresh/bookmark restores position.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("p", currentKey);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [currentKey, searchParams]);

  // When we land on an ending, record it.
  useEffect(() => {
    if (current.isEnding) {
      recordEnding(slug, current.key).then((p) => {
        if (p) setProgress(p);
      });
    }
  }, [current.isEnding, current.key, slug]);

  const goTo = useCallback((key: string) => {
    setProgress(null);
    setCurrentKey(key);
  }, []);

  const readAgain = useCallback(() => goTo(startKey), [goTo, startKey]);

  if (current.isEnding) {
    return (
      <EndingScreen
        endingLabel={current.endingLabel}
        progress={progress}
        onReadAgain={readAgain}
      />
    );
  }

  return (
    <article className="space-y-8">
      <p className="text-xl leading-relaxed whitespace-pre-line">{current.body}</p>
      <div className="flex flex-col gap-3">
        {current.choices.map((c, i) => (
          <Button
            key={`${c.to}-${i}`}
            size="lg"
            variant="secondary"
            className="justify-start text-left h-auto py-4 text-lg whitespace-normal"
            onClick={() => goTo(c.to)}
          >
            {c.label}
          </Button>
        ))}
      </div>
    </article>
  );
}
