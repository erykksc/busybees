import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { useUserProfile } from "../hooks/useUserProfile";
import CreateGroupModal from "./CreateGroupModal";

interface BottomBarProps {
  onCreateGroup: () => void;
}

export default function BottomBar({ onCreateGroup }: BottomBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { userProfile } = useUserProfile();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isNameValid, setIsNameValid] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [makeEventsPublic, setMakeEventsPublic] = useState(false);

  const handleNameChange = (value: string) => {
    const trimmed = value.trim();
    setNewGroupName(value);
    if (trimmed.length === 0) {
      setIsNameValid(false);
      setNameError("Please enter a name for your shared calendar");
    } else {
      setIsNameValid(true);
      setNameError("");
    }
  };

  const handleCreateGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || !auth.user) {
      setIsNameValid(false);
      setNameError("Please enter a name for your shared calendar");
      return;
    }

    setIsCreatingGroup(true);
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user.access_token}`,
        },
        body: JSON.stringify({ groupId: trimmed, makeEventsPublic }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const { groupCalendar: newGroup } = await response.json();

      await navigator.clipboard.writeText(newGroup.inviteUrl);
      alert(`Invite link copied: ${newGroup.inviteUrl}`);

      setShowCreateGroup(false);
      setNewGroupName("");
      navigate(`/calendar/${newGroup.groupId}`);
      // Note: userProfile will be refetched automatically by useUserProfile
    } catch (err) {
      console.error("Error creating group:", err);
      alert("There was an error creating a group calendar.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCreateGroupClick = () => {
    setShowCreateGroup(true);
    onCreateGroup();
  };

  return (
    <>
      <nav className="flex justify-around border-t p-2 bg-gray-50">
        <Link
          to="/my-calendar"
          className={`px-4 py-2 rounded-full transition ${
            pathname === "/my-calendar"
              ? "bg-yellow-300 text-gray-800"
              : "bg-yellow-100 text-gray-600 hover:bg-yellow-200"
          }`}
        >
          My Calendar
        </Link>

        {userProfile?.groups.map((group) => {
          const to = `/calendar/${encodeURIComponent(group.name)}`;
          const isActive = pathname === to;
          return (
            <Link
              key={group.name}
              to={to}
              className={`px-4 py-2 rounded-full transition ${
                isActive
                  ? "bg-yellow-300 text-gray-800"
                  : "bg-yellow-100 text-gray-600 hover:bg-yellow-200"
              }`}
            >
              {group.name}
              {group.isOwner && <span className="ml-1 text-xs">👑</span>}
            </Link>
          );
        })}

        <button
          onClick={handleCreateGroupClick}
          className="bg-purple-200 text-purple-800 px-4 py-2 rounded-full shadow-md hover:bg-purple-300 transition-all"
        >
          Create Group Calendar
        </button>
      </nav>

      {showCreateGroup && (
        <CreateGroupModal
          newGroupName={newGroupName}
          onNameChange={handleNameChange}
          nameError={nameError}
          isNameValid={isNameValid}
          isCreatingGroup={isCreatingGroup}
          makeEventsPublic={makeEventsPublic}
          onTogglePublic={() => setMakeEventsPublic(!makeEventsPublic)}
          onCreateGroup={handleCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </>
  );
}
