import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LANGUES, estLangue } from "../../i18n/index.ts";

export function generateStaticParams() {
  return LANGUES.map((langue) => ({ langue }));
}

/**
 * Le layout ne porte que la coquille HTML : le chrome applicatif dépend du
 * territoire, qui vit dans `?t=`, et un layout Next ne reçoit pas les
 * paramètres d'URL. Il est donc rendu par chaque écran via `<Cadre>`.
 */
export default async function LangueLayout(
  { children, params }: { children: ReactNode; params: Promise<{ langue: string }> },
) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();
  return (
    <html lang={langue}>
      {/* Aucune balise de mesure, aucune police distante, aucun script tiers. */}
      <body>{children}</body>
    </html>
  );
}
