"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Child } from "@/lib/children";
import { setActiveChild } from "@/lib/active-child-actions";
import { ChildForm } from "@/components/profiles/child-form";

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
    return (
      <section className="mx-auto max-w-md space-y-6 py-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Let&apos;s add your first reader
        </h1>
        <div className="rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_10px_22px_-14px_rgba(22,40,58,0.45)] sm:p-6">
          <ChildForm mode="create" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 py-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
        Who&apos;s reading tonight?
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kids.map((kid) => {
          const color = AVATAR_COLORS[kid.id % AVATAR_COLORS.length];
          const initial = kid.name.trim().charAt(0).toUpperCase() || "?";
          return (
            <button
              key={kid.id}
              type="button"
              onClick={() => pick(kid.id)}
              disabled={pendingId !== null}
              className="flex min-h-[44px] flex-col items-center gap-2 rounded-3xl border border-[var(--pc-line)] bg-white p-5 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span
                className="grid h-14 w-14 place-items-center rounded-full font-display text-2xl font-bold text-white"
                style={{ background: color }}
              >
                {initial}
              </span>
              <span className="font-display text-base font-bold text-[var(--pc-ink)]">{kid.name}</span>
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
          <span className="font-display text-base font-bold">Add a child</span>
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
