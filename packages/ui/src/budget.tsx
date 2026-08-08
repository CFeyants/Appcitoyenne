/**
 * Primitives du budget — décomposition part-à-tout et comparaison par emphase.
 *
 * Une seule teinte, du clair au foncé : le brief n'autorise qu'une couleur
 * d'accent, et un jeu catégoriel de quatre teintes constituerait un second
 * système. Chaque segment porte son étiquette, ce qui rend la lecture possible
 * sans confier l'identité à la couleur. Contrastes des étiquettes vérifiés :
 * 5,0:1 au pire dans les deux thèmes.
 */

const TEINTES = ["var(--part-1)", "var(--part-2)", "var(--part-3)", "var(--part-4)"];
// Les deux premiers crans sont clairs : encre foncée. Les deux derniers : encre claire.
const ENCRES = ["var(--sur-part-fonce)", "var(--sur-part-fonce)", "var(--sur-part-clair)", "var(--sur-part-clair)"];

export interface Part { nom: string; valeur: number; }

export function BarreParts({ parts, total, formatPart, formatValeur, seuilEtiquette = 9 }: {
  parts: Part[];
  total: number;
  formatPart: (pourcentage: number) => string;
  formatValeur: (valeur: number) => string;
  /** En deçà de ce pourcentage, l'étiquette ne tiendrait pas : elle passe en légende. */
  seuilEtiquette?: number;
}) {
  return (
    <>
      <div className="parts">
        {parts.map((p, i) => {
          const pc = total === 0 ? 0 : (p.valeur / total) * 100;
          return (
            <div key={p.nom} className="part"
              style={{ flex: pc, background: TEINTES[i % 4], color: ENCRES[i % 4] }}
              title={`${p.nom} — ${formatValeur(p.valeur)} · ${formatPart(pc)}`}>
              {pc > seuilEtiquette && <span className="part-etiquette">{formatPart(pc)}</span>}
            </div>
          );
        })}
      </div>
      <div className="parts-legende">
        {parts.map((p, i) => {
          const pc = total === 0 ? 0 : (p.valeur / total) * 100;
          return (
            <span key={p.nom}>
              <i style={{ background: TEINTES[i % 4] }} aria-hidden="true" />
              {p.nom} <b>{formatPart(pc)}</b>
            </span>
          );
        })}
      </div>
    </>
  );
}

export interface Comparee { nom: string; valeur: number; moi?: boolean; }

/** Emphase, pas arc-en-ciel : la ligne du territoire courant est en accent. */
export function Comparaison({ lignes, format }: { lignes: Comparee[]; format: (v: number) => string }) {
  const max = Math.max(...lignes.map((l) => l.valeur), 1);
  const tri = [...lignes].sort((a, b) => b.valeur - a.valeur);
  return (
    <div className="comparaison">
      {tri.map((l) => (
        <div key={l.nom} className="comparaison-ligne">
          <div className={l.moi ? "comparaison-nom moi" : "comparaison-nom"}>{l.nom}</div>
          <div>
            <div className={l.moi ? "comparaison-barre moi" : "comparaison-barre"}
              style={{ width: `${(l.valeur / max) * 100}%` }}
              title={`${l.nom} — ${format(l.valeur)}`} />
          </div>
          <div className={l.moi ? "comparaison-val moi" : "comparaison-val"}>{format(l.valeur)}</div>
        </div>
      ))}
    </div>
  );
}

export function ChiffreHeros({ valeur, legende }: { valeur: string; legende: string }) {
  return (
    <>
      <p className="heros">{valeur}</p>
      <p className="heros-legende">{legende}</p>
    </>
  );
}
