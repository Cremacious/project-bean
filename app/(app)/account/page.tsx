// app/(app)/account/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getParent } from "@/lib/session";
import { getSubscription } from "@/lib/entitlements";
import { NameForm } from "@/components/account/name-form";
import { PasswordForm } from "@/components/account/password-form";
import { SessionsForm } from "@/components/account/sessions-form";
import { SubscriptionPanel } from "@/components/account/subscription-panel";
import { DeleteAccount } from "@/components/account/delete-account";

export const metadata: Metadata = { title: "Account settings" };

function Card({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={
        danger
          ? "space-y-4 rounded-3xl border-2 border-[var(--pc-poppy)] bg-white p-5 shadow-[0_10px_22px_-14px_rgba(225,74,43,0.45)] sm:p-6"
          : "space-y-4 rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_10px_22px_-14px_rgba(22,40,58,0.45)] sm:p-6"
      }
    >
      <div className="space-y-1">
        <h2
          className="font-display text-xl font-bold"
          style={{ color: danger ? "var(--pc-poppy-ink)" : "var(--pc-ink)" }}
        >
          {title}
        </h2>
        <p className="text-sm font-semibold text-[var(--pc-sub)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function AccountPage() {
  const parent = await getParent();
  if (!parent) redirect("/sign-in"); // stale cookie passed middleware but the session is invalid

  const subscription = await getSubscription(parent);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Account settings
        </h1>
        <p className="text-base font-semibold text-[var(--pc-sub)]">
          Manage your subscription, name, password, and account.
        </p>
      </div>

      <Card
        title="Subscription"
        description="See your plan and status, manage or cancel it, or restore a purchase."
      >
        <SubscriptionPanel subscription={subscription} />
      </Card>

      <Card title="Your name" description="This is the name shown when you are signed in.">
        <NameForm currentName={parent.name} />
      </Card>

      <Card title="Email" description="The address you use to sign in.">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-sm font-bold text-[var(--pc-ink)]">Current email</span>
            <p className="rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-sky)] px-4 py-3 text-base font-semibold text-[var(--pc-ink)]">
              {parent.email}
            </p>
          </div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="min-h-[44px] cursor-not-allowed rounded-2xl border border-[var(--pc-line)] bg-white px-5 py-3 text-base font-bold text-[var(--pc-sub)] opacity-70"
          >
            Change email
          </button>
          <p className="text-sm font-semibold text-[var(--pc-sub)]">
            Changing your email is coming soon.
          </p>
        </div>
      </Card>

      <Card title="Password" description="Use a password with at least eight characters.">
        <PasswordForm />
      </Card>

      <Card
        title="Signed in devices"
        description="Signed in on a shared or old phone? Sign out everywhere else while staying signed in here."
      >
        <SessionsForm />
      </Card>

      <Card
        title="Delete account"
        description="Permanently remove your account and all of your family data. Required by the app stores and by law for children."
        danger
      >
        <DeleteAccount />
      </Card>
    </div>
  );
}
