import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface ProfileMenuProps {
  user: User;
  show: boolean;
  onProfile: () => void;
  onLogout: () => void;
  onToggle: () => void;
}

export default function ProfileMenu({ user, show, onProfile, onLogout, onToggle }: ProfileMenuProps) {
    const navigate = useNavigate();

  return (
    <div className="relative">
      {user && (
        <div
          className="w-10 h-10 bg-[#fbde89] text-yellow-900 rounded-full flex items-center justify-center font-cute text-lg shadow cursor-pointer"
          onClick={onToggle}
        >
          {user?.email?.[0].toUpperCase()}
        </div>
      )}

      {show && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md">
          <button
            onClick={() => navigate('/settings')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Profile Settings
          </button>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
