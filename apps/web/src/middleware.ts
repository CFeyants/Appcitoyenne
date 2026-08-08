import { NextResponse, type NextRequest } from "next/server";

/**
 * « Chaque écran expose son JSON à la même URL suffixée .json » (§ 10).
 *
 * Une page ne peut pas rendre du JSON ; on réécrit donc `/fr/x/y.json` vers un
 * gestionnaire de route unique. L'URL publique reste celle que le brief exige.
 */
export function middleware(requete: NextRequest) {
  const { pathname, search } = requete.nextUrl;
  if (!pathname.endsWith(".json")) return NextResponse.next();

  const segments = pathname.replace(/\.json$/, "").split("/").filter(Boolean);
  const [langue, ...reste] = segments;
  if (!langue || reste.length === 0) return NextResponse.next();

  const url = requete.nextUrl.clone();
  url.pathname = `/${langue}/donnees/${reste.join("/")}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/((?!_next|favicon).*)",
};
