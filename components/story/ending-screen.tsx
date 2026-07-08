// components/story/ending-screen.tsx
"use client";

import Link from "next/link";

const CONFETTI = [
  { c: "var(--pc-poppy)", l: "12%", t: "10%", r: "18deg" },
  { c: "var(--pc-leaf)", l: "82%", t: "8%", r: "-24deg" },
  { c: "var(--pc-sun)", l: "24%", t: "20%", r: "40deg" },
  { c: "var(--pc-plum)", l: "70%", t: "22%", r: "12deg" },
  { c: "var(--pc-sun)", l: "8%", t: "42%", r: "28deg" },
  { c: "var(--pc-leaf)", l: "90%", t: "40%", r: "-10deg" },
];

const EXTRA_CONFETTI = [
  { c: "var(--pc-poppy)", l: "45%", t: "6%", r: "8deg" },
  { c: "var(--pc-plum)", l: "18%", t: "30%", r: "-16deg" },
  { c: "var(--pc-sun)", l: "60%", t: "34%", r: "22deg" },
  { c: "var(--pc-leaf)", l: "36%", t: "16%", r: "-30deg" },
];

type Progress = { goodFound: number; goodTotal: number; complete: boolean };

export function EndingScreen({
  endingType, endingLabel, progress, onReadAgain,
}: {
  endingType: string;
  endingLabel: string | null;
  progress: Progress | null;
  onReadAgain: () => void;
}) {
  if (endingType === "game_over") {
    return (
      <div className="relative mx-auto flex max-w-md flex-col items-center overflow-hidden py-10 text-center">
        <div
          aria-hidden
          className="mb-5 grid h-20 w-20 place-items-center rounded-3xl text-4xl shadow-[0_12px_24px_-10px_rgba(120,140,170,0.5)]"
          style={{ background: "var(--pc-sky)" }}
        >
          🦉
        </div>
        <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--pc-sub)]">The End</p>
        <h2 className="mb-3 font-display text-2xl font-extrabold sm:text-3xl">Oh no! Let&apos;s try again</h2>
        <div className="rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 text-sm font-bold shadow-[0_8px_20px_-14px_rgba(22,40,58,0.4)]">
          Surprise ending found!
        </div>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={onReadAgain}
            className="rounded-2xl bg-[var(--pc-plum)] py-3.5 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-[var(--pc-line)] bg-white py-3 text-center font-display font-bold text-[var(--pc-ink)] shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Back to the library
          </Link>
        </div>
      </div>
    );
  }

  const complete = progress?.complete ?? false;
  const headline = complete ? "You finished the whole story!" : "You found a good ending!";

  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center overflow-hidden py-10 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {CONFETTI.map((p, i) => (
          <span key={i} className="absolute h-3.5 w-2.5 rounded-[2px]" style={{ background: p.c, left: p.l, top: p.t, transform: `rotate(${p.r})` }} />
        ))}
        {complete && EXTRA_CONFETTI.map((p, i) => (
          <span key={`extra-${i}`} className="absolute h-3.5 w-2.5 rounded-[2px]" style={{ background: p.c, left: p.l, top: p.t, transform: `rotate(${p.r})` }} />
        ))}
      </div>
      <div className="mb-5 grid h-20 w-20 -rotate-6 place-items-center rounded-3xl text-4xl shadow-[0_12px_24px_-10px_rgba(255,150,20,0.6)]" style={{ background: "var(--pc-sun)" }}>🎉</div>
      <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--pc-sub)]">The End</p>
      {endingLabel && <h2 className="mb-1.5 font-display text-2xl font-extrabold sm:text-3xl">{endingLabel}</h2>}
      <h3 className="mb-3 font-display text-xl font-extrabold text-[var(--pc-ink)] sm:text-2xl">{headline}</h3>
      {progress && (
        <>
          <div className="rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 text-sm font-bold shadow-[0_8px_20px_-14px_rgba(22,40,58,0.4)]">
            That&apos;s <b className="text-[var(--pc-poppy-ink)]">{progress.goodFound} of {progress.goodTotal}</b> good endings.
          </div>
          <div className="my-4 flex justify-center gap-1.5">
            {Array.from({ length: progress.goodTotal }).map((_, i) => (
              <span key={i} className="h-3 w-3 rounded-full" style={{ background: i < progress.goodFound ? "var(--pc-leaf)" : "var(--pc-line)" }} />
            ))}
          </div>
        </>
      )}
      <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/collection"
          className="rounded-2xl bg-[var(--pc-plum)] py-3.5 text-center font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
        >
          See my endings
        </Link>
        <button
          onClick={onReadAgain}
          className="rounded-2xl border border-[var(--pc-line)] bg-white py-3 text-center font-display font-bold text-[var(--pc-ink)] shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
        >
          Read again
        </button>
        <Link
          href="/"
          className="rounded-2xl border border-[var(--pc-line)] bg-white py-3 text-center font-display font-bold text-[var(--pc-ink)] shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
        >
          Back to the library
        </Link>
      </div>
    </div>
  );
}
