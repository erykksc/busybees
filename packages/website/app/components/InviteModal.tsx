import { useState } from "react";
import type { GroupCalendarDto } from "@busybees/core";

interface InviteModalProps {
  group: any;
  members: any;
  onRemove: (userId: string) => Promise<void>;
  onClose: () => void;
}

export default function InviteModal({
  group,
  members,
  onRemove,
  onClose,
}: InviteModalProps) {
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const inviteLink =
    group.inviteUrl || `${window.location.origin}/invite/${group.inviteCode}`;

  const membersList = Array.isArray(members)
    ? members
    : members instanceof Set
      ? Array.from(members)
      : typeof members === "object" && members !== null
        ? Object.values(members).filter(Boolean)
        : [];
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Invite link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
      alert("Failed to copy invite link.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Group Members</h2>

        <ul className="mb-4">
          {membersList.length > 0 ? (
            membersList.map((member) => (
              <li
                key={member}
                className="flex justify-between items-center mb-2"
              >
                <span>{member}</span>
                <button
                  onClick={() => setPendingRemove(member)}
                  className="text-red-500 hover:underline"
                >
                  🗑 Remove
                </button>
              </li>
            ))
          ) : (
            <li className="text-gray-500 text-sm">
              No members yet. Share the invite link below to add members!
            </li>
          )}
        </ul>

        {/* Copy Invite Link */}
        <div className="mt-6">
          <label className="block text-sm font-semibold mb-1">
            Invite Link
          </label>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 border px-3 py-2 rounded-l bg-gray-100 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="bg-yellow-300 hover:bg-yellow-400 text-sm px-3 py-2 rounded-r font-semibold"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="text-right mt-6">
          <button onClick={onClose} className="underline text-sm text-gray-500">
            Close
          </button>
        </div>

        {/* Confirmation Modal */}
        {pendingRemove && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm font-cute text-gray-800">
              <h3 className="text-lg mb-4 text-center">
                Are you sure you want to remove <br />
                <span className="text-black font-bold">{pendingRemove}</span>
                from the calendar?
              </h3>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setPendingRemove(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-all shadow text-sm"
                >
                  No, Cancel
                </button>
                <button
                  onClick={async () => {
                    await onRemove(pendingRemove!);
                    setPendingRemove(null);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow text-sm"
                >
                  Yes. Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
