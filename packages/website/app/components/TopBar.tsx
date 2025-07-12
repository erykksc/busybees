import { useState } from "react";
import { useParams, useLocation } from "react-router";
import { useAuth } from "react-oidc-context";
import ProfileMenu from "./ProfileMenu";
import { useGroup } from "../hooks/useGroup";

interface TopBarProps {
  onOpenBurger: () => void;
}

export default function TopBar({ onOpenBurger }: TopBarProps) {
  const { groupId } = useParams<{ groupId?: string }>();
  const location = useLocation();
  const auth = useAuth();
  const { group } = useGroup(groupId);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showExternalDropdown, setShowExternalDropdown] = useState(false);
  const [loadingIntegration, setLoadingIntegration] = useState<
    "Google" | "Microsoft" | "Apple" | null
  >(null);

  // Determine title based on current route
  const isPersonalCalendar = location.pathname === "/my-calendar";
  const title = isPersonalCalendar
    ? "My Calendar"
    : group?.groupId || "Loading...";

  const handleAddGoogleCalendar = async () => {
    try {
      const response = await fetch(`/api/oauth/google/start`, {
        headers: { Authorization: `Bearer ${auth.user?.access_token}` },
      });
      if (!response.ok) throw new Error("Failed to start Google OAuth");

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
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
    } finally {
      setLoadingIntegration(null);
    }
  };

  return (
    <div className="flex justify-between items-center px-4 py-2 border-b">
      <div className="flex items-center space-x-4">
        <button onClick={onOpenBurger} className="focus:outline-none">
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-gray-800" />
            <div className="w-5 h-0.5 bg-gray-800" />
            <div className="w-5 h-0.5 bg-gray-800" />
          </div>
        </button>
        <div className="text-lg font-semibold">{title}</div>
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
        </div>
      </div>
    </div>
  );
}
