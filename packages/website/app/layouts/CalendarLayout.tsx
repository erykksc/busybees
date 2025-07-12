// import { useState, useEffect } from "react";
// import { Outlet, useNavigate, Link, useLocation, useParams } from "react-router";
// import { useAuth } from "react-oidc-context";
// import ProfileMenu from "../components/ProfileMenu";
// import BurgerMenu from "../components/BurgerMenu";
// // WARN: the route shouldn't be imported here at all
// import ProfileSettings from "../routes/settings";
// import { removeUserFromGroup } from "../hooks/group";
// import type { GroupCalendarDto, UserProfileDto } from "@busybees/core";
// import { Toast } from "../components/Toast";

// interface CalendarLayoutProps {
//   onProfile: () => void;
//   burgerMenuProps: any; // you can replace 'any' with a more specific type if available
// }

// export default function CalendarLayout({
// }: CalendarLayoutProps) {
//   const auth = useAuth();
//   const navigate = useNavigate();
//   const { pathname } = useLocation();
//   const { groupId } = useParams<{ groupId?: string }>();

//   // your logged-in user
//   const user = {
//     id: auth.user?.profile?.sub as string,
//     email: auth.user?.profile?.email as string,
//   };

//   // list of group calendars this user belongs to
//   const [localGroups, setLocalGroups] = useState<GroupCalendarDto[]>([]);
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [showExternalDropdown, setShowExternalDropdown] = useState(false);
//   const [burgerOpen, setBurgerOpen] = useState(false);
//   const [connectedCalendars, setConnectedCalendars] = useState<string[]>([]);
//   const [showProfileSettings, setShowProfileSettings] = useState(false);
//   const [showCreateGroup, setShowCreateGroup] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [isNameValid, setIsNameValid] = useState(false);
//   const [nameError, setNameError] = useState("");
//   const [makeEventsPublic, setMakeEventsPublic] = useState(false);
//   const [loadingIntegration, setLoadingIntegration] = useState<"Google"|"Microsoft"|"Apple"|null>(null);
//   const [toast, setToast] = useState<{message:string}|null>(null);
//   const [isCreatingGroup, setIsCreatingGroup] = useState(false);
//   const showError = (msg: string) => setToast({ message: msg });
//   const [groups, setGroups] = useState<GroupCalendarDto[]>([]);
//   const [loadingGroups, setLoadingGroups] = useState(true);
//   const [activeTabId, setActiveTabId] = useState("")

//   useEffect(() => {
//     if (!auth.user) return;
//     (async () => {
//       try {
//         const profileRes = await fetch("/api/user/profile", {
//           headers: { Authorization: `Bearer ${auth.user?.access_token}` },
//         });
//         if (!profileRes.ok) throw new Error("Failed to fetch profile");
//         const { userProfile } = (await profileRes.json()) as {
//           userProfile: UserProfileDto;
//         };

//         // fetch each group calendar by ID
//         const calendars = await Promise.all(
//           (userProfile.groupNames || []).map(async (gid) => {
//             const res = await fetch(
//               `/api/groups/${encodeURIComponent(gid)}`,
//               { headers: { Authorization: `Bearer ${auth.user!.access_token}` } }
//             );
//             if (!res.ok) {
//               console.warn("Could not load group", gid);
//               return null;
//             }
//             return (await res.json()) as GroupCalendarDto;
//           })
//         );

//         setGroups(calendars.filter((g): g is GroupCalendarDto => !!g));
//       } catch (e) {
//         console.error(e);
//         showError("Could not load your shared calendars.");
//       } finally {
//         setLoadingGroups(false);
//       }
//     })();
//   }, [auth.user]);

//   const handleSelectCalendar = (calendar: { id: string } | "personal") => {
//     if (calendar === "personal") {
//       navigate("/calendar");
//     } else {
//       navigate(`/calendar/${calendar.id}`);
//     }
//     setBurgerOpen(false);
//   };

//   const handleAddGoogleCalendar = async () => {
//     try {
//       const response = await fetch(`/api/oauth/google/start`, {
//         headers: {
//           Authorization: `Bearer ${auth.user?.access_token}`,
//         },
//       });

