// app/fonts.ts
import { Baloo_2, Nunito_Sans, Atkinson_Hyperlegible } from "next/font/google";

export const baloo = Baloo_2({
  subsets: ["latin"], weight: ["600", "700", "800"],
  variable: "--font-baloo", display: "swap",
});
export const nunito = Nunito_Sans({
  subsets: ["latin"], weight: ["400", "600", "700"],
  variable: "--font-nunito", display: "swap",
});
export const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"], weight: ["400", "700"],
  variable: "--font-atkinson", display: "swap",
});
