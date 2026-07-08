// components/theme-switcher.tsx
"use client";

import { useState } from "react";
import { THEMES, type ThemeId } from "@/lib/theme";
import { setTheme } from "@/lib/theme-actions";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher({ initial }: { initial: ThemeId }) {
  const [active, setActive] = useState<ThemeId>(initial);

  function choose(id: ThemeId) {
    setActive(id);
    // Instantly retheme: update the nearest themed container (the shell wrapper),
    // which is the ancestor all app content inherits its CSS vars from.
    document.getElementById("app-shell")?.setAttribute("data-theme", id);
    void setTheme(id); // persist (fire and forget)
  }

  return (
    <div className="flex items-center gap-1">
      {THEMES.map((t) => (
        <Button
          key={t.id}
          size="sm"
          variant={active === t.id ? "default" : "ghost"}
          onClick={() => choose(t.id)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
