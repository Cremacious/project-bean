"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Child } from "@/lib/children";
import { setActiveChild } from "@/lib/active-child-actions";
import { updateChild } from "@/lib/children-actions";
import { ChildForm } from "@/components/profiles/child-form";
import { FirstReaderOnboarding } from "@/components/profiles/first-reader-onboarding";

const AVATAR_COLORS = ["var(--pc-poppy)", "var(--pc-leaf)", "var(--pc-plum)", "var(--pc-sun)"];

export function ChildPicker({ kids, needsFirst }: { kids: Child[]; needsFirst: boolean }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  // Rename state is intentionally separate from selection: editing a child must never
  // start their story (issue #76).
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const editingKid = kids.find((k) => k.id === editingId) ?? null;
  const saving = savingId !== null;

  // Close the rename dialog on Escape (matches the reading-settings dialog behavior).
  useEffect(() => {
    if (!editingKid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingKid, saving]);

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

  function startEdit(kid: Child) {
    setEditingId(kid.id);
    setEditName(kid.name);
    setEditError(null);
  }

  function closeEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveRename(kid: Child) {
    const clean = editName.trim();
    if (!clean) {
      setEditError("Please enter a name.");
      return;
    }
    setSavingId(kid.id);
    // Reuse updateChild, keeping the child's existing reading mode so this only renames.
    const result = await updateChild(kid.id, clean, kid.readingMode);
    if (result.ok) {
      setSavingId(null);
      setEditingId(null);
      setEditError(null);
      router.refresh(); // picker reflects the new name immediately
    } else {
      setSavingId(null);
      setEditError("Something went wrong. Please try again.");
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
              d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 16.77l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Who stars in tonight&apos;s story?
        </h1>
        <p className="max-w-md text-base font-semibold text-[var(--pc-sub)]">
          Pick your child and they become the hero of the story, starring by their own name. Each
          child keeps their own collection.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kids.map((kid) => {
          const color = AVATAR_COLORS[kid.id % AVATAR_COLORS.length];
          const initial = kid.name.trim().charAt(0).toUpperCase() || "?";
          const starting = pendingId === kid.id;

          return (
            <div key={kid.id} className="relative">
              <button
                type="button"
                onClick={() => pick(kid.id)}
                disabled={pendingId !== null}
                className="flex min-h-[44px] w-full flex-col items-center gap-2 rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:opacity-60"
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-full font-display text-2xl font-bold text-white"
                  style={{ background: color }}
                >
                  {initial}
                </span>
                <span className="font-display text-base font-bold text-[var(--pc-ink)]">{kid.name}</span>
                <span className="text-xs font-bold text-[var(--pc-plum-ink)]">
                  {starting ? "Starting…" : "Star in the story"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => startEdit(kid)}
                disabled={pendingId !== null}
                aria-label={`Rename ${kid.name}`}
                title={`Rename ${kid.name}`}
                className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform hover:bg-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-line)] disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M4 20h4l10-10-4-4L4 16v4z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
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

      {editingKid && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[rgba(22,40,58,0.32)]"
            onClick={() => !saving && closeEdit()}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="rename-dialog-title"
              className="w-full max-w-sm rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_24px_48px_-20px_rgba(22,40,58,0.55)] sm:p-6"
            >
              <h2
                id="rename-dialog-title"
                className="font-display text-xl font-extrabold text-[var(--pc-ink)]"
              >
                Rename {editingKid.name}
              </h2>
              <p className="mt-1 text-sm font-semibold text-[var(--pc-sub)]">
                This is the name that stars in their stories.
              </p>

              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveRename(editingKid);
                }}
              >
                <label htmlFor="rename-input" className="text-sm font-bold text-[var(--pc-ink)]">
                  Name
                </label>
                <input
                  id="rename-input"
                  type="text"
                  value={editName}
                  maxLength={40}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={saving}
                  className="h-12 w-full rounded-2xl border border-[var(--pc-line)] bg-white px-4 text-base font-semibold text-[var(--pc-ink)] outline-none placeholder:text-[var(--pc-sub)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
                />
                {editError && (
                  <p className="text-sm font-bold text-[var(--pc-poppy-ink)]" role="alert">
                    {editError}
                  </p>
                )}

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                    className="min-h-[44px] flex-1 rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 text-base font-bold text-[var(--pc-ink)] outline-none shadow-[0_4px_0_var(--pc-line)] transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-line)] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-[44px] flex-1 rounded-2xl px-4 py-3 text-base font-bold text-white outline-none shadow-[0_4px_0_var(--pc-plum-ink)] transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-plum-ink)] disabled:opacity-60"
                    style={{ background: "var(--pc-plum)" }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
