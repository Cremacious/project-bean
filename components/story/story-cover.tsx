// components/story/story-cover.tsx
// Deterministic paper-cut cover art derived from the story slug. Pure CSS shapes.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const GROUNDS = ["#BFE3FF", "#FFE3D9", "#DCF5EA", "#EDE7FF", "#FFF1CC"];

export function StoryCover({ slug, className = "" }: { slug: string; className?: string }) {
  const h = hash(slug);
  const motif = h % 5;
  const ground = GROUNDS[(h >> 3) % GROUNDS.length];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: ground }}
      aria-hidden="true"
    >
      {motif === 0 && (
        <>
          <span className="absolute left-4 top-4 h-8 w-8 rounded-full" style={{ background: "var(--pc-sun)" }} />
          <span className="absolute inset-x-0 bottom-0 h-11" style={{ background: "var(--pc-leaf)", borderRadius: "100% 90% 0 0 / 44px 36px 0 0" }} />
        </>
      )}
      {motif === 1 && (
        <>
          <span className="absolute right-5 top-3 h-9 w-7" style={{ background: "var(--pc-poppy)", borderRadius: "50% 50% 46% 46%" }} />
          <span className="absolute left-4 bottom-4 h-6 w-6 rounded-full" style={{ background: "var(--pc-plum)" }} />
        </>
      )}
      {motif === 2 && (
        <>
          <span className="absolute inset-x-0 bottom-0 h-9" style={{ background: "#7FD8FF", borderRadius: "60% 40% 0 0 / 32px 24px 0 0" }} />
          <span className="absolute right-6 bottom-5 h-6 w-10" style={{ background: "#8C93A8", borderRadius: "40% 50% 20% 30%" }} />
        </>
      )}
      {motif === 3 && (
        <>
          <span className="absolute left-5 top-4 h-9 w-9 rotate-[-8deg] rounded-xl" style={{ background: "var(--pc-plum)" }} />
          <span className="absolute inset-x-0 bottom-0 h-10" style={{ background: "var(--pc-sun)", borderRadius: "100% 90% 0 0 / 40px 32px 0 0" }} />
        </>
      )}
      {motif === 4 && (
        <>
          <span className="absolute left-1/2 top-4 h-10 w-10 -translate-x-1/2 rounded-full" style={{ background: "var(--pc-sun)" }} />
          <span className="absolute inset-x-0 bottom-0 h-8" style={{ background: "var(--pc-poppy)", borderRadius: "100% 100% 0 0 / 30px 30px 0 0" }} />
        </>
      )}
    </div>
  );
}
