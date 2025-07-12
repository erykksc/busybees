import { Outlet } from "react-router";
import TopBar from "../components/TopBar";
import BottomBar from "../components/BottomBar";
import BurgerMenu from "../components/BurgerMenu";
import { Toast } from "../components/Toast";
import { useCalendarLayout } from "../hooks/useCalendarLayout";

export default function CalendarLayout() {
  const { toast, setToast, burgerOpen, setBurgerOpen, setShowCreateGroup } =
    useCalendarLayout();

  return (
    <div className="flex flex-col h-screen font-cute bg-[#fff9e7] text-gray-800">
      <TopBar onOpenBurger={() => setBurgerOpen(true)} />

      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <BottomBar onCreateGroup={() => setShowCreateGroup(true)} />

      {burgerOpen && (
        <BurgerMenu
          onClose={() => setBurgerOpen(false)}
          onCreateGroup={() => {
            setBurgerOpen(false);
            setShowCreateGroup(true);
          }}
        />
      )}

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

