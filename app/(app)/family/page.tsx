// app/(app)/family/page.tsx
import { redirect } from "next/navigation";
import { getParent } from "@/lib/session";
import { listChildren } from "@/lib/children";
import { ChildRow } from "@/components/profiles/child-row";
import { ChildForm } from "@/components/profiles/child-form";

export default async function FamilyPage() {
  const parent = await getParent();
  if (!parent) redirect("/sign-in"); // stale cookie passed middleware but the session is invalid
  const kids = await listChildren(parent.id);

  return (
    <section className="mx-auto max-w-2xl space-y-6 py-2">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
        Your family
      </h1>

      {kids.length === 0 ? (
        <p className="text-[var(--pc-sub)]">No readers yet. Add your first one below.</p>
      ) : (
        <div className="space-y-3">
          {kids.map((kid) => (
            <ChildRow key={kid.id} child={kid} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold text-[var(--pc-ink)]">Add a child</h2>
        <div className="rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_10px_22px_-14px_rgba(22,40,58,0.45)] sm:p-6">
          <ChildForm mode="create" />
        </div>
      </div>
    </section>
  );
}
