import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ProfilePageClient from "./client";

export const metadata: Metadata = { title: "My Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await requireSession();
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, title: true, affiliation: true, orcid: true, bio: true, country: true, email: true },
  });

  if (!user) return null;
  return <ProfilePageClient user={user} />;
}
