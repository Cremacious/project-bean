// components/admin/wizard/template-shape.tsx
// Presentational, illustrative branch shapes for the template picker. These are
// author-facing previews of a template's feel; they need not equal the exact
// generated graph. Colors: start navy, scene blue, choice plum, good leaf,
// surprise sun. Every shape is decorative and labelled for screen readers.
import type { TemplateId } from "@bedtime-quests/core/stories/wizard/types";

const START = "#16283A", SCENE = "#5AA9E6", CHOICE = "#8A5CF6", GOOD = "#2FB98A", SURPRISE = "#FFC24B";

const LABELS: Record<TemplateId, string> = {
  "twin-trails": "Two little paths, each with a few scenes, leading to happy endings.",
  "two-paths-meet": "Two paths that join at a shared scene, then split into endings.",
  "branching-tree": "Forks within forks, a small maze of choices.",
  "adventure-trail": "A long river of choices toward one finale, with gentle detours.",
  blank: "A blank start page you grow by hand.",
};

function Node({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <rect x={x} y={y} width={22} height={14} rx={5} fill={fill} />;
}
function Edge({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c7d0d8" strokeWidth={2} />;
}

export function TemplateShape({ id }: { id: TemplateId }) {
  return (
    <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid meet" role="img" aria-label={LABELS[id]} className="block h-full w-full">
      {id === "twin-trails" && (
        <>
          <Edge x1={80} y1={22} x2={40} y2={38} /><Edge x1={80} y1={22} x2={120} y2={38} />
          <Edge x1={40} y1={52} x2={40} y2={66} /><Edge x1={120} y1={52} x2={120} y2={66} />
          <Edge x1={40} y1={80} x2={40} y2={92} /><Edge x1={120} y1={80} x2={120} y2={92} />
          <Node x={69} y={8} fill={START} />
          <Node x={29} y={38} fill={CHOICE} /><Node x={109} y={38} fill={CHOICE} />
          <Node x={29} y={66} fill={SCENE} /><Node x={109} y={66} fill={SCENE} />
          <Node x={29} y={92} fill={GOOD} /><Node x={109} y={92} fill={GOOD} />
        </>
      )}
      {id === "two-paths-meet" && (
        <>
          <Edge x1={80} y1={22} x2={45} y2={38} /><Edge x1={80} y1={22} x2={115} y2={38} />
          <Edge x1={45} y1={52} x2={80} y2={66} /><Edge x1={115} y1={52} x2={80} y2={66} />
          <Edge x1={80} y1={80} x2={50} y2={92} /><Edge x1={80} y1={80} x2={110} y2={92} />
          <Node x={69} y={8} fill={START} />
          <Node x={34} y={38} fill={SCENE} /><Node x={104} y={38} fill={SCENE} />
          <Node x={69} y={66} fill={CHOICE} />
          <Node x={39} y={92} fill={GOOD} /><Node x={99} y={92} fill={GOOD} />
        </>
      )}
      {id === "branching-tree" && (
        <>
          <Edge x1={80} y1={22} x2={45} y2={38} /><Edge x1={80} y1={22} x2={115} y2={38} />
          <Edge x1={45} y1={52} x2={25} y2={92} /><Edge x1={45} y1={52} x2={62} y2={92} />
          <Edge x1={115} y1={52} x2={98} y2={92} /><Edge x1={115} y1={52} x2={135} y2={92} />
          <Node x={69} y={8} fill={START} />
          <Node x={34} y={38} fill={CHOICE} /><Node x={104} y={38} fill={CHOICE} />
          <Node x={14} y={92} fill={GOOD} /><Node x={51} y={92} fill={GOOD} />
          <Node x={87} y={92} fill={GOOD} /><Node x={124} y={92} fill={SURPRISE} />
        </>
      )}
      {id === "adventure-trail" && (
        <>
          <Edge x1={45} y1={16} x2={45} y2={30} /><Edge x1={45} y1={44} x2={45} y2={58} />
          <Edge x1={45} y1={72} x2={45} y2={86} />
          <Edge x1={67} y1={37} x2={100} y2={37} /><Edge x1={67} y1={65} x2={100} y2={65} />
          <Node x={34} y={2} fill={START} />
          <Node x={34} y={30} fill={CHOICE} /><Node x={100} y={30} fill={SURPRISE} />
          <Node x={34} y={58} fill={CHOICE} /><Node x={100} y={58} fill={SURPRISE} />
          <Node x={34} y={86} fill={GOOD} />
        </>
      )}
      {id === "blank" && (
        <>
          <Node x={69} y={48} fill={START} />
          <text x={80} y={78} textAnchor="middle" fontSize={11} fontWeight={700} fill="#8a97a2">Start only</text>
        </>
      )}
    </svg>
  );
}
