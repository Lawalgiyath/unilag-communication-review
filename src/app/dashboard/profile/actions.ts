"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth";

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().optional(),
  affiliation: z.string().min(2, "Affiliation is required"),
  orcid: z
    .string()
    .regex(/^(\d{4}-\d{4}-\d{4}-\d{3}[\dX])?$/, "Invalid ORCID format")
    .optional()
    .or(z.literal("")),
  bio: z.string().optional(),
  country: z.string().optional(),
});

export type ProfileState = { errors?: Record<string, string[]>; success?: boolean };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireSession();
  const raw = {
    name: formData.get("name"),
    title: formData.get("title"),
    affiliation: formData.get("affiliation"),
    orcid: formData.get("orcid"),
    bio: formData.get("bio"),
    country: formData.get("country"),
  };
  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      name: d.name,
      title: d.title || null,
      affiliation: d.affiliation,
      orcid: d.orcid || null,
      bio: d.bio || null,
      country: d.country || null,
    },
  });
  return { success: true };
}

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordState = { errors?: Record<string, string[]>; success?: boolean };

export async function updatePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireSession();
  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };
  const parsed = PasswordSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { errors: { currentPassword: ["Account not found"] } };

  const valid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) return { errors: { currentPassword: ["Incorrect current password"] } };

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
  return { success: true };
}
