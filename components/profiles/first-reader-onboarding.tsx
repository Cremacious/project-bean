"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChild } from "@/lib/children-actions";
import { ParentOnboarding } from "@/components/onboarding/parent-onboarding";
import { isOnboardingDoneLocally } from "@/lib/onboarding-local";

// Purpose-built first-run screen. Unlike the compact family form, this one is the
// child's warm introduction to the app: it explains that the name becomes the hero
// of every story and spells out exactly what each reading mode does.
// Definitions follow docs/reading-modes.md; layout follows the responsive design plan
// (short single-column flow, fills the viewport, no dashes in copy, chunky clickables).

const MODES = [
  {
    id: "read_to_me",
    label: "Read to me",
    who: "A grown up reads the story out loud and taps the choices.",
    best: "Best for little ones who are not reading yet.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path
          d="M4 5h16v11H9l-4 4v-4H4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "can_read",
    label: "I can read",
    who: "Your child reads and taps the choices all on their own.",
    best: "Text starts bigger. Best for new readers finding their feet.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path
          d="M12 6c-2.5-1.2-5-1.2-8 0v12c3-1.2 5.5-1.2 8 0m0-12c2.5-1.2 5-1.2 8 0v12c-3-1.2-5.5-1.2-8 0m0-12v12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

export function FirstReaderOnboarding({ showTutorial = false }: { showTutorial?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [readingMode, setReadingMode] = useState<string>("read_to_me");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // The tutorial floats over this add-child screen (issue #73), so dismissing it
  // lands the parent exactly where they need to be, never at a dead end. Honour
  // the per-device local flag too, so a parent who already skipped it on this
  // device does not see it flash again before the server state catches up.
  const [tourOpen, setTourOpen] = useState(showTutorial);
  // Reconcile against the per-device local flag, which can only be read on the
  // client (localStorage is unavailable during SSR render). This one-shot,
  // conditional close is a legitimate effect: it syncs React state to a browser
  // API, not a cascading render. The interactive close path uses setTourOpen in a
  // click handler, not here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see note above
    if (showTutorial && isOnboardingDoneLocally()) setTourOpen(false);
  }, [showTutorial]);

  const clean = name.trim();
  const initial = clean.charAt(0).toUpperCase();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clean) {
      setError("Please enter a name.");
      return;
    }
    startTransition(async () => {
      const result = await createChild(clean, readingMode);
      if (result.ok) {
        router.refresh();
      } else {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      {tourOpen && <ParentOnboarding onDone={() => setTourOpen(false)} />}
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <span
          className="grid h-16 w-16 place-items-center rounded-3xl font-display text-3xl font-extrabold text-white shadow-[0_10px_22px_-10px_rgba(22,40,58,0.6)]"
          style={{ background: "var(--pc-plum)" }}
          aria-hidden="true"
        >
          {initial || "?"}
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Let&apos;s add your first reader
        </h1>
        <p className="max-w-md text-base font-semibold text-[var(--pc-sub)]">
          Add your child and choose how you will read together. Their name becomes the star of
          every bedtime quest.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_12px_28px_-16px_rgba(22,40,58,0.5)] sm:p-6"
      >
        {/* Name + why it matters */}
        <div className="flex flex-col gap-2">
          <label htmlFor="child-name" className="font-display text-base font-bold text-[var(--pc-ink)]">
            Your child&apos;s name
          </label>
          <input
            id="child-name"
            type="text"
            value={name}
            maxLength={40}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
            placeholder="Type their name"
            className="h-14 w-full rounded-2xl border-2 border-[var(--pc-line)] bg-white px-4 text-lg font-bold text-[var(--pc-ink)] outline-none placeholder:font-semibold placeholder:text-[var(--pc-sub)] focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            disabled={isPending}
          />
          <p className="text-sm font-semibold text-[var(--pc-ink)]">
            Your child is a character in the story. We use this name for the hero, so every quest
            is about them by name.
          </p>

          {/* Live proof: their name inside real story text */}
          <div className="rounded-2xl border border-[var(--pc-line)] bg-[var(--accent)] p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--pc-plum-ink)]">
              Your child in the story
            </p>
            <p className="text-base font-semibold text-[var(--pc-ink)]">
              {clean ? (
                <>
                  <span className="font-display font-extrabold text-[var(--pc-plum-ink)]">
                    {clean}
                  </span>{" "}
                  tiptoes into the Whispering Woods, and a little fox waves hello.
                </>
              ) : (
                "Type a name above to watch your child step into the story."
              )}
            </p>
          </div>
        </div>

        {/* Reading mode, fully explained */}
        <fieldset className="flex flex-col gap-2">
          <legend className="font-display text-base font-bold text-[var(--pc-ink)]">
            How will {clean || "you"} read tonight?
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MODES.map((m) => {
              const selected = readingMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setReadingMode(m.id)}
                  disabled={isPending}
                  aria-pressed={selected}
                  className={`flex flex-col gap-2 rounded-2xl border-2 p-4 text-left outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:opacity-60 ${
                    selected
                      ? "border-[var(--pc-plum)] bg-[var(--accent)] shadow-[0_4px_0_var(--pc-plum)] active:shadow-[0_1px_0_var(--pc-plum)]"
                      : "border-[var(--pc-line)] bg-white shadow-[0_4px_0_var(--pc-line)] active:shadow-[0_1px_0_var(--pc-line)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="grid h-10 w-10 flex-none place-items-center rounded-xl text-white"
                      style={{ background: selected ? "var(--pc-plum)" : "var(--pc-sub)" }}
                    >
                      {m.icon}
                    </span>
                    <span className="font-display text-lg font-bold text-[var(--pc-ink)]">
                      {m.label}
                    </span>
                    <span
                      className={`ml-auto grid h-6 w-6 place-items-center rounded-full text-white ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ background: "var(--pc-plum)" }}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path
                          d="M5 12l5 5 9-10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-[var(--pc-ink)]">{m.who}</span>
                  <span className="text-sm font-medium text-[var(--pc-ink)]">{m.best}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p className="text-sm font-bold text-[var(--pc-poppy-ink)]" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="min-h-[52px] w-full rounded-2xl px-4 py-3 font-display text-lg font-extrabold text-white outline-none shadow-[0_5px_0_var(--pc-plum-ink)] transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--pc-plum-ink)] disabled:opacity-60"
          style={{ background: "var(--pc-plum)" }}
        >
          {isPending ? "Saving…" : "Add reader"}
        </button>
      </form>
    </section>
    </>
  );
}
