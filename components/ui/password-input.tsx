// components/ui/password-input.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A password field with a built-in show/hide eye toggle. Pass the same props you
 * would give a normal <input> (id, name, value, onChange, autoComplete, aria-*).
 * The toggle flips the field between dots and plain text so a parent can check
 * what they typed. It is a real, distinctly clickable control: pointer cursor,
 * focus ring, and an accessible label that flips with the state.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(
          "h-11 rounded-xl border-[var(--pc-line)] pr-12 pl-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-[var(--pc-sub)] outline-none transition-colors hover:text-[var(--pc-ink)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a13.4 13.4 0 0 1-2.3 3M6.3 6.3A13.4 13.4 0 0 0 2 12s3.5 7 10 7a9.9 9.9 0 0 0 4.2-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
