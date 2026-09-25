import { Dashboard } from "@/components/admin/Dashboard";
import { guardPage } from "@/lib/server/guard";

export default async function AdminHome() {
  const admin = await guardPage(["admin"]);
  return <Dashboard name={admin.name} />;
}
