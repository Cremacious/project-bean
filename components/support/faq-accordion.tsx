// components/support/faq-accordion.tsx
//
// Renders the shared Help / FAQ content (packages/core faq.ts) as accessible
// accordions on the web (issue #72). Built on native <details>/<summary>, so it is
// keyboard and screen reader friendly with no client JavaScript: a parent can Tab
// to a question and press Enter or Space to expand it.
//
// UI rules: every question is a chunky Paper Cut affordance that clearly looks
// clickable (solid bottom edge, pointer cursor, focus ring, a chevron that turns
// when open); all copy is dash free; all text is high contrast.
import { FAQ_SECTIONS } from "@bedtime-quests/core/faq";

export function FaqAccordion() {
  return (
    <div className="space-y-10">
      {FAQ_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
          <h2
            id={`${section.id}-heading`}
            className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]"
          >
            {section.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--pc-sub)]">{section.summary}</p>

          <div className="mt-4 space-y-3">
            {section.items.map((item) => (
              <details
                key={item.id}
                id={item.id}
                className="group rounded-2xl border-2 border-[var(--pc-line)] bg-white shadow-[0_5px_0_var(--pc-line)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 font-display text-base font-bold text-[var(--pc-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="h-5 w-5 flex-none text-[var(--pc-plum)] transition-transform duration-200 group-open:rotate-180"
                  >
                    <path
                      d="M5 7.5 10 12.5 15 7.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <div className="space-y-3 px-5 pb-5 pt-0 text-[15px] font-medium leading-relaxed text-[var(--pc-ink)]">
                  {item.answer.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
