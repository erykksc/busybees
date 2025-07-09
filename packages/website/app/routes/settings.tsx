import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from "react-oidc-context";

interface ProfileSettingsProps {
  addedCalendars: string[];
  onRemoveCalendar: (calendar: string) => void;
  onAddCalendar: (type: 'Google' | 'Microsoft' | 'Apple') => void;
  onClose: () => void;
}


export default function ProfileSettings({ addedCalendars, onRemoveCalendar, onAddCalendar, onClose }: ProfileSettingsProps) {
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const navigate = useNavigate(); 
  const auth = useAuth();
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

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-6 font-cute text-gray-800 relative">

        {/* Close */}
        <button onClick={() => navigate(-1)} className="absolute top-4 right-4 text-gray-500 text-xl hover:text-red-500">✖</button>

        <h2 className="text-2xl font-bold text-center">Profile Settings</h2>

        {/* 1. Added Calendars */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Calendars added to Busy Bees</h3>
          {!addedCalendars || addedCalendars.length === 0 ? (
            <p className="text-sm text-gray-500 italic">You haven’t added any calendars yet.</p>
          ) : (
            <ul className="space-y-2">
              {addedCalendars.map((calendar, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center px-3 py-2 bg-yellow-100 rounded shadow-sm"
                >
                  <span>{calendar}</span>
                  <button
                    onClick={() => setPendingRemove(calendar)}
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
            <button onClick={async () => {
              await handleAddGoogleCalendar();
              onAddCalendar('Google');
            }}
            className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow hover:bg-blue-200 transition-all">
              + Add Google Calendar
            </button>
            <button onClick={() => onAddCalendar('Microsoft')} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow hover:bg-blue-200 transition-all">
              + Add Microsoft Calendar
            </button>
            <button onClick={() => onAddCalendar('Apple')} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow hover:bg-blue-200 transition-all">
              + Add Apple Calendar
            </button>
          </div>
        </div>

        {/* Confirm Remove Modal */}
        {pendingRemove && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-sm font-cute">
              <h3 className="font-bold text-lg mb-4 text-center">
                Remove {pendingRemove} from Busy Bees?
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
                    onRemoveCalendar(pendingRemove);
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
