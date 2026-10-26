import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import AnnouncementForm from "../../AnnouncementForm";

export const metadata: Metadata = { title: "Edit Announcement" };
export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await db.announcement.findUnique({
    where: { slug },
    include: {
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 2,
      },
    },
  });

  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Announcement</h1>
          <p className="page-subtitle">/{item.slug}</p>
        </div>
      </div>
      <AnnouncementForm announcement={item} />
    </div>
  );
}
