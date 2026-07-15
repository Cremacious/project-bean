// app/admin/accounts/page.tsx
//
// The account roster (issue #85). Lists every parent account with its child
// count and effective premium state. Click through to manage one. Guarded by the
// admin session in app/admin/layout.tsx.
import Link from "next/link";
import { listAccounts } from "@/lib/admin/accounts";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountSearch } from "@/components/admin/account-search";

function formatDate(d: Date): string {
  // A no-dash format (UI rule 1): "Jul 15, 2026".
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const accounts = await listAccounts(query);

  return (
    <section className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Accounts</h1>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)]">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </span>
      </div>

      <AccountSearch initialQuery={query} />

      {accounts.length === 0 ? (
        query ? (
          <EmptyState
            emoji="🔍"
            title="No matching accounts"
            description={`No account email matches "${query}". Try a different search.`}
          />
        ) : (
          <EmptyState emoji="👤" title="No accounts yet" description="Parent accounts will appear here once families sign up." />
        )
      ) : (
        <ul className="flex-1 space-y-2">
          {accounts.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/accounts/${a.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-bold">{a.email}</span>
                  <span className="text-xs text-[var(--pc-sub)]">
                    Joined {formatDate(a.createdAt)} · {a.childCount} {a.childCount === 1 ? "child" : "children"}
                  </span>
                </span>
                {a.disabledAt && (
                  <span className="flex-none rounded-full bg-[#FDECEC] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-poppy-ink)]">
                    Disabled
                  </span>
                )}
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-xs font-extrabold ${
                    a.isPremium ? "bg-[#E6F7F0] text-[var(--pc-leaf-ink)]" : "bg-[var(--pc-sky)] text-[var(--pc-ink)]"
                  }`}
                >
                  {a.isPremium ? "Premium" : "Free"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
