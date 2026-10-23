"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { JOURNAL } from "@/lib/constants";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    title: z.string().optional(),
    affiliation: z.string().min(2, "Affiliation is required"),
    orcid: z
      .string()
      .regex(/^(\d{4}-\d{4}-\d{4}-\d{3}[\dX])?$/, "Invalid ORCID format (xxxx-xxxx-xxxx-xxxx)")
      .optional()
      .or(z.literal("")),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterState = {
  errors?: Record<string, string[]>;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: formData.get("name"),
    title: formData.get("title"),
    affiliation: formData.get("affiliation"),
    orcid: formData.get("orcid"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  const normalizedEmail = d.email.toLowerCase().trim();

  try {
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return { errors: { email: ["An account with this email already exists."] } };
    }

    const passwordHash = await hashPassword(d.password);
    const user = await db.user.create({
      data: {
        name: d.name,
        title: d.title || null,
        affiliation: d.affiliation,
        orcid: d.orcid || null,
        email: normalizedEmail,
        passwordHash,
        isActive: true,
      },
    });

    await db.userRole.create({ data: { userId: user.id, role: "AUTHOR" } });

    await sendEmail({
      to: normalizedEmail,
      subject: `Welcome to ${JOURNAL.title}`,
      text: `Dear ${d.name},\n\nYour account has been created. You can now log in and submit manuscripts at ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://unilag-communication-review.vercel.app"}.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
      template: "welcome",
    });

    await createSession(user.id);
  } catch (error) {
    console.error("Registration error:", error);
    return {
      errors: {
        email: [
          error instanceof Error
            ? `Unable to complete registration: ${error.message}`
            : "Registration could not be completed. Please try again.",
        ],
      },
    };
  }

  redirect("/dashboard");
}
