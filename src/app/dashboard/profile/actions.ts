"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { requireSession, hashPassword, verifyPassword } from "@/lib/auth";
import { sendEmail, brandedEmailHtml } from "@/lib/email";
import { JOURNAL, siteUrl } from "@/lib/constants";

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

export type RequestResetState = { success?: boolean; message?: string; error?: string };

export async function requestPasswordResetEmailAction(): Promise<RequestResetState> {
  const sessionUser = await requireSession();
  const dbUser = await db.user.findUnique({ where: { id: sessionUser.id } });
  if (!dbUser || !dbUser.isActive) {
    return { error: "Account not found or inactive." };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.deleteMany({ where: { userId: dbUser.id } });
  await db.passwordResetToken.create({
    data: {
      userId: dbUser.id,
      token,
      expiresAt,
    },
  });

  const baseUrl = siteUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: dbUser.email,
    subject: `Password Reset Request - ${JOURNAL.title}`,
    text: `Dear ${dbUser.name},\n\nA request was made to change the password for your ${JOURNAL.title} account.\n\nYour secure reset code is:\n${token}\n\nYou can click the link below (valid for 1 hour) or copy the security code above and paste it into the reset box:\n\n${resetUrl}\n\nIf you did not request this change, please ignore this message.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
    html: brandedEmailHtml({
      title: `Password Reset Request - ${JOURNAL.title}`,
      bodyHtml: `
        <h3 style="color: #7b1113; margin-top: 0;">Password Reset Request</h3>
        <p>Dear <strong>${dbUser.name}</strong>,</p>
        <p>A request was made to change your password for <strong>${JOURNAL.title}</strong>.</p>
        <div style="background-color: #f7f6f2; border: 1px dashed #7b1113; padding: 14px; text-align: center; margin: 20px 0; border-radius: 4px;">
          <span style="font-size: 11px; text-transform: uppercase; color: #666666; display: block; letter-spacing: 0.05em; margin-bottom: 4px;">Your Reset Security Code</span>
          <code style="font-size: 15px; font-weight: bold; color: #7b1113; letter-spacing: 0.05em; font-family: monospace;">${token}</code>
        </div>
        <p>You can either copy and paste this security code into the reset box, or click the button below (link is valid for 1 hour):</p>
      `,
      ctaText: "Change Password Now",
      ctaUrl: resetUrl,
    }),
    template: "password-reset",
  });

  return {
    success: true,
    message: `A secure reset link and code has been sent to ${dbUser.email}. Check your inbox to change your password.`,
  };
}
