import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PublishForm from "./PublishForm";

export const metadata: Metadata = { title: "Publish Article" };
export const dynamic = "force-dynamic";

export default async function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sub, issues] = await Promise.all([
    db.submission.findUnique({
      where: { id },
      select: { title: true, status: true, submittedAt: true },
    }),
    db.issue.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      include: { volume: true },
    }),
  ]);

  if (!sub || !["ACCEPTED", "IN_PRODUCTION"].includes(sub.status)) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Publish Article</h1>
          <p className="page-subtitle line-clamp-1">{sub.title}</p>
        </div>
        <Link href={`/dashboard/editor/submissions/${id}`} className="btn btn-ghost btn-sm">← Back</Link>
      </div>
      <PublishForm submissionId={id} issues={issues.map(i => ({ id: i.id, label: `Vol. ${i.volume.number}, No. ${i.number} (${i.volume.year})` }))} />
    </div>
  );
}