//       console.log("Response from OAuth start:", response);

//       if (response.ok) {
//         console.log("OAuth flow started successfully");
//         const data = await response.json();
//         if (data.redirectUrl) {
//           window.location.href = data.redirectUrl;
//         } else {
//           console.error("No redirect URL returned from the server");
//         }
//       }
//     } catch (error) {
//       console.error("Error starting OAuth flow:", error);
//       showError("There was an error completing this request.");
//     }
//   };

//   const integrations: Record<string, () => void> = {
//     Google: handleAddGoogleCalendar,
//     Microsoft: () => alert("Microsoft coming soon"),
//     Apple: () => alert("Apple coming soon"),
//   };

//   const handleIntegrationClick = async (
//     type: "Google" | "Microsoft" | "Apple",
//   ) => {
//     setShowExternalDropdown(false);
//     setLoadingIntegration(type);
//     try {
//       await integrations[type]();
//     } catch (e) {
//       console.error(`Error with ${type} integration:`, e);
//     } finally {
//       setLoadingIntegration(null);
//     }
//   };

//   const handleCreateGroup = () => {
//     setShowCreateGroup(true);
//   };

//   const handleNameChange = (value: string) => {
//     const trimmed = value.trim();
//     setNewGroupName(value);
//     if (trimmed.length === 0) {
//       setIsNameValid(false);
//       setNameError("Please enter a name for your shared calendar");
//     } else {
//       setIsNameValid(true);
//       setNameError("");
//     }
//   };

//   const handleInviteFriends = async () => {
//     const trimmed = newGroupName.trim();
//     if (!trimmed || !auth.user) {
//       setIsNameValid(false);
//       setNameError("Please enter a name for your shared calendar");
//       return;
//     }

//     setIsCreatingGroup(true);
//     try {
//       const response = await fetch("/api/groups", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${auth.user.access_token}`,
//         },
//         body: JSON.stringify({
//           groupId: trimmed,
//           makeEventsPublic,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to create group");
//       }

//       const newGroup = (await response.json())
//         .groupCalendar as GroupCalendarDto;
//       setLocalGroups((prev) => [...prev, newGroup]);
//       await navigator.clipboard.writeText(newGroup.inviteUrl);
//       alert(`Invite link copied: ${newGroup.inviteUrl}`);
//       setShowCreateGroup(false);
//       setNewGroupName("");
//     } catch (err) {
//       console.error("Error creating group:", err);
//       showError("There was an error creating a group calendar.");
//     } finally {
//       setIsCreatingGroup(false);
//     }
//   };

//   const tabs = [
//     { id: "personal", type: "personal", name: "My Calendar" },
//     ...localGroups.map((g) => ({ id: g.groupId, type: "group", group: g })),
//   ];

//   // useEffect(() => {
//   //   if (tabs.length > 1 && activeTabId === "personal") {
//   //     setActiveTabId(tabs[0].id);
//   //   }
//   // }, [tabs]);

//   useEffect(() => {
//        setActiveTabId(groupId ?? "personal");
//      }, [groupId]);

//   const activeTab = tabs.find((t) => t.id === activeTabId)
//                   ?? { id: "personal", type: "personal" as const, name: "My Calendar" };
//   const isGroupTab = activeTab.type === "group";

//   return (
//     <div className="flex flex-col h-screen font-cute bg-[#fff9e7] text-gray-800">
//       {/* Top Bar */}
//       <div className="flex justify-between items-center px-4 py-2 border-b">
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={() => setBurgerOpen(true)}
//             className="focus:outline-none"
//           >
//             <div className="space-y-1">
//               <div className="w-5 h-0.5 bg-gray-800" />
//               <div className="w-5 h-0.5 bg-gray-800" />
//               <div className="w-5 h-0.5 bg-gray-800" />
//             </div>
//           </button>
//           <div className="text-lg font-semibold">
//             {isGroupTab ? (activeTab as any).group?.groupId : "My Calendar"}
//           </div>
//         </div>

