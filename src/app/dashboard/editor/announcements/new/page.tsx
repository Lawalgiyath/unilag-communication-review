import type { Metadata } from "next";
import AnnouncementForm from "../AnnouncementForm";

export const metadata: Metadata = { title: "New Announcement" };

export default function NewAnnouncementPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Announcement</h1>
          <p className="page-subtitle">Create a news item or call for papers</p>
        </div>
      </div>
      <AnnouncementForm />
    </div>
  );
}
