import type { Metadata } from "next";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./globals.css";
import { baloo, nunito, atkinson } from "./fonts";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: BRAND.fullName,
    template: `%s · ${BRAND.name}`,
  },
  description: `${BRAND.slogan} ${BRAND.subtitle}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} ${atkinson.variable}`}>
      <body>{children}</body>
    </html>
  );
}
