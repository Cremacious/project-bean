"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Child } from "@/lib/children";
import { setActiveChild } from "@/lib/active-child-actions";
import { ChildForm } from "@/components/profiles/child-form";
import { FirstReaderOnboarding } from "@/components/profiles/first-reader-onboarding";

const AVATAR_COLORS = ["var(--pc-poppy)", "var(--pc-leaf)", "var(--pc-plum)", "var(--pc-sun)"];

export function ChildPicker({ kids, needsFirst }: { kids: Child[]; needsFirst: boolean }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function pick(id: number) {
    setPendingId(id);
    const result = await setActiveChild(id);
    if (result.ok) {
      router.push("/");
      router.refresh();
    } else {
      setPendingId(null);
    }
  }

  if (needsFirst) {
    return <FirstReaderOnboarding />;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <span
          className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-[0_8px_18px_-10px_rgba(22,40,58,0.6)]"
          style={{ background: "var(--pc-plum)" }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path
              d="M12 6c-2.5-1.2-5-1.2-8 0v12c3-1.2 5.5-1.2 8 0m0-12c2.5-1.2 5-1.2 8 0v12c-3-1.2-5.5-1.2-8 0m0-12v12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Who&apos;s reading tonight?
        </h1>
        <p className="max-w-md text-base font-semibold text-[var(--pc-sub)]">
          Tap a reader to start their storytime. Every story stars them by name, and each child
          keeps their own collection.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kids.map((kid) => {
          const color = AVATAR_COLORS[kid.id % AVATAR_COLORS.length];
          const initial = kid.name.trim().charAt(0).toUpperCase() || "?";
          const starting = pendingId === kid.id;
          return (
            <button
              key={kid.id}
              type="button"
              onClick={() => pick(kid.id)}
              disabled={pendingId !== null}
              className="flex min-h-[44px] flex-col items-center gap-2 rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:opacity-60"
            >
              <span
                className="grid h-14 w-14 place-items-center rounded-full font-display text-2xl font-bold text-white"
                style={{ background: color }}
              >
                {initial}
              </span>
              <span className="font-display text-base font-bold text-[var(--pc-ink)]">{kid.name}</span>
              <span className="text-xs font-bold text-[var(--pc-plum-ink)]">
                {starting ? "Starting…" : "Tap to start"}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex min-h-[44px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[var(--pc-line)] bg-transparent p-5 text-[var(--pc-sub)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:border-[var(--pc-plum)] hover:text-[var(--pc-plum-ink)]"
          aria-expanded={adding}
        >
          <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-current text-2xl font-bold">
            +
          </span>
          <span className="font-display text-base font-bold">Add a reader</span>
        </button>
      </div>

      {adding && (
        <div className="rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_10px_22px_-14px_rgba(22,40,58,0.45)] sm:p-6">
          <ChildForm mode="create" onDone={() => setAdding(false)} />
        </div>
      )}
    </section>
  );
}
