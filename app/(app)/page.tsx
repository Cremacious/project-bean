import { getParent } from "@/lib/session";
import { listChildren } from "@/lib/children";
import { getActiveChild } from "@/lib/active-child";
import { ChildPicker } from "@/components/profiles/child-picker";
import { Library } from "@/components/library";

export default async function Home({ searchParams }: { searchParams: Promise<{ age?: string }> }) {
  const parent = (await getParent())!;
  const kids = await listChildren(parent.id);
  const active = await getActiveChild();
  if (kids.length === 0 || !active) {
    return <ChildPicker kids={kids} needsFirst={kids.length === 0} />;
  }
  const { age } = await searchParams;
  return <Library activeChild={active} ageBand={age} />;
}
