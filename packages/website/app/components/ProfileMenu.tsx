import { useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import config from "~/config";

interface ProfileMenuProps {
  show: boolean;
  onToggle: () => void;
}

export default function ProfileMenu({ show, onToggle }: ProfileMenuProps) {
  const navigate = useNavigate();
  const auth = useAuth();

  const signoutRedirect = () => {
    auth.removeUser();
    auth.signoutRedirect({
      extraQueryParams: {
        client_id: config.cognito.clientId,
        logout_uri: "http://localhost:5173/logout",
      },
    });
  };

  return (
    <div className="relative">
      {auth.user && (
        <div
          className="w-10 h-10 bg-[#fbde89] text-yellow-900 rounded-full flex items-center justify-center font-cute text-lg shadow cursor-pointer"
          onClick={onToggle}
        >
          {/* NOTE: you can't get a user like that */}
          {/* {auth.user?.email?.[0].toUpperCase()} */}
          {auth.user.profile.email}
        </div>
      )}

      {show && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md">
          <button
            onClick={() => navigate("/settings")}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Profile Settings
          </button>
          <button
            onClick={signoutRedirect}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
