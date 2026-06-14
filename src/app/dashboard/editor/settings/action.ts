"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const SettingsSchema = z.record(z.string(), z.string());

export type SettingsState = { errors?: Record<string, string[]>; success?: boolean };

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const raw: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) {
      raw[key] = value;
    }
  });

  const parsed = SettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: { form: ["Invalid submission"] } };
  }

  const d = parsed.data;

  // Upsert all keys
  for (const [key, value] of Object.entries(d)) {
    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // Revalidate the whole site since settings are used globally
  revalidatePath("/", "layout");

  return { success: true };
}
