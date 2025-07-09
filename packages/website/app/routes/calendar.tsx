import { useOutletContext } from "react-router";
import { useAuth } from "react-oidc-context";
import { authGuard } from "~/components";
import MyCalendar from "~/components/MyCalendar";
import GroupCalendar from "~/components/GroupCalendar";
import type { CalendarLayoutContext } from "~/types";

export default authGuard(CalendarPage);

function CalendarPage() {
  const auth = useAuth();
  
    if (auth.isLoading) {
      return <div>Loading...</div>;
    }

  const { activeTab, user, makeEventsPublic, setMakeEventsPublic } =
    useOutletContext<CalendarLayoutContext>();

  return (
    <>
      {activeTab?.type === "personal" && <MyCalendar />}
      {activeTab?.type === "group" && (
        <GroupCalendar
          group={activeTab.group}
          currentUser={user}
          makeEventsPublic={makeEventsPublic}
          setMakeEventsPublic={setMakeEventsPublic}
        />
      )}
    </>
  );
}