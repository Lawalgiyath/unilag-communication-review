import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BoardForm from "../../BoardForm";

export const metadata: Metadata = { title: "Edit Board Member" };
export const dynamic = "force-dynamic";

export default async function EditBoardMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await db.boardMember.findUnique({ where: { id } });

  if (!member) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Board Member</h1>
          <p className="page-subtitle">{member.name}</p>
        </div>
      </div>
      <BoardForm member={member} />
    </div>
  );
}
