import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function resolveDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL;
  if (
    rawUrl &&
    (rawUrl.startsWith("postgres://") ||
      rawUrl.startsWith("postgresql://") ||
      rawUrl.startsWith("mysql://"))
  ) {
    return rawUrl;
  }

  const isServerless =
    process.env.VERCEL === "1" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.NODE_ENV === "production";

  if (isServerless) {
    const tmpDir = process.env.TMPDIR || "/tmp";
    const tmpDbPath = path.join(tmpDir, "journal.db");

    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), "prisma", "journal-template.db"),
        path.join(process.cwd(), "data", "journal.db"),
        path.resolve("./prisma/journal-template.db"),
        path.resolve("./data/journal.db"),
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            break;
          } catch (e) {
            console.error("Failed to copy template db to tmp:", candidate, e);
          }
        }
      }
    }

    if (fs.existsSync(tmpDbPath)) {
      return `file:${tmpDbPath}`;
    }
  }

  return rawUrl || "file:../data/journal.db";
}

const dbUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

