import type { Metadata } from "next";
import { TableQrCodes } from "@/components/admin/TableQrCodes";
import { getSettings } from "@/lib/server/catalog";
import { guardPage } from "@/lib/server/guard";

export const metadata: Metadata = { title: "QR Codes das mesas", robots: { index: false, follow: false } };

export default async function MesasPage() {
  await guardPage(["admin"]);
  const s = await getSettings();
  return <TableQrCodes count={s.tableCount} logo={s.logo} storeName={s.storeName} enabled={s.tablesEnabled} siteUrl={process.env.SITE_URL ?? ""} />;
}
