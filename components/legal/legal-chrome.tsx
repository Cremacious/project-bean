// components/legal/legal-chrome.tsx
// Public page shell for the always public legal + support routes (issue #49).
// These routes live at the top level (not in the app/(app) group), so they do
// NOT inherit the authed app header/footer. This gives a signed out visitor the
// same brand chrome and, crucially, the same footer links (Privacy, Terms,
// Support) so they can move between the pages without an account.
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";

export function LegalChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <header className="pt-safe flex-none border-b border-[var(--pc-plum-ink)] bg-[var(--pc-plum)]">
        <div className="px-gutter mx-auto flex w-full max-w-3xl items-center py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <BrandMark size="sm" />
            <span className="font-display text-lg font-extrabold text-white">
              {BRAND.name}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="px-gutter mx-auto w-full max-w-3xl flex-1 py-8 sm:py-12">
          {children}
        </div>
      </main>

      <SiteFooter variant="public" />
    </div>
  );
}
