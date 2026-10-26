"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

export type LoginState = {
  errors?: { email?: string[]; password?: string[]; form?: string[] };
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, next } = parsed.data;
  let destination = next && next.startsWith("/") ? next : "/dashboard";

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return { errors: { form: ["Invalid email or password."] } };
    }

    // Check if account is scheduled for deletion (30-day retention)
    if (!user.isActive && user.scheduledDeletionDate) {
      const now = new Date();
      if (now > user.scheduledDeletionDate) {
        return {
          errors: {
            form: [
              "This account was scheduled for deletion and has expired after the 30-day retention window.",
            ],
          },
        };
      }

      // Check password to restore
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return { errors: { form: ["Invalid email or password."] } };
      }

      // Restore account immediately
      await db.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          deletedAt: null,
          scheduledDeletionDate: null,
        },
      });

      await createSession(user.id);
      destination = "/dashboard?restored=true";
      redirect(destination);
    }

    if (!user.isActive) {
      return { errors: { form: ["This account has been deactivated. Please contact the editorial office."] } };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { errors: { form: ["Invalid email or password."] } };
    }

    await createSession(user.id);
  } catch (error) {
    // Re-throw Next.js redirect errors so navigation succeeds
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Login action error:", error);
    return {
      errors: {
        form: [
          error instanceof Error
            ? `Login error: ${error.message}`
            : "Unable to sign in. Please try again.",
        ],
      },
    };
  }

  redirect(destination);
}
