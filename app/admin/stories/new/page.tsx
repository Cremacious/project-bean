import Link from "next/link";
import { Wizard } from "@/components/admin/wizard/wizard";

export default function NewStoryPage() {
  return (
    <section className="flex flex-1 flex-col gap-5">
      <Link href="/admin" className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to stories</Link>
      <h1 className="font-display text-2xl font-extrabold">New story</h1>
      <p className="text-sm text-[var(--pc-sub)]">The wizard plans the whole shape of your story. You just write the words.</p>
      <Wizard />
    </section>
  );
}
