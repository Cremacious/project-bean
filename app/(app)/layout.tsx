// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { getReader } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const reader = await getReader();
  if (!reader) redirect("/sign-in");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <span className="font-semibold">Storytime</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Hi, {reader.displayName}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="p-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
