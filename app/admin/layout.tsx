// app/admin/layout.tsx
//
// The /admin gate (issue #85). Access is the dedicated admin session, NOT a
// signed-in parent: getAdminEmail verifies the ADMIN_EMAILS + ADMIN_PASSWORD
// login cookie. When there is no valid admin session we render the login form in
// place of the panel for EVERY route under /admin, so nothing behind the gate can
// render server-side without it. Each admin server action re-checks the session
// too (a direct POST bypasses this layout).
import Link from "next/link";
import { getAdminEmail } from "@/lib/admin-session";
import { adminLogout } from "@/lib/admin-auth-actions";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { SiteFooter } from "@/components/site-footer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminEmail = await getAdminEmail();

  if (!adminEmail) {
    return (
      <div className="flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]">
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <AdminLoginForm />
        </main>
        <SiteFooter variant="admin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <header className="pt-safe sticky top-0 z-30 flex-none border-b border-[var(--pc-plum-ink)] bg-[var(--pc-plum)]">
        <div className="px-gutter mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 sm:h-16">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg font-display text-lg font-extrabold text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Bedtime Quests Admin
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/admin"
                className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold text-white outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white"
              >
                Stories
              </Link>
              <Link
                href="/admin/accounts"
                className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold text-white outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white"
              >
                Accounts
              </Link>
            </nav>
          </div>
          <form action={adminLogout}>
            <button
              type="submit"
              className="cursor-pointer rounded-full border border-white/40 px-3 py-1.5 text-sm font-bold text-white outline-none transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white active:translate-y-px"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Small-screen nav row: keep the two sections reachable on mobile. */}
      <nav className="flex items-center gap-1 border-b border-[var(--pc-line)] bg-white px-4 py-2 sm:hidden">
        <Link
          href="/admin"
          className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold text-[var(--pc-ink)] outline-none hover:bg-[var(--pc-sky)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Stories
        </Link>
        <Link
          href="/admin/accounts"
          className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold text-[var(--pc-ink)] outline-none hover:bg-[var(--pc-sky)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Accounts
        </Link>
      </nav>

      <main className="flex flex-1 flex-col">
        <div className="px-gutter mx-auto flex w-full max-w-4xl flex-1 flex-col py-6">{children}</div>
      </main>
      <SiteFooter variant="admin" />
    </div>
  );
}
