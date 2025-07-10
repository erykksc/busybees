import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth } from "react-oidc-context";
import ProfileMenu from "../components/ProfileMenu";
import BurgerMenu from "../components/BurgerMenu";
// WARN: the route shouldn't be imported here at all
import ProfileSettings from "../routes/settings";
import { removeUserFromGroup } from "../hooks/group";
import type { Group } from "../types";
import type { GroupCalendarDto, UserProfileDto } from "@busybees/core";

interface CalendarLayoutProps {
  onProfile: () => void;
  burgerMenuProps: any; // you can replace 'any' with a more specific type if available
}

export default function CalendarLayout({
  onProfile,
  burgerMenuProps,
}: CalendarLayoutProps) {
  const auth = useAuth();
  const user = {
    id: auth.user?.profile?.id as string,
    email: auth.user?.profile?.email as string,
  };
  const [localGroups, setLocalGroups] = useState<GroupCalendarDto[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showExternalDropdown, setShowExternalDropdown] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>("personal");
  const [connectedCalendars, setConnectedCalendars] = useState<string[]>([]);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [isNameValid, setIsNameValid] = useState(false);
  const [nameError, setNameError] = useState<string>("");
  const [makeEventsPublic, setMakeEventsPublic] = useState(false);
  const [loadingIntegration, setLoadingIntegration] = useState<"Google"|"Microsoft"|"Apple"|null>(null);

  const handleAddGoogleCalendar = async () => {
    try {
      const response = await fetch(`/api/oauth/google/start`, {
        headers: {
          Authorization: `Bearer ${auth.user?.access_token}`,
        },
      });

      console.log("Response from OAuth start:", response);

      if (response.ok) {
        console.log("OAuth flow started successfully");
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          console.error("No redirect URL returned from the server");
        }
      }
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
    }
  };
  // if (auth.isLoading) {
  //   return <div>Loading...</div>;
  // }


  const integrations: Record<string, () => void> = {
    Google: handleAddGoogleCalendar,
    Microsoft: () => alert("Microsoft coming soon"),
    Apple: () => alert("Apple coming soon"),
  };

  const handleIntegrationClick = async (type: "Google"|"Microsoft"|"Apple") => {
    setShowExternalDropdown(false);
    setLoadingIntegration(type);
    try {
      await integrations[type]();
    } catch (e) {
      console.error(`Error with ${type} integration:`, e);
    } finally {
      setLoadingIntegration(null);
    }
  };


  useEffect(() => {
    const fetchGroups = async () => {
      if (!auth.user) return;
      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${auth.user.access_token}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch user profile");
          return;
        }

        const data = await response.json();
        const userProfile = data.userProfile as UserProfileDto;
        if (userProfile.groupNames) {
          setLocalGroups(data.groups ?? []);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchGroups();
  }, [auth.user]);

  const handleCreateGroup = () => {
    setShowCreateGroup(true);
  };

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

  const handleInviteFriends = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || !auth.user) {
      setIsNameValid(false);
      setNameError("Please enter a name for your shared calendar");
      return;
    }

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user.access_token}`,
        },
        body: JSON.stringify({
          name: trimmed,
          makeEventsPublic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const newGroup: GroupCalendarDto = await response.json();
      setLocalGroups((prev) => [...prev, newGroup]);
      // const inviteLink = `${window.location.origin}/invite/${newGroup.groupId}`;
      await navigator.clipboard.writeText(newGroup.inviteUrl);
      alert(`Invite link copied: ${newGroup.inviteUrl}`);
      setShowCreateGroup(false);
      setNewGroupName("");
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const tabs = [
    { id: "personal", type: "personal", name: "My Calendar" },
    ...localGroups.map((g) => ({ id: g.groupId, type: "group", group: g })),
  ];

  useEffect(() => {
    if (tabs.length > 1 && activeTabId === "personal") {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || {
    type: "personal",
  };
  const isGroupTab = activeTab.type === "group";

  return (
    <div className="flex flex-col h-screen font-cute bg-[#fff9e7] text-gray-800">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setBurgerOpen(true)}
            className="focus:outline-none"
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-gray-800" />
              <div className="w-5 h-0.5 bg-gray-800" />
              <div className="w-5 h-0.5 bg-gray-800" />
            </div>
          </button>
          <div className="text-lg font-semibold">
            {isGroupTab ? (activeTab as any).group?.name : "My Calendar"}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-auto relative">
          <div className="relative">
            <button
              onClick={() => setShowExternalDropdown((p) => !p)}
              disabled={!!loadingIntegration}
              className={`
                flex items-center space-x-2
                bg-blue-200 text-blue-800 px-3 py-1 rounded-full shadow-md
                transition-all text-sm
                ${loadingIntegration
                  ? "opacity-70 cursor-wait"
                  : "hover:bg-blue-300"
                }
              `}
            >
              {loadingIntegration ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span>Connecting…</span>
                </>
              ) : (
                <span>Add Your Calendar ▾</span>
              )}
            </button>

            {showExternalDropdown && !loadingIntegration && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                {( ["Google","Microsoft","Apple"] as const ).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleIntegrationClick(type)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center"
                  >
                    {type} Calendar
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <ProfileMenu
              show={showProfileMenu}
              onToggle={() => setShowProfileMenu(!showProfileMenu)}
            />
            {showProfileSettings && (
              <ProfileSettings
                addedCalendars={connectedCalendars}
                onRemoveCalendar={(calendar: string) =>
                  setConnectedCalendars((prev) =>
                    prev.filter((c) => c !== calendar),
                  )
                }
                onAddCalendar={(type: string) => {
                  if (!connectedCalendars.includes(type)) {
                    setConnectedCalendars((prev) => [...prev, type]);
                  } else {
                    alert(`${type} Calendar already added.`);
                  }
                }}
                onClose={() => setShowProfileSettings(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Outlet
          context={{ activeTab, makeEventsPublic, setMakeEventsPublic }}
        />
      </div>

      {burgerOpen && (
        <BurgerMenu
          activeTabId={activeTabId}
          //localGroups={localGroups}
          localGroups={localGroups.map((g) => ({
            id: g.groupId,
            name: g.groupId,
            members: g.members,
          }))}
          onSelectCalendar={(calendar: any) => {
            if (calendar === "personal") {
              setActiveTabId("personal");
            } else {
              setActiveTabId(calendar.id);
            }
            setBurgerOpen(false);
          }}
          onCreateGroup={() => {
            setBurgerOpen(false);
            setShowCreateGroup(true);
          }}
          onRemoveGroup={async (group: Group) => {
            if (user && window.confirm(`Remove yourself from ${group.name}?`)) {
              try {
                await removeUserFromGroup(group.id, user.id);
                setLocalGroups((prev) =>
                  prev.filter((g) => g.groupId !== group.id),
                );
              } catch (e) {
                alert("Failed to leave the group.");
                console.error(e);
              }
            }
          }}
          onClose={() => setBurgerOpen(false)}
        />
      )}

      <div className="flex justify-around border-t p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`px-4 py-2 rounded-full shadow-md font-cute transition-all ${
              activeTabId === tab.id
                ? "bg-[#fbc289] text-gray-800"
                : "bg-[#ffea96] text-gray-700 hover:bg-[#fff2a0]"
            }`}
          >
            {tab.type === "personal"
              ? "My Calendar"
              : `${(tab as any).group.name}`}
          </button>
        ))}

        <button
          onClick={handleCreateGroup}
          className="bg-purple-200 text-purple-800 px-4 py-2 rounded-full shadow-md hover:bg-purple-300 transition-all"
        >
          Create Group Calendar
        </button>
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Create Group Calendar</h2>
            <input
              type="text"
              placeholder="Calendar name..."
              value={newGroupName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-2"
            />
            {nameError && (
              <p className="text-red-500 text-sm mb-2">{nameError}</p>
            )}
            <div className="flex items-center mb-4">
              <label htmlFor="privacyToggle" className="mr-2 text-sm">
                Make my event titles public
              </label>
              <input
                id="privacyToggle"
                type="checkbox"
                checked={makeEventsPublic}
                onChange={() => setMakeEventsPublic(!makeEventsPublic)}
                className="w-4 h-4"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleInviteFriends}
                disabled={!isNameValid}
                className={`${
                  isNameValid
                    ? "bg-green-200 text-green-800 px-4 py-2 rounded-full shadow-md hover:bg-green-300 transition-all"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                Create Calendar & Copy Invite Link
              </button>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="mt-3 text-sm underline text-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
