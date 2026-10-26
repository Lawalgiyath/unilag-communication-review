import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import EditPageForm from "./EditPageForm";

export const metadata: Metadata = { title: "Edit CMS Page" };
export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await db.page.findUnique({
    where: { slug },
    include: {
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 2,
      },
    },
  });

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Page</h1>
          <p className="page-subtitle">/{page.slug}</p>
        </div>
        <Link href={`/${page.slug}`} target="_blank" className="btn btn-ghost btn-sm">
          View public page ↗
        </Link>
      </div>
      <EditPageForm
        pageId={page.id}
        slug={page.slug}
        title={page.title}
        body={page.body}
        revisions={page.revisions}
      />
    </div>
  );
}
