"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { sendEmail, brandedEmailHtml } from "@/lib/email";
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unilag-communication-review.vercel.app";
    const dashboardUrl = `${siteUrl}/dashboard/submissions/new`;

    await sendEmail({
      to: normalizedEmail,
      subject: `Welcome to ${JOURNAL.title}`,
      text: `Dear ${d.name},\n\nYour account has been created successfully. You can now log in and submit manuscripts at ${siteUrl}.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
      html: brandedEmailHtml({
        title: `Welcome to ${JOURNAL.title}`,
        bodyHtml: `
          <h3 style="color: #7b1113; margin-top: 0;">Account Created Successfully</h3>
          <p>Dear <strong>${d.name}</strong>,</p>
          <p>Welcome to <strong>${JOURNAL.title}</strong>, the peer-reviewed scholarly journal published by the Faculty of Communication and Media Studies, University of Lagos.</p>
          <p>Your author account has been activated. You can now sign in to your dashboard to submit original research manuscripts, track peer reviews in real time, and manage your revisions.</p>
        `,
        ctaText: "Go to Dashboard & Submit Manuscript",
        ctaUrl: dashboardUrl,
      }),
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
