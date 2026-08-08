/**
 * Couche HTTP commune aux connecteurs — brief § 10, « cache et politesse ».
 *
 * Un portail public n'a aucune obligation de nous servir. On s'identifie, on
 * laisse un contact, on limite la cadence, et on réessaie avec temporisation
 * plutôt que de marteler. C'est aussi ce qui évite de se faire couper l'accès.
 */

export const CONTACT = "https://github.com/CFeyants/plateforme-citoyenne";
export const USER_AGENT = `PlateformeCitoyenne/0.1 (+${CONTACT})`;

export interface OptionsHttp {
  /** Millisecondes minimales entre deux requêtes vers le même hôte. */
  cadenceMs?: number;
  tentatives?: number;
  timeoutMs?: number;
  /** Journal facultatif — l'ingestion l'utilise pour rendre compte. */
  journal?: (msg: string) => void;
}

const dernierAppel = new Map<string, number>();
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ErreurHttp extends Error {
  statut: number;
  url: string;
  constructor(statut: number, url: string, message?: string) {
    super(message ?? `${statut} sur ${url}`);
    this.name = "ErreurHttp";
    this.statut = statut;
    this.url = url;
  }
}

export async function getJson<T = unknown>(
  url: string,
  accept = "application/json",
  opts: OptionsHttp = {},
): Promise<T> {
  const { cadenceMs = 250, tentatives = 4, timeoutMs = 30_000, journal } = opts;
  const hote = new URL(url).host;

  // Cadence par hôte : on n'envoie jamais deux requêtes coup sur coup.
  const attente = (dernierAppel.get(hote) ?? 0) + cadenceMs - Date.now();
  if (attente > 0) await dormir(attente);
  dernierAppel.set(hote, Date.now());

  let derniere: unknown;
  for (let essai = 1; essai <= tentatives; essai++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, {
        headers: { Accept: accept, "User-Agent": USER_AGENT },
        signal: ctrl.signal,
      });
      clearTimeout(t);

      // 4xx hors 429 : inutile de réessayer, la requête est fautive.
      if (!r.ok && r.status !== 429 && r.status < 500) {
        throw new ErreurHttp(r.status, url);
      }
      if (!r.ok) throw new ErreurHttp(r.status, url);
      return (await r.json()) as T;
    } catch (e) {
      clearTimeout(t);
      derniere = e;
      if (e instanceof ErreurHttp && e.statut < 500 && e.statut !== 429) throw e;
      if (essai === tentatives) break;
      const pause = Math.min(8000, 400 * 2 ** (essai - 1));
      journal?.(`  reprise ${essai}/${tentatives - 1} dans ${pause} ms — ${String(e)}`);
      await dormir(pause);
    }
  }
  throw derniere instanceof Error ? derniere : new Error(String(derniere));
}
