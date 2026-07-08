// components/sign-out-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await signOutAction();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
