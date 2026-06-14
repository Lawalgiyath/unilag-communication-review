/**
 * Create (or promote) an admin/editor account from the command line.
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> "<Full Name>" [password]
 *
 * If no password is given, a random one is generated and printed once.
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();

async function main() {
  const [email, name, passwordArg] = process.argv.slice(2);
  if (!email || !name) {
    console.error(
      'Usage: npx tsx scripts/create-admin.ts <email> "<Full Name>" [password]'
    );
    process.exit(1);
  }

  const password = passwordArg ?? randomBytes(9).toString("base64url");
  const passwordHash = hashSync(password, 12);

  const existing = await db.user.findUnique({
    where: { email },
    include: { roles: true },
  });

  if (existing) {
    const have = new Set(existing.roles.map((r) => r.role));
    for (const role of ["ADMIN", "EDITOR"]) {
      if (!have.has(role)) {
        await db.userRole.create({ data: { userId: existing.id, role } });
      }
    }
    if (passwordArg) {
      await db.user.update({ where: { email }, data: { passwordHash } });
      console.log(`Updated existing user ${email}: roles ensured (ADMIN, EDITOR), password reset.`);
    } else {
      console.log(`Updated existing user ${email}: roles ensured (ADMIN, EDITOR). Password unchanged.`);
    }
    return;
  }

  await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      affiliation: "University of Lagos, Nigeria",
      roles: { create: [{ role: "ADMIN" }, { role: "EDITOR" }] },
    },
  });
  console.log(`Created admin account: ${email}`);
  if (!passwordArg) {
    console.log(`Generated password (shown once, change after first login): ${password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
