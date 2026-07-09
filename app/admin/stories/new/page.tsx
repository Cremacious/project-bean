import Link from "next/link";
import { NewStoryForm } from "@/components/admin/new-story-form";

export default function NewStoryPage() {
  return (
    <section className="flex flex-1 flex-col gap-5">
      <Link href="/admin" className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to stories</Link>
      <h1 className="font-display text-2xl font-extrabold">New story</h1>
      <NewStoryForm />
    </section>
  );
}
