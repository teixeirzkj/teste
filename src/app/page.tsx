import { connection } from "next/server";
import { Storefront } from "@/components/store/Storefront";
import { getStorefront } from "@/lib/server/catalog";

export default async function Home() {
  // Sempre lê o banco na hora: alterações do painel aparecem imediatamente na loja.
  await connection();
  const data = await getStorefront();
  return <Storefront {...data} />;
}
