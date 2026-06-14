import type { Metadata } from "next";
import BoardForm from "../BoardForm";

export const metadata: Metadata = { title: "New Board Member" };

export default function NewBoardMemberPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Board Member</h1>
          <p className="page-subtitle">Add a member to the editorial board</p>
        </div>
      </div>
      <BoardForm />
    </div>
  );
}
