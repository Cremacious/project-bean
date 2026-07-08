// app/(app)/collection/page.tsx
import { redirect } from "next/navigation";
import { getActiveChild } from "@/lib/active-child";
import { getCollection } from "@/lib/gameplay/collection";
import { CollectionView } from "@/components/gameplay/collection-view";

export default async function CollectionPage() {
  const active = await getActiveChild();
  if (!active) redirect("/");
  const data = await getCollection(active.id);
  return <CollectionView childName={active.name} data={data} />;
}
