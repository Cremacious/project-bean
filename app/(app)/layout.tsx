// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { getParent } from "@/lib/session";
import { getActiveChild } from "@/lib/active-child";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const parent = await getParent();
  if (!parent) redirect("/sign-in");
  const active = await getActiveChild();

  return (
    <div className="min-h-screen bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <AppHeader parentName={parent.name} activeChildName={active?.name ?? null} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
