// apps/mobile/src/navigation/types.ts
//
// The native navigation model. Auth and the child picker are not stack routes;
// they are GATE states derived from the session + active reader (mirroring the
// web flow: signed out -> auth, signed in with no active reader -> child picker).
// Everything reachable once a reader is chosen is a typed stack route below.
export type Route =
  | { name: "Library" }
  | { name: "Reader"; slug: string }
  | { name: "Paywall"; storySlug: string; storyTitle: string }
  | { name: "Achievements" };

export type RouteName = Route["name"];
