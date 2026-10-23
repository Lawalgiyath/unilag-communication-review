import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { DisputeForm } from "./DisputeForm";
import { formatSubmissionNumber } from "@/lib/types";

export const metadata: Metadata = {
  title: "Authorship Dispute & Ethical Notice | UNILAG Communication Review",
  description:
    "Formal mechanism for authors and researchers to register objections, unauthorized submissions, or plagiarism under COPE guidelines.",
};

export const dynamic = "force-dynamic";

export default async function DisputePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; email?: string }>;
}) {
  const { id, email } = await searchParams;

  let sub = null;
  if (id) {
    sub = await db.submission.findUnique({
      where: { id },
      include: {
        correspondingAuthor: { select: { name: true, email: true } },
      },
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="text-xs text-secondary mb-4">
        <Link href="/" className="hover:text-maroon">
          Home
        </Link>
        {" / "}
        <span className="text-ink">Authorship Dispute Registration</span>
      </nav>

      <div className="page-header border-b border-hairline pb-4">
        <div>
          <span className="rounded bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
            COPE Ethics Protocol
          </span>
          <h1 className="page-title mt-2">Authorship Dispute &amp; Ethical Notice</h1>
          <p className="page-subtitle mt-1">
            UNILAG Communication Review enforces strict adherence to Committee on Publication Ethics (COPE) core practices. All contributing authors must authorize manuscript submission.
          </p>
        </div>
      </div>

      {!sub ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 mt-6">
          <h3 className="font-semibold text-base">Manuscript Link Not Specified or Expired</h3>
          <p className="mt-2 text-sm">
            We could not resolve the specific manuscript reference from the URL link. If you received a co-author notification email, please ensure you clicked the complete link.
          </p>
          <p className="mt-3 text-sm">
            Alternatively, if you believe your research has been submitted or published without your consent, please contact the Editor-in-Chief directly:
          </p>
          <div className="mt-4 rounded border border-amber-300 bg-white p-3 font-mono text-xs">
            Editorial Office: <a href="mailto:lawalgiyath200716@gmail.com" className="text-maroon underline">lawalgiyath200716@gmail.com</a>
          </div>
          <div className="mt-5">
            <Link href="/" className="btn btn-secondary btn-sm">
              Return to Journal Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="rounded border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 mb-6 leading-relaxed">
            <strong>About this process:</strong> Filing a dispute initiates an immediate investigation by the Editorial Office. Under COPE standards, the manuscript will be held from further review, acceptance, or publication until all authorship queries are resolved in writing.
          </div>

          <DisputeForm
            submissionId={sub.id}
            submissionRef={formatSubmissionNumber(sub.number, sub.submittedAt.getFullYear())}
            title={sub.title}
            correspondingAuthorName={sub.correspondingAuthor.name}
            defaultEmail={email ?? ""}
          />
        </div>
      )}
    </div>
  );
}
