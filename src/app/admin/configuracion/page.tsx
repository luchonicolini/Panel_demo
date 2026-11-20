import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { getRepo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuración",
};

export default async function SettingsPage() {
  const settings = await getRepo().getSettings();
  return <SettingsForm settings={settings} />;
}
