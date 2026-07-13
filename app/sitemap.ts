import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { buildSitemap } from "@/lib/seo";

// Served at /sitemap.xml. A static Route Handler (no request-time API), so
// `new Date()` is evaluated once at build time and stamps the deploy time as
// each page's lastModified. proxy.ts allowlists /sitemap.xml so crawlers reach
// it instead of being redirected to /sign-in.
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(SITE_URL, new Date());
}
