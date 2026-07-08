// components/story/story-reader.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { StoryGraph } from "@/lib/stories/graph";
import { recordEnding } from "@/lib/stories/actions";
import type { StoryProgress } from "@/lib/gameplay/progress";
import { EndingScreen } from "@/components/story/ending-screen";
import { ReadingSettings } from "@/components/story/reading-settings";
import { setChildReadingPrefs } from "@/lib/children-actions";
import { personalize } from "@/lib/stories/personalize";
import { fontCss, sizeCss, type ReadingFontId, type ReadingSizeId } from "@/lib/reading-prefs";

export function StoryReader({
  slug, startKey, graph, childName, initialFont, initialSize, preview = false,
}: {
  slug: string; startKey: string; graph: StoryGraph; childName: string;
  initialFont: ReadingFontId; initialSize: ReadingSizeId; preview?: boolean;
}) {
  const searchParams = useSearchParams();
  const urlKey = searchParams.get("p");
  const initialKey = urlKey && graph.pages[urlKey] ? urlKey : startKey;

  const [currentKey, setCurrentKey] = useState(initialKey);
  const [progress, setProgress] = useState<StoryProgress & { endingType: string } | null>(null);
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
    if (!preview && current.isEnding) recordEnding(slug, current.key).then((p) => { if (p) setProgress(p); });
  }, [preview, current.isEnding, current.key, slug]);

  const chooseFont = (f: ReadingFontId) => setFont(f);
  const chooseSize = (s: ReadingSizeId) => setSize(s);

  // Persist whichever prefs are current after any change (skip the initial mount).
  const prefsMounted = useRef(false);
  useEffect(() => {
    if (!prefsMounted.current) {
      prefsMounted.current = true;
      return;
    }
    void setChildReadingPrefs(font, size);
  }, [font, size]);

  const goTo = useCallback((key: string) => { setProgress(null); setCurrentKey(key); }, []);
  const readAgain = useCallback(() => goTo(startKey), [goTo, startKey]);

  return (
    <div>
      <div
        className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-2 px-4 py-2 backdrop-blur sm:top-16"
        style={{ background: "color-mix(in srgb, var(--pc-sky) 85%, transparent)" }}
      >
        {preview && (
          <span className="rounded-full bg-[var(--pc-sun)] px-3 py-1 text-xs font-extrabold text-[#3a2d00]">
            Preview
          </span>
        )}
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
        <EndingScreen
          endingType={current.endingType}
          endingLabel={current.endingLabel}
          progress={progress}
          onReadAgain={readAgain}
          preview={preview}
        />
      ) : (
        <article className="mx-auto max-w-[38rem]">
          <p className="reader-prose mb-8" style={{ ["--reading-font" as string]: fontCss(font), ["--reading-size" as string]: fSize, ["--reading-lh" as string]: lh }}>
            {personalize(current.body, childName)}
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
                {personalize(c.label, childName)}
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
