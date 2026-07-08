// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { getReader } from "@/lib/session";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const reader = await getReader();
  if (!reader) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <AppHeader displayName={reader.displayName} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
