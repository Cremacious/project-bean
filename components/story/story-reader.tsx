// components/story/story-reader.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { StoryGraph } from "@/lib/stories/graph";
import { recordEnding } from "@/lib/stories/actions";
import { EndingScreen } from "@/components/story/ending-screen";
import { ReadingSettings } from "@/components/story/reading-settings";
import { setReadingPrefs } from "@/lib/reading-prefs-actions";
import { fontCss, sizeCss, type ReadingFontId, type ReadingSizeId } from "@/lib/reading-prefs";

export function StoryReader({
  slug, startKey, graph, initialFont, initialSize,
}: {
  slug: string; startKey: string; graph: StoryGraph;
  initialFont: ReadingFontId; initialSize: ReadingSizeId;
}) {
  const searchParams = useSearchParams();
  const urlKey = searchParams.get("p");
  const initialKey = urlKey && graph.pages[urlKey] ? urlKey : startKey;

  const [currentKey, setCurrentKey] = useState(initialKey);
  const [progress, setProgress] = useState<{ found: number; total: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [font, setFont] = useState<ReadingFontId>(initialFont);
  const [size, setSize] = useState<ReadingSizeId>(initialSize);

  const current = graph.pages[currentKey] ?? graph.pages[startKey];
  const { size: fSize, lh } = sizeCss(size);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("p", currentKey);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [currentKey, searchParams]);

  useEffect(() => {
    if (current.isEnding) recordEnding(slug, current.key).then((p) => { if (p) setProgress(p); });
  }, [current.isEnding, current.key, slug]);

  const chooseFont = (f: ReadingFontId) => setFont(f);
  const chooseSize = (s: ReadingSizeId) => setSize(s);

  // Persist whichever prefs are current after any change (skip the initial mount).
  const prefsMounted = useRef(false);
  useEffect(() => {
    if (!prefsMounted.current) {
      prefsMounted.current = true;
      return;
    }
    void setReadingPrefs(font, size);
  }, [font, size]);

  const goTo = useCallback((key: string) => { setProgress(null); setCurrentKey(key); }, []);
  const readAgain = useCallback(() => goTo(startKey), [goTo, startKey]);

  return (
    <div>
      <div
        className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-2 px-4 py-2 backdrop-blur sm:top-16"
        style={{ background: "color-mix(in srgb, var(--pc-sky) 85%, transparent)" }}
      >
        <span className="flex-1" />
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Reading settings"
          className="grid h-9 w-11 place-items-center rounded-xl bg-[var(--pc-ink)] font-display font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          A<span className="text-[0.7em]">a</span>
        </button>
      </div>

      {current.isEnding ? (
        <EndingScreen endingLabel={current.endingLabel} progress={progress} onReadAgain={readAgain} />
      ) : (
        <article className="mx-auto max-w-[38rem]">
          <p className="reader-prose mb-8" style={{ ["--reading-font" as string]: fontCss(font), ["--reading-size" as string]: fSize, ["--reading-lh" as string]: lh }}>
            {current.body}
          </p>
          <div className="flex flex-col gap-3">
            {current.choices.map((c, i) => (
              <button
                key={`${c.to}-${i}`}
                onClick={() => goTo(c.to)}
                className={`rounded-2xl p-4 text-left font-display text-base font-bold text-[var(--pc-ink)] shadow-[0_5px_0_rgba(22,40,58,0.16)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 ${
                  i % 2 === 0 ? "bg-[var(--pc-leaf)]" : "bg-[var(--pc-poppy)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </article>
      )}

      <ReadingSettings
        open={settingsOpen} onOpenChange={setSettingsOpen}
        font={font} size={size} onFont={chooseFont} onSize={chooseSize}
      />
    </div>
  );
}