//         <div className="flex items-center space-x-2 ml-auto relative">
//           <div className="relative">
//             <button
//               onClick={() => setShowExternalDropdown((p) => !p)}
//               disabled={!!loadingIntegration}
//               className={`
//                 flex items-center space-x-2
//                 bg-blue-200 text-blue-800 px-3 py-1 rounded-full shadow-md
//                 transition-all text-sm
//                 ${
//                   loadingIntegration
//                     ? "opacity-70 cursor-wait"
//                     : "hover:bg-blue-300"
//                 }
//               `}
//             >
//               {loadingIntegration ? (
//                 <>
//                   <svg
//                     className="animate-spin h-4 w-4"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     />
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                     />
//                   </svg>
//                   <span>Connecting…</span>
//                 </>
//               ) : (
//                 <span>Add Your Calendar ▾</span>
//               )}
//             </button>

//             {showExternalDropdown && !loadingIntegration && (
//               <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
//                 {(["Google", "Microsoft", "Apple"] as const).map((type) => (
//                   <button
//                     key={type}
//                     onClick={() => handleIntegrationClick(type)}
//                     className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center"
//                   >
//                     {type} Calendar
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="flex items-center space-x-2">
//             <ProfileMenu
//               show={showProfileMenu}
//               onToggle={() => setShowProfileMenu(!showProfileMenu)}
//             />
//             {showProfileSettings && (
//               <ProfileSettings
//                 addedCalendars={connectedCalendars}
//                 onRemoveCalendar={(calendar: string) =>
//                   setConnectedCalendars((prev) =>
//                     prev.filter((c) => c !== calendar),
//                   )
//                 }
//                 onAddCalendar={(type: string) => {
//                   if (!connectedCalendars.includes(type)) {
//                     setConnectedCalendars((prev) => [...prev, type]);
//                   } else {
//                     alert(`${type} Calendar already added.`);
//                   }
//                 }}
//                 onClose={() => setShowProfileSettings(false)}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         <Outlet
//       context={{
//         activeTab,
//         makeEventsPublic,
//         setMakeEventsPublic,
//         group: activeTab.type === "group" ? (activeTab as any).group : undefined,
//       }}
//     />

//       </div>

//       {burgerOpen && (
//         <BurgerMenu
//           activeTabId={activeTabId}
//           localGroups={localGroups.map((g) => ({
//             id: g.groupId,
//             name: g.groupId,
//             members: g.members,
//           }))}
//            onSelectCalendar={handleSelectCalendar}
//           // onSelectCalendar={(calendar: any) => {
//           //   if (calendar === "personal") {
//           //     setActiveTabId("personal");
//           //   } else {
//           //     setActiveTabId(calendar.id);
//           //   }
//           //   setBurgerOpen(false);
//           // }}
//           onCreateGroup={() => {
//             setBurgerOpen(false);
//             setShowCreateGroup(true);
//           }}
//           onRemoveGroup={async (group: GroupCalendarDto) => {
//             if (
//               user &&
//               window.confirm(`Remove yourself from ${group.groupId}?`)
//             ) {
//               try {
//                 await removeUserFromGroup(group.groupId, user.id);
//                 setLocalGroups((prev) =>
//                   prev.filter((g) => g.groupId !== group.groupId),
//                 );
//               } catch (e) {
//                 console.error(e);
//                 showError("Failed to leave the group.");
//               }
//             }
//           }}
//           onClose={() => setBurgerOpen(false)}
//         />
//       )}

