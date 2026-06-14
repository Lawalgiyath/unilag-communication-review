import { requireSession, requireRole } from "@/lib/auth";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);
  return <>{children}</>;
}
