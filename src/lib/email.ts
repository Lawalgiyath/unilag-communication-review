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
  html?: string;
  template: string; // template identifier for the EmailLog
}

export function cleanEmailText(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u2014\u2013]/g, "-") // replace em-dash and en-dash with standard hyphen
    .replace(/&mdash;|&ndash;/g, "-")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ""); // strip emojis
}

async function getTransporterAndFrom() {
  let host = process.env.SMTP_HOST;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  let port = Number(process.env.SMTP_PORT ?? 465);
  let from =
    process.env.SMTP_FROM ??
    "UNILAG Communication Review <lawalgiyath200716@gmail.com>";

  if (!user || !pass) {
    try {
      const rows = await db.setting.findMany({
        where: {
          key: {
            in: [
              "smtp_host",
              "smtp_user",
              "smtp_pass",
              "smtp_port",
              "smtp_from",
            ],
          },
        },
      });
      const map = new Map(rows.map((r) => [r.key, r.value]));
      if (map.get("smtp_host")) host = map.get("smtp_host")!;
      if (map.get("smtp_user")) user = map.get("smtp_user")!;
      if (map.get("smtp_pass")) pass = map.get("smtp_pass")!.replace(/\s+/g, "");
      if (map.get("smtp_port")) port = Number(map.get("smtp_port")!);
      if (map.get("smtp_from")) from = map.get("smtp_from")!;
    } catch {
      // fallback
    }
  }

  // 1. Direct Gmail Support (via service: "gmail")
  if (host === "smtp.gmail.com" || user?.endsWith("@gmail.com")) {
    if (!user || !pass) return { transporter: null, from };
    return {
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      }),
      from,
    };
  }

  // 2. Direct SendGrid API key support
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    return {
      transporter: nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        auth: {
          user: "apikey",
          pass: sendgridKey,
        },
      }),
      from,
    };
  }

  // 3. Generic SMTP configuration (UNILAG relay or other SMTP)
  if (!host) return { transporter: null, from };
  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    }),
    from,
  };
}

export function brandedEmailHtml(opts: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const ctaButton =
    opts.ctaText && opts.ctaUrl
      ? `
    <div style="margin: 28px 0; text-align: center;">
      <a href="${opts.ctaUrl}" style="background-color: #7b1113; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 4px; display: inline-block; letter-spacing: 0.05em; text-transform: uppercase;">
        ${opts.ctaText}
      </a>
    </div>
  `
      : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${opts.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #1a1a1a; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e0; border-radius: 6px; overflow: hidden;">
          <tr>
            <td style="background-color: #7b1113; padding: 24px 32px; border-bottom: 3px solid #d4af37;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">
                UNILAG Communication Review
              </h2>
              <p style="color: #f3d9b1; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">
                Faculty of Communication and Media Studies, University of Lagos
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; font-size: 15px; color: #2d2d2d;">
              ${cleanEmailText(opts.bodyHtml)}
              ${ctaButton}
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 28px 0;" />
              <p style="font-size: 13px; color: #666666; margin: 0;">
                Warm regards,<br />
                <strong>Editorial Office</strong><br />
                UNILAG Communication Review<br />
                <a href="https://unilag.edu.ng" style="color: #7b1113; text-decoration: none;">University of Lagos, Nigeria</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #faf9f6; padding: 16px 32px; font-size: 11px; color: #888888; text-align: center; border-top: 1px solid #e5e5e0;">
              This is an automated notification from UNILAG Communication Review (ISSN: 1597-0299, E-ISSN: 3027-1851).
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const { transporter: t, from } = await getTransporterAndFrom();

  const sanitizedSubject = cleanEmailText(msg.subject);
  const sanitizedText = cleanEmailText(msg.text);
  const sanitizedHtml = msg.html ? cleanEmailText(msg.html) : undefined;

  if (!t) {
    console.log(
      `[email:dev] ${JSON.stringify({ to: msg.to, subject: sanitizedSubject, text: sanitizedText }, null, 2)}`
    );
    await safeLog({ ...msg, subject: sanitizedSubject, text: sanitizedText }, "DEV_LOGGED", null);
    return;
  }

  try {
    await t.sendMail({
      from,
      to: msg.to,
      subject: sanitizedSubject,
      text: sanitizedText,
      html: sanitizedHtml,
    });
    await safeLog({ ...msg, subject: sanitizedSubject, text: sanitizedText }, "SENT", null);
  } catch (err) {
    console.error(`[email:failed] to=${msg.to} subject=${sanitizedSubject}`, err);
    await safeLog({ ...msg, subject: sanitizedSubject, text: sanitizedText }, "FAILED", err instanceof Error ? err.message : String(err));
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

export async function testSmtpConnection(targetEmail?: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const { transporter: t, from } = await getTransporterAndFrom();
  if (!t) {
    return {
      ok: false,
      message:
        "No SMTP credentials configured. Please set SMTP settings in Editor Settings or .env.",
    };
  }

  try {
    await t.verify();
    if (targetEmail) {
      await t.sendMail({
        from,
        to: targetEmail,
        subject: "UNILAG Communication Review - SMTP Test",
        text: "This is a test email confirming that automated notifications are functioning properly.",
        html: brandedEmailHtml({
          title: "SMTP Configuration Test",
          bodyHtml: "<p>This is a test notification confirming that the automated email delivery system is active and operating normally.</p>",
        }),
      });
      return {
        ok: true,
        message: `SMTP verified and test email sent successfully to ${targetEmail}!`,
      };
    }
    return {
      ok: true,
      message: "SMTP server verified successfully and ready to deliver emails.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `SMTP verification failed: ${msg}` };
  }
}
