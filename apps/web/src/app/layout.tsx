import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Plateforme citoyenne",
  description: "Ce que la décision publique change pour vous.",
};

/**
 * Aucune balise de mesure, aucune police distante, aucun script tiers.
 * Règle non négociable n° 2 : la plateforme ne vous observe pas.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
