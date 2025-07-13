import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { useAuth } from "react-oidc-context";
import { useUserProfile } from "../hooks/useUserProfile";
import { removeUserFromGroup } from "../hooks/group";
import type { GroupInfoDto } from "@busybees/core";

interface BurgerMenuProps {
  onCreateGroup: () => void;
  onClose: () => void;
}

export default function BurgerMenu({
  onCreateGroup,
  onClose,
}: BurgerMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, loading, error } = useUserProfile();
  const { groupId } = useParams<{ groupId?: string }>();
  const auth = useAuth();
  const [pendingRemove, setPendingRemove] = useState<GroupInfoDto | null>(null);

  const isPersonalCalendar = location.pathname === "/my-calendar";
  const activeGroupId = groupId;
  const userId = auth.user?.profile?.sub as string;

  return (
    <div className="fixed top-0 left-0 w-72 h-full bg-white shadow-xl z-50 p-6 flex flex-col">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-2xl font-bold text-gray-600 hover:text-red-500 transition"
      >
        ✖
      </button>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
        Calendars
      </h3>

      {/* List */}
      <ul className="space-y-3 flex-1 overflow-y-auto">
        <li>
          <button
            onClick={() => {
              navigate("/my-calendar");
              onClose();
            }}
            className={`w-full text-left px-4 py-2 rounded-full shadow font-medium ${
              isPersonalCalendar
                ? "bg-[#fbc289] text-gray-800"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            }`}
          >
            My Calendar
          </button>
        </li>

        {loading && (
          <li className="text-center text-gray-500">Loading groups...</li>
        )}

        {error && <li className="text-center text-red-500 text-sm">{error}</li>}

        {userProfile?.groups.map((group) => (
          <li
            key={group.name}
            className={`flex justify-between items-center px-3 py-2 rounded-lg shadow-sm ${
              activeGroupId === group.name ? "bg-[#fbc289]" : "bg-gray-100"
            }`}
          >
            <button
              onClick={() => {
                navigate(`/calendar/${group.name}`);
                onClose();
              }}
              className={`text-left font-medium w-full text-sm ${
                activeGroupId === group.name
                  ? "text-gray-800"
                  : "text-gray-700 hover:underline"
              }`}
            >
              {group.name}
              {group.isOwner && (
                <span className="ml-1 text-xs text-purple-600">👑</span>
              )}
            </button>
            <button
              onClick={() => setPendingRemove(group)}
              className="text-red-500 hover:text-red-700"
              title="Leave group"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      {/* Create Group Button */}
      <button
        onClick={onCreateGroup}
        className="mt-6 bg-purple-200 text-purple-800 px-4 py-2 rounded-full shadow-md hover:bg-purple-300 transition-all"
      >
        + Create Group Calendar
      </button>

      {/* Confirmation Modal */}
      {pendingRemove && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm font-cute text-gray-800">
            <h3 className="text-lg mb-4 text-center">
              Are you sure you want to leave <br />
              <span className="text-black font-bold">{pendingRemove.name}</span>
              ?
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
                  if (!userId) return;
                  try {
                    await removeUserFromGroup(pendingRemove.name, userId);
                    if (activeGroupId === pendingRemove.name) {
                      navigate("/my-calendar");
                    }
                  } catch (e) {
                    console.error("Failed to leave group:", e);
                  }
                  setPendingRemove(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow text-sm"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
