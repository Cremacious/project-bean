// app/admin/layout.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getParent } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const parent = await getParent();
  if (!parent || !isAdmin(parent.email)) notFound();

  return (
    <div className="min-h-screen bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <header className="border-b border-[var(--pc-line)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-display text-lg font-extrabold text-[var(--pc-ink)]">
            Bedtime Quests Admin
          </Link>
          <Link href="/" className="text-sm font-bold text-[var(--pc-plum-ink)] underline">
            Back to the app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
