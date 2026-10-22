import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const board = await db.boardMember.findMany({ orderBy: { order: "asc" } });
  console.log(JSON.stringify(board, null, 2));
  await db.$disconnect();
}
main();