//       <div className="flex justify-around border-t p-2">
//         {/* {tabs.map((tab) => (
//           <button
//             key={tab.id}
//             onClick={() => {
//               if (tab.type === "personal") {
//                 navigate("/calendar");
//               } else {
//                 navigate(`/calendar/${tab.id}`);
//               }
//             }}
//             className={`px-4 py-2 rounded-full shadow-md transition-all ${
//               activeTabId === tab.id
//                 ? "bg-[#fbc289] text-gray-800"
//                 : "bg-[#ffea96] text-gray-700 hover:bg-[#fff2a0]"
//             }`}
//           >
//             {tab.type === "personal"
//               ? "My Calendar"
//               : `${(tab as any).group.groupId}`}
//           </button>
//         ))} */}
//          <nav className="flex justify-around border-t p-2 bg-gray-50">
//         <Link
//           to="/calendar"
//           className={`px-4 py-2 rounded-full transition ${
//             pathname === "/calendar"
//               ? "bg-yellow-300 text-gray-800"
//               : "bg-yellow-100 text-gray-600 hover:bg-yellow-200"
//           }`}
//         >
//           My Calendar
//         </Link>

//         {localGroups.map((g) => {
//           const to = `/calendar/${encodeURIComponent(g.groupId)}`;
//           const isActive = pathname === to;
//           return (
//             <Link
//               key={g.groupId}
//               to={to}
//               className={`px-4 py-2 rounded-full transition ${
//                 isActive
//                   ? "bg-yellow-300 text-gray-800"
//                   : "bg-yellow-100 text-gray-600 hover:bg-yellow-200"
//               }`}
//             >
//               {g.groupId}
//             </Link>
//           );
//         })}
//               </nav>

//         <button
//           onClick={handleCreateGroup}
//           className="bg-purple-200 text-purple-800 px-4 py-2 rounded-full shadow-md hover:bg-purple-300 transition-all"
//         >
//           Create Group Calendar
//         </button>
//       </div>
//        {showCreateGroup && (
//         <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
//           <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
//             <h2 className="text-lg font-bold mb-4">Create Group Calendar</h2>
//             <input
//               type="text"
//               placeholder="Calendar name..."
//               value={newGroupName}
//               onChange={(e) => handleNameChange(e.target.value)}
//               className="w-full border rounded px-3 py-2 mb-2"
//               disabled={isCreatingGroup}
//             />
//             {nameError && (
//               <p className="text-red-500 text-sm mb-2">{nameError}</p>
//             )}

//             <div className="flex items-center mb-4">
//               <label htmlFor="privacyToggle" className="mr-2 text-sm">
//                 Make my event titles public
//               </label>
//               <input
//                 id="privacyToggle"
//                 type="checkbox"
//                 checked={makeEventsPublic}
//                 onChange={() => setMakeEventsPublic(!makeEventsPublic)}
//                 disabled={isCreatingGroup}
//                 className="w-4 h-4"
//               />
//             </div>

//             <div className="flex flex-col items-center gap-1">
//               <button
//                 onClick={handleInviteFriends}
//                 disabled={!isNameValid || isCreatingGroup}
//                 className={`
//                   flex items-center justify-center
//                   px-4 py-2 rounded-full shadow-md transition-all
//                   ${
//                     isNameValid
//                       ? "bg-green-200 text-green-800 hover:bg-green-300"
//                       : "bg-gray-300 text-gray-600 cursor-not-allowed"
//                   }
//                   ${isCreatingGroup ? "opacity-70 cursor-wait" : ""}
//                 `}
//               >
//                 {isCreatingGroup ? (
//                   <>
//                     <svg
//                       className="animate-spin h-5 w-5 mr-2 text-green-800"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       />
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                       />
//                     </svg>
//                     Creating…
//                   </>
//                 ) : (
//                   "Create Calendar & Copy Invite Link"
//                 )}
//               </button>

//               <button
//                 onClick={() => setShowCreateGroup(false)}
//                 disabled={isCreatingGroup}
//                 className="mt-3 text-sm underline text-gray-500"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//        {/* Render the toast if present */}
//        {toast && (
//         <Toast
//           message={toast.message}
//           onClose={() => setToast(null)}
//         />
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import {
  Outlet,
  useNavigate,
  Link,
  useLocation,
  useParams,
} from "react-router";
import { useAuth } from "react-oidc-context";
import ProfileMenu from "../components/ProfileMenu";
import BurgerMenu from "../components/BurgerMenu";
import { removeUserFromGroup } from "../hooks/group";
import type { GroupCalendarDto, UserProfileDto } from "@busybees/core";
import { Toast } from "../components/Toast";

