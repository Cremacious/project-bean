import type { Metadata } from "next";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./globals.css";
import { baloo, nunito, atkinson } from "./fonts";

export const metadata: Metadata = {
  title: "Storytime",
  description: "Interactive bedtime stories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} ${atkinson.variable}`}>
      <body>{children}</body>
    </html>
  );
}
