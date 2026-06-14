import Link from "next/link";
import { JOURNAL } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="font-display text-xl font-semibold text-ink hover:text-maroon">
          {JOURNAL.shortTitle}
        </Link>
        <div className="double-rule mx-auto mt-2 w-16" aria-hidden="true" />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-8 text-xs text-secondary">
        © {new Date().getFullYear()} {JOURNAL.title}
      </p>
    </div>
  );
}
