// Served at /opengraph-image. proxy.ts allowlists it so crawlers reach the image
// instead of being redirected to /sign-in. Shares one renderer with the Twitter
// card (lib/og-image.tsx) so both stay byte-identical.
import { renderOgImage } from "@/lib/og-image";

export { alt, size, contentType } from "@/lib/og-image";

export default function Image() {
  return renderOgImage();
}
