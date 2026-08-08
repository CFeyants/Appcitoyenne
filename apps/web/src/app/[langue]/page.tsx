import { redirect } from "next/navigation";

export default async function LangueRacine({ params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params;
  redirect(`/${langue}/decisions`);
}
