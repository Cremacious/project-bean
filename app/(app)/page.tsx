// app/(app)/page.tsx
import Link from "next/link";
import { getReader } from "@/lib/session";
import { getLibraryForReader } from "@/lib/stories/queries";
import { Card } from "@/components/ui/card";

export default async function LibraryPage() {
  const reader = (await getReader())!; // layout guarantees non-null
  const stories = await getLibraryForReader(reader.id);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Choose a story</h1>
      {stories.length === 0 ? (
        <p className="text-muted-foreground">No stories yet. Check back soon!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stories.map((s) => (
            <Link key={s.id} href={`/story/${s.slug}`}>
              <Card className="p-5 h-full hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
