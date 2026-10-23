"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = {
  errors?: {
    password?: string[];
    confirmPassword?: string[];
    form?: string[];
  };
};

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = ResetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { token, password } = parsed.data;

  // Look up token
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return {
      errors: {
        form: [
          "This password reset link is invalid or has expired. Please request a new one.",
        ],
      },
    };
  }

  const newHash = await hashPassword(password);

  // Update password, delete all reset tokens and existing sessions for this user
  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: newHash },
    }),
    db.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
    db.session.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  redirect("/login?reset=success");
}