export default function CalendarLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { groupId } = useParams<{ groupId?: string }>();

  const userId = auth.user?.profile?.sub as string;

  // State
  const [groups, setGroups] = useState<GroupCalendarDto[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [showExternalDropdown, setShowExternalDropdown] = useState(false);
  const [loadingIntegration, setLoadingIntegration] = useState<
    "Google" | "Microsoft" | "Apple" | null
  >(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isNameValid, setIsNameValid] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [makeEventsPublic, setMakeEventsPublic] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const showError = (msg: string) => setToast({ message: msg });

  // Fetch user profile & groups on auth ready
  useEffect(() => {
    if (!auth.user) return;

    (async () => {
      setLoadingGroups(true);
      try {
        const profileRes = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${auth.user?.access_token}` },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch profile");

        const { userProfile } = (await profileRes.json()) as {
          userProfile: UserProfileDto;
        };

        if (!userProfile.groupNames || userProfile.groupNames.length === 0) {
          setGroups([]);
          return;
        }

        // Fetch each group calendar by ID
        const fetchedGroups = await Promise.all(
          userProfile.groupNames.map(async (gid) => {
            const res = await fetch(`/api/groups/${encodeURIComponent(gid)}`, {
              headers: { Authorization: `Bearer ${auth.user!.access_token}` },
            });
            if (!res.ok) {
              console.warn("Could not load group", gid);
              return null;
            }
            return (await res.json()) as GroupCalendarDto;
          }),
        );

        setGroups(fetchedGroups.filter((g): g is GroupCalendarDto => !!g));
      } catch (e) {
        console.error(e);
        showError("Could not load your shared calendars.");
      } finally {
        setLoadingGroups(false);
      }
    })();
  }, [auth.user]);

  // Sync active tab id with URL param (default to 'personal')
  const [activeTabId, setActiveTabId] = useState(groupId ?? "personal");
  useEffect(() => {
    setActiveTabId(groupId ?? "personal");
  }, [groupId]);

  // Tabs array for UI navigation
  const tabs = [
    { id: "personal", type: "personal", name: "My Calendar" },
    ...groups.map((g) => ({ id: g.groupId, type: "group", group: g })),
  ];

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? {
    id: "personal",
    type: "personal",
    name: "My Calendar",
  };
  const isGroupTab = activeTab.type === "group";

  // Navigation handler from burger menu or tabs
  const handleSelectCalendar = (calendar: { id: string } | "personal") => {
    if (calendar === "personal") {
      navigate("/calendar");
    } else {
      navigate(`/calendar/${calendar.id}`);
    }
    setBurgerOpen(false);
  };

  // Calendar integrations logic
  const handleAddGoogleCalendar = async () => {
    try {
      const response = await fetch(`/api/oauth/google/start`, {
        headers: { Authorization: `Bearer ${auth.user?.access_token}` },
      });
      if (!response.ok) throw new Error("Failed to start Google OAuth");

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        showError("No redirect URL returned from the server.");
      }
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
      showError("There was an error starting calendar integration.");
    }
  };

  const integrations: Record<string, () => Promise<void>> = {
    Google: handleAddGoogleCalendar,
    Microsoft: async () => alert("Microsoft integration coming soon"),
    Apple: async () => alert("Apple integration coming soon"),
  };

  const handleIntegrationClick = async (
    type: "Google" | "Microsoft" | "Apple",
  ) => {
    setShowExternalDropdown(false);
    setLoadingIntegration(type);
    try {
      await integrations[type]();
    } catch (e) {
      console.error(`Error with ${type} integration:`, e);
      showError(`Error with ${type} integration`);
    } finally {
      setLoadingIntegration(null);
    }
  };

  // Group creation handlers
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

      setGroups((prev) => [...prev, newGroup]);
      await navigator.clipboard.writeText(newGroup.inviteUrl);
      alert(`Invite link copied: ${newGroup.inviteUrl}`);

      setShowCreateGroup(false);
      setNewGroupName("");
      // Navigate to new group's calendar immediately
      navigate(`/calendar/${newGroup.groupId}`);
    } catch (err) {
      console.error("Error creating group:", err);
      showError("There was an error creating a group calendar.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Remove user from group
  const handleRemoveGroup = async (group: GroupCalendarDto) => {
    if (!userId) return;
    if (!window.confirm(`Remove yourself from group ${group.groupId}?`)) return;

    try {
      await removeUserFromGroup(group.groupId, userId);
      setGroups((prev) => prev.filter((g) => g.groupId !== group.groupId));
      if (activeTabId === group.groupId) {
        navigate("/calendar");
      }
    } catch (e) {
      console.error(e);
      showError("Failed to leave the group.");
    }
  };

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
            {isGroupTab ? (activeTab as any).group?.groupId : "My Calendar"}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-auto relative">
          <div className="relative">
            <button
              onClick={() => setShowExternalDropdown((p) => !p)}
              disabled={!!loadingIntegration}
              className={`flex items-center space-x-2 bg-blue-200 text-blue-800 px-3 py-1 rounded-full shadow-md transition-all text-sm ${
                loadingIntegration
                  ? "opacity-70 cursor-wait"
                  : "hover:bg-blue-300"
              }`}
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
                {(["Google", "Microsoft", "Apple"] as const).map((type) => (
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
            {/* You can implement ProfileSettings modal here if needed */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet
          context={{
            activeTab,
            makeEventsPublic,
            setMakeEventsPublic,
            group: isGroupTab ? (activeTab as any).group : undefined,
          }}
        />
      </div>

      {/* Burger Menu */}
      {burgerOpen && (
        <BurgerMenu
          activeTabId={activeTabId}
          localGroups={groups.map((g) => ({
            id: g.groupId,
            name: g.groupId,
            members: g.members,
          }))}
          onSelectCalendar={handleSelectCalendar}
          onCreateGroup={() => {
            setBurgerOpen(false);
            setShowCreateGroup(true);
          }}
          onRemoveGroup={handleRemoveGroup}
          onClose={() => setBurgerOpen(false)}
        />
      )}

      {/* Bottom Navigation Tabs */}
      <nav className="flex justify-around border-t p-2 bg-gray-50">
        <Link
          to="/calendar"
          className={`px-4 py-2 rounded-full transition ${
            pathname === "/calendar"
              ? "bg-yellow-300 text-gray-800"
              : "bg-yellow-100 text-gray-600 hover:bg-yellow-200"
          }`}
        >
          My Calendar
        </Link>

        {groups.map((g) => {
          const to = `/calendar/${encodeURIComponent(g.groupId)}`;
          const isActive = pathname === to;
          return (
            <Link
              key={g.groupId}
              to={to}
              className={`px-4 py-2 rounded-full transition ${
                isActive
                  ? "bg-yellow-300 text-gray-800"
                  : "bg-yellow-100 text-gray-600 hover:bg-yellow-200"
              }`}
            >
              {g.groupId}
            </Link>
          );
        })}

        <button
          onClick={() => setShowCreateGroup(true)}
          className="bg-purple-200 text-purple-800 px-4 py-2 rounded-full shadow-md hover:bg-purple-300 transition-all"
        >
          Create Group Calendar
        </button>
      </nav>

      {/* Create Group Modal */}
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
              disabled={isCreatingGroup}
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
                disabled={isCreatingGroup}
                className="w-4 h-4"
              />
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleCreateGroup}
                disabled={!isNameValid || isCreatingGroup}
                className={`flex items-center justify-center px-4 py-2 rounded-full shadow-md transition-all ${
                  isNameValid
                    ? "bg-green-200 text-green-800 hover:bg-green-300"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                } ${isCreatingGroup ? "opacity-70 cursor-wait" : ""}`}
              >
                {isCreatingGroup ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-green-800"
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
                    Creating…
                  </>
                ) : (
                  "Create Calendar & Copy Invite Link"
                )}
              </button>

              <button
                onClick={() => setShowCreateGroup(false)}
                disabled={isCreatingGroup}
                className="mt-3 text-sm underline text-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
