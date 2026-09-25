import { SettingsPage } from "@/components/admin/SettingsPage";
import { guardPage } from "@/lib/server/guard";

export default async function ConfiguracoesPage() {
  const me = await guardPage(["admin"]);
  return <SettingsPage me={me} />;
}
