// Served at /twitter-image. proxy.ts allowlists it so crawlers reach the image
// instead of being redirected to /sign-in. Shares one renderer with the Open
// Graph card (lib/og-image.tsx) so both stay byte-identical. The card type is set
// to summary_large_image in app/layout.tsx.
import { renderOgImage } from "@/lib/og-image";

export { alt, size, contentType } from "@/lib/og-image";

export default function Image() {
  return renderOgImage();
}
