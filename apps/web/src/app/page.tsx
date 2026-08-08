import { redirect } from "next/navigation";
import { LANGUE_DEFAUT } from "../i18n/index.ts";

export default function Racine() {
  redirect(`/${LANGUE_DEFAUT}/decisions`);
}
