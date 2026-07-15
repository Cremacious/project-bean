// app/admin/accounts/[id]/page.tsx
//
// One account's detail + management controls (issue #85). Guarded by the admin
// session in app/admin/layout.tsx. `params` is a Promise in Next 16.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount } from "@/lib/admin/accounts";
import { AccountControls } from "@/components/admin/account-controls";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

const STATUS_LABELS: Record<string, string> = {
  none: "None",
  trialing: "Trialing",
  active: "Active",
  grace: "Grace period",
  canceled: "Canceled",
  expired: "Expired",
};

export default async function AdminAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getAccount(id);
  if (!account) notFound();

  const overrideLabel =
    account.override === null ? "Following billing" : account.override ? "Forced premium" : "Forced free";

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/admin/accounts"
          className="w-fit cursor-pointer rounded-lg text-sm font-bold text-[var(--pc-plum)] underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Back to accounts
        </Link>
        <h1 className="font-display text-2xl font-extrabold break-all">{account.email}</h1>
        {account.disabledAt && (
          <p className="text-sm font-bold text-[var(--pc-poppy-ink)]">
            This account is disabled and cannot use the app.
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_4px_0_var(--pc-line)] sm:grid-cols-3">
        <div>
          <dt className="text-xs font-bold text-[var(--pc-sub)]">Joined</dt>
          <dd className="text-sm font-semibold">{formatDate(account.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[var(--pc-sub)]">Children</dt>
          <dd className="text-sm font-semibold">{account.childCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[var(--pc-sub)]">Endings found</dt>
          <dd className="text-sm font-semibold">{account.endingsFound}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[var(--pc-sub)]">Premium</dt>
          <dd className="text-sm font-semibold">{account.isPremium ? "Premium" : "Free"}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[var(--pc-sub)]">Billing status</dt>
          <dd className="text-sm font-semibold">{STATUS_LABELS[account.billingStatus] ?? account.billingStatus}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[var(--pc-sub)]">Override</dt>
          <dd className="text-sm font-semibold">{overrideLabel}</dd>
        </div>
      </dl>

      {account.children.length > 0 && (
        <div className="rounded-2xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_4px_0_var(--pc-line)]">
          <h2 className="font-display text-lg font-extrabold">Children</h2>
          <ul className="mt-2 space-y-1">
            {account.children.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{c.name}</span>
                <span className="text-xs text-[var(--pc-sub)]">Added {formatDate(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AccountControls
        userId={account.id}
        email={account.email}
        override={account.override}
        disabled={account.disabledAt !== null}
      />
    </section>
  );
}
