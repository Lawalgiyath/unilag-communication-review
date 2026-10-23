"use client";

import { useTransition } from "react";
import { toggleUserRoleAction, toggleUserActiveAction } from "./actions";

interface UserRowActionsProps {
  userId: string;
  isReviewer: boolean;
  isEditor: boolean;
  isActive: boolean;
}

export function UserRowActions({
  userId,
  isReviewer,
  isEditor,
  isActive,
}: UserRowActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggleRole(role: string, currentHasRole: boolean) {
    startTransition(async () => {
      try {
        await toggleUserRoleAction(userId, role, currentHasRole);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update role");
      }
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      try {
        await toggleUserActiveAction(userId, isActive);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update user status");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleToggleRole("REVIEWER", isReviewer)}
        className={`btn btn-sm text-[11px] py-1 px-2.5 ${
          isReviewer ? "btn-ghost text-red-700 hover:bg-red-50" : "btn-secondary"
        }`}
        title={isReviewer ? "Remove reviewer privileges" : "Grant reviewer access"}
      >
        {isReviewer ? "Remove Reviewer" : "Make Reviewer"}
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => handleToggleRole("EDITOR", isEditor)}
        className={`btn btn-sm text-[11px] py-1 px-2.5 ${
          isEditor ? "btn-ghost text-red-700 hover:bg-red-50" : "btn-secondary"
        }`}
        title={isEditor ? "Revoke editorial board access" : "Grant editorial board access"}
      >
        {isEditor ? "Remove Editor" : "Make Editor"}
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={handleToggleActive}
        className={`btn btn-sm text-[11px] py-1 px-2.5 ${
          isActive
            ? "btn-ghost text-gray-500 hover:text-red-700"
            : "btn-ghost text-green-700 hover:bg-green-50"
        }`}
        title={isActive ? "Deactivate user login access" : "Re-activate user account"}
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}
