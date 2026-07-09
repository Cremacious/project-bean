// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { getParent } from "@/lib/session";
import { getActiveChild } from "@/lib/active-child";
import { isAdmin } from "@/lib/admin";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const parent = await getParent();
  if (!parent) redirect("/sign-in");
  const active = await getActiveChild();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <AppHeader
        parentName={parent.name}
        activeChildName={active?.name ?? null}
        isAdmin={isAdmin(parent.email)}
      />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
