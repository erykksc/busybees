import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { authGuard } from "~/components";

interface CalendarConnection {
  type: "Google" | "Microsoft" | "Apple";
  email: string;
  id: string;
}

function ProfileSettings() {
  const [pendingRemove, setPendingRemove] = useState<CalendarConnection | null>(
    null,
  );
  const [calendarConnections, setCalendarConnections] = useState<
    CalendarConnection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = useAuth();
  const [isAddingGoogle, setIsAddingGoogle] = useState(false);

  // Fetch user profile and calendar connections
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.user) return;

      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${auth.user.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userProfile = data.userProfile;

          // Convert googleAccountNames to CalendarConnection objects
          const connections: CalendarConnection[] = [];

          if (userProfile.googleAccountNames) {
            userProfile.googleAccountNames.forEach((email: string) => {
              connections.push({
                type: "Google",
                email: email,
                id: `google-${email}`,
              });
            });
          }

          setCalendarConnections(connections);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [auth.user]);

  const handleRemoveCalendar = async (connection: CalendarConnection) => {
    console.log("Removing calendar:", connection);

    setCalendarConnections((prev) =>
      prev.filter((conn) => conn.id !== connection.id),
    );
  };

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

  const handleGoogleLoading = async () => {
    setIsAddingGoogle(true);
    try {
      await handleAddGoogleCalendar();
      window.location.reload(); 
    } catch (e) {
      console.error(e);
      setIsAddingGoogle(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-6 font-cute text-gray-800 relative">
        {/* Close */}
        <button
          onClick={() => navigate("/my-calendar")}
          className="absolute top-4 right-4 text-gray-500 text-xl hover:text-red-500"
        >
          ✖
        </button>

        <h2 className="text-2xl font-bold text-center">Profile Settings</h2>

        {/* 1. Added Calendars */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Calendars added to Busy Bees
          </h3>
          {loading ? (
            <p className="text-sm text-gray-500 italic">Loading calendars...</p>
          ) : calendarConnections.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              You haven't added any calendars yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {calendarConnections.map((connection) => (
                <li
                  key={connection.id}
                  className="flex justify-between items-center px-3 py-2 bg-yellow-100 rounded shadow-sm"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {connection.type === "Google" && (
                        <span className="text-blue-600 text-sm font-semibold">
                          Google
                        </span>
                      )}
                      {connection.type === "Microsoft" && (
                        <span className="text-blue-800 text-sm font-semibold">
                          Microsoft
                        </span>
                      )}
                      {connection.type === "Apple" && (
                        <span className="text-gray-700 text-sm font-semibold">
                          Apple
                        </span>
                      )}
                    </div>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm">{connection.email}</span>
                  </div>
                  <button
                    onClick={() => setPendingRemove(connection)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Remove"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 2. Add New Calendar */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Add New Calendar</h3>
          <div className="flex flex-col gap-2">
            {/* <button
              onClick={async () => {
                await handleAddGoogleCalendar();
                onAddCalendar("Google");
              }}
              className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow hover:bg-blue-200 transition-all"
            >
              + Add Google Calendar
            </button> */}
            <button
              onClick= {async () => {
                await handleAddGoogleCalendar();
                await handleGoogleLoading();
              }}
              disabled={isAddingGoogle}
              className={`
          flex items-center justify-center
          bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow
          hover:bg-blue-200 transition-all
          ${isAddingGoogle ? "opacity-70 cursor-wait" : ""}
        `}
            >
              {isAddingGoogle ? (
                <>
                  {/* Simple spinner SVG */}
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-blue-800"
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
                  Redirecting…
                </>
              ) : (
                "+ Add Google Calendar"
              )}
            </button>
            <button
              disabled
              className="bg-gray-100 text-gray-500 px-4 py-2 rounded-full shadow cursor-not-allowed"
              title="Coming soon"
            >
              + Add Microsoft Calendar (Coming Soon)
            </button>
            <button
              disabled
              className="bg-gray-100 text-gray-500 px-4 py-2 rounded-full shadow cursor-not-allowed"
              title="Coming soon"
            >
              + Add Apple Calendar (Coming Soon)
            </button>
          </div>
        </div>

        {/* Confirm Remove Modal */}
        {pendingRemove && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-sm font-cute">
              <h3 className="font-bold text-lg mb-4 text-center">
                Remove {pendingRemove.type} calendar ({pendingRemove.email})
                from Busy Bees?
              </h3>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPendingRemove(null)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRemoveCalendar(pendingRemove);
                    setPendingRemove(null);
                  }}
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default authGuard(ProfileSettings);
