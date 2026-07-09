// app/admin/layout.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getParent } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { SiteFooter } from "@/components/site-footer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const parent = await getParent();
  if (!parent || !isAdmin(parent.email)) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <header className="sticky top-0 z-30 flex-none border-b border-[var(--pc-plum-ink)] bg-[var(--pc-plum)]">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link
            href="/admin"
            className="rounded-lg font-display text-lg font-extrabold text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Bedtime Quests Admin
          </Link>
          <Link
            href="/"
            className="rounded-full px-2 py-1 text-sm font-bold text-white underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white"
          >
            Back to the app
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6">
          {children}
        </div>
      </main>
      <SiteFooter variant="admin" />
    </div>
  );
}
