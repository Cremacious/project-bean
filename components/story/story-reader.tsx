// components/story/story-reader.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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

  const persist = useCallback((f: ReadingFontId, s: ReadingSizeId) => { void setReadingPrefs(f, s); }, []);
  const chooseFont = (f: ReadingFontId) => { setFont(f); persist(f, size); };
  const chooseSize = (s: ReadingSizeId) => { setSize(s); persist(font, s); };

  const goTo = useCallback((key: string) => { setProgress(null); setCurrentKey(key); }, []);
  const readAgain = useCallback(() => goTo(startKey), [goTo, startKey]);

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-2 bg-[var(--pc-sky)]/80 px-4 py-2 backdrop-blur sm:top-16">
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
                className={`flex items-center gap-3 rounded-2xl p-4 text-left font-display text-base font-bold text-white shadow-[0_5px_0_rgba(0,0,0,0.14)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  i % 2 === 0 ? "bg-[var(--pc-leaf-ink)]" : "bg-[var(--pc-poppy-ink)]"
                }`}
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-white/25 text-lg">{i % 2 === 0 ? "🌿" : "🏠"}</span>
                <span>{c.label}</span>
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
