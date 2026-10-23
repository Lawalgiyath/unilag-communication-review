"use server";

import { z } from "zod";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { JOURNAL } from "@/lib/constants";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type ForgotPasswordState = {
  success?: boolean;
  message?: string;
  errors?: { email?: string[] };
  devResetUrl?: string;
};

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const raw = {
    email: formData.get("email"),
  };

  const parsed = ForgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  const genericSuccess =
    "If an account exists with this email address, we have sent instructions to reset your password.";

  if (!user || !user.isActive) {
    // Return generic success to prevent email enumeration
    return { success: true, message: genericSuccess };
  }

  // Generate a cryptographically secure reset token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

  // Clear any existing reset tokens for this user and store new one
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: `Password Reset Request — ${JOURNAL.title}`,
    text: `Dear ${user.name},\n\nA request was made to reset the password for your ${JOURNAL.title} account.\n\nClick the link below (valid for 1 hour) to set a new password:\n\n${resetUrl}\n\nIf you did not request this change, you can safely ignore this email.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
    template: "password-reset",
  });

  // If running in development or when SMTP host is not configured, provide the link directly for testing convenience
  const isDevOrNoSmtp = !process.env.SMTP_HOST || process.env.NODE_ENV !== "production";

  return {
    success: true,
    message: genericSuccess,
    devResetUrl: isDevOrNoSmtp ? resetUrl : undefined,
  };
}
