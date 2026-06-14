import { db } from "@/lib/db";
import { dayHash, clientIp } from "@/lib/views";
import { Prisma } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await db.article.findFirst({
    where: { id, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!article) return new Response(null, { status: 404 });

  const ip = clientIp(req.headers);
  const ua = req.headers.get("user-agent") ?? "unknown";
  const hash = dayHash(ip, ua, id);

  try {
    await db.$transaction([
      db.articleView.create({ data: { articleId: id, dayHash: hash } }),
      db.article.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      }),
    ]);
  } catch (e) {
    // P2002 = already viewed today; anything else is also non-fatal
    if (
      !(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
    ) {
      console.error("view-count error", e);
    }
  }
  return new Response(null, { status: 204 });
}
