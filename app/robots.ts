import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { buildRobots } from "@/lib/seo";

// Served at /robots.txt. proxy.ts allowlists /robots.txt so crawlers reach it
// instead of being redirected to /sign-in.
export default function robots(): MetadataRoute.Robots {
  return buildRobots(SITE_URL);
}
