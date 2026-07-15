// components/admin/account-search.tsx
"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { field } from "@/components/admin/styles";

/**
 * Email search for the account roster (issue #85). Filtering happens server-side
 * via the `?q=` URL param (see app/admin/accounts/page.tsx); this only keeps the
 * URL in step with what the admin types. Typing debounces the navigation;
 * pressing Enter applies it right away. Works as a plain field with a real,
 * distinctly clickable clear button.
 */
export function AccountSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const skipFirst = useRef(true);

  function apply(next: string) {
    const trimmed = next.trim();
    const url = trimmed ? `/admin/accounts?q=${encodeURIComponent(trimmed)}` : "/admin/accounts";
    startTransition(() => router.replace(url, { scroll: false }));
  }

  // Debounce navigation while the admin is still typing.
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const id = setTimeout(() => apply(value), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        apply(value);
      }}
      className="relative"
    >
      <label htmlFor="account-search" className="sr-only">Search accounts by email</label>
      <input
        id="account-search"
        type="search"
        inputMode="email"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by email"
        className={`${field} pr-24`}
        aria-busy={isPending}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            apply("");
          }}
          className="absolute inset-y-0 right-2 my-auto h-8 cursor-pointer rounded-xl px-3 text-sm font-bold text-[var(--pc-plum)] outline-none hover:bg-[var(--pc-sky)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Clear
        </button>
      )}
    </form>
  );
}
