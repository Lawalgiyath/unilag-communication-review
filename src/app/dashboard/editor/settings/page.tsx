import type { Metadata } from "next";
import { db } from "@/lib/db";
import { JOURNAL } from "@/lib/constants";
import SettingsClient from "./client";

export const metadata: Metadata = { title: "Journal Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const dbSettings = await db.setting.findMany();
  const settingsObj = dbSettings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  return <SettingsClient settings={settingsObj} defaults={JOURNAL as unknown as Record<string, string>} />;
}
