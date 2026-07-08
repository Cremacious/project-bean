// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { getReader } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { isThemeId, type ThemeId } from "@/lib/theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const reader = await getReader();
  if (!reader) redirect("/sign-in");

  const theme: ThemeId = isThemeId(reader.theme) ? reader.theme : "cozy";

  return (
    <div id="app-shell" data-theme={theme} className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b gap-4 flex-wrap">
        <span className="font-semibold">Storytime</span>
        <div className="flex items-center gap-3">
          <ThemeSwitcher initial={theme} />
          <span className="text-sm text-muted-foreground">Hi, {reader.displayName}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="p-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
