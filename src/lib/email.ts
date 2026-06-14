import nodemailer from "nodemailer";
import { db } from "./db";

/**
 * Email sending that never throws and never blocks the editorial workflow.
 * - With SMTP_HOST configured: sends via nodemailer, logs result to EmailLog.
 * - Without: logs the message to the console and records DEV_LOGGED.
 * Always call AFTER the database transaction has committed.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  template: string; // template identifier for the EmailLog
}

function transporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const from =
    process.env.SMTP_FROM ??
    "UNILAG Communication Review <no-reply@localhost>";
  const t = transporter();

  if (!t) {
    console.log(
      `[email:dev] ${JSON.stringify({ to: msg.to, subject: msg.subject, text: msg.text }, null, 2)}`
    );
    await safeLog(msg, "DEV_LOGGED", null);
    return;
  }

  try {
    await t.sendMail({ from, to: msg.to, subject: msg.subject, text: msg.text });
    await safeLog(msg, "SENT", null);
  } catch (err) {
    console.error(`[email:failed] to=${msg.to} subject=${msg.subject}`, err);
    await safeLog(msg, "FAILED", err instanceof Error ? err.message : String(err));
  }
}

async function safeLog(
  msg: EmailMessage,
  status: "SENT" | "FAILED" | "DEV_LOGGED",
  error: string | null
): Promise<void> {
  try {
    await db.emailLog.create({
      data: {
        to: msg.to,
        subject: msg.subject,
        template: msg.template,
        status,
        error,
      },
    });
  } catch {
    // logging must never throw
  }
}
