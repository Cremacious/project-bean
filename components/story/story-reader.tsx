// components/story/story-reader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import type { StoryGraph } from "@/lib/stories/graph";
import { recordEnding } from "@/lib/stories/actions";
import type { StoryProgress } from "@/lib/gameplay/progress";
import { EndingScreen } from "@/components/story/ending-screen";
import { ReadingSettings } from "@/components/story/reading-settings";
import { setChildReadingPrefs } from "@/lib/children-actions";
import { personalize } from "@/lib/stories/personalize";
import { fontCss, sizeCss, type ReadingFontId, type ReadingSizeId } from "@/lib/reading-prefs";

type EndingProgress = StoryProgress & { endingType: string };

export function StoryReader({
  slug,
  title,
  startKey,
  graph,
  childName,
  readingMode = "read_to_me",
  initialFont,
  initialSize,
  preview = false,
}: {
  slug: string;
  title: string;
  startKey: string;
  graph: StoryGraph;
  childName: string;
  readingMode?: string;
  initialFont: ReadingFontId;
  initialSize: ReadingSizeId;
  preview?: boolean;
}) {
  const canRead = readingMode === "can_read";
  const searchParams = useSearchParams();

  // Resolve the starting page once: from the URL (?p=) if valid, else the story start.
  const [currentKey, setCurrentKey] = useState<string>(() => {
    const fromUrl = searchParams.get("p");
    return fromUrl && graph.pages[fromUrl] ? fromUrl : startKey;
  });
  const [progress, setProgress] = useState<EndingProgress | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [font, setFont] = useState<ReadingFontId>(initialFont);
  const [size, setSize] = useState<ReadingSizeId>(initialSize);

  const pageData = graph.pages[currentKey] ?? graph.pages[startKey];
  const { size: fontSize, lh } = sizeCss(size);

  // Keep the URL (?p=) in step with the current page. Depends only on currentKey,
  // so it never loops on searchParams identity churn.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("p") !== currentKey) {
      url.searchParams.set("p", currentKey);
      window.history.replaceState(null, "", url.toString());
    }
  }, [currentKey]);

  // Record the ending the first time the reader lands on an ending page.
  useEffect(() => {
    if (preview || !pageData.isEnding) return;
    let live = true;
    recordEnding(slug, pageData.key).then((p) => {
      if (live && p) setProgress(p);
    });
    return () => {
      live = false;
    };
  }, [preview, pageData.isEnding, pageData.key, slug]);

  // Persist font/size for this child after a change (skip the first mount).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    void setChildReadingPrefs(font, size);
  }, [font, size]);

  const goTo = useCallback((key: string) => {
    setProgress(null);
    setCurrentKey(key);
  }, []);
  const readAgain = useCallback(() => goTo(startKey), [goTo, startKey]);

  const proseStyle = {
    "--reading-font": fontCss(font),
    "--reading-size": fontSize,
    "--reading-lh": lh,
  } as CSSProperties;

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Top bar: story title on the left, the accessibility control on the right. */}
      <div className="sticky top-14 z-10 -mx-4 mb-6 flex flex-none items-center gap-3 border-b border-[var(--pc-line)] bg-[var(--pc-sky)] px-4 py-3 sm:top-16 sm:px-6">
        {preview && (
          <span className="flex-none rounded-full bg-[var(--pc-sun)] px-2.5 py-1 text-xs font-extrabold text-[#3a2d00]">
            Preview
          </span>
        )}
        <h1 className="min-w-0 flex-1 truncate font-display text-base font-extrabold text-[var(--pc-ink)] sm:text-lg">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          aria-label="Reading settings: text size and font"
          className="inline-flex flex-none cursor-pointer items-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-1.5 pl-1.5 pr-3 font-display font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
        >
          <span aria-hidden className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-[var(--pc-plum)] leading-none text-white">
            <span className="text-sm font-extrabold">
              A<span className="text-[0.7em]">a</span>
            </span>
          </span>
          <span className="text-sm">Reading settings</span>
        </button>
      </div>

      {/* Body: the story page, or the ending screen. */}
      <div className="flex flex-1 flex-col justify-center">
        {pageData.isEnding ? (
          <EndingScreen
            endingType={pageData.endingType}
            endingLabel={pageData.endingLabel}
            progress={progress}
            onReadAgain={readAgain}
            preview={preview}
          />
        ) : (
          <article className="mx-auto w-full max-w-[38rem]">
            <p className="reader-prose mb-10" style={proseStyle}>
              {personalize(pageData.body, childName)}
            </p>

            {pageData.choices.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className={`font-display font-bold text-[var(--pc-ink)] ${canRead ? "text-lg" : "text-sm"}`}>
                  {canRead ? "Your turn. Pick one!" : "Let them choose what happens next."}
                </p>
                {pageData.choices.map((choice, i) => (
                  <button
                    key={`${choice.to}-${i}`}
                    type="button"
                    onClick={() => goTo(choice.to)}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--pc-plum)] text-left font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 ${
                      canRead ? "p-5 text-lg" : "p-4 text-base"
                    }`}
                  >
                    <span className="min-w-0 flex-1">{personalize(choice.label, childName)}</span>
                    <span aria-hidden className="flex-none text-xl leading-none text-white/80">
                      ›
                    </span>
                  </button>
                ))}
              </div>
            )}
          </article>
        )}
      </div>

      <ReadingSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        font={font}
        size={size}
        onFont={setFont}
        onSize={setSize}
      />
    </div>
  );
}
