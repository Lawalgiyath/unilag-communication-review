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
  const destination = next && next.startsWith("/") ? next : "/dashboard";

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.isActive) {
      return { errors: { form: ["Invalid email or password."] } };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { errors: { form: ["Invalid email or password."] } };
    }

    await createSession(user.id);
  } catch (error) {
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
