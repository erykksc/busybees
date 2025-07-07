import MyCalendar from "../components/MyCalendar";
import GroupCalendar from "../components/GroupCalendar";
import { useOutletContext } from "react-router-dom";
import type { CalendarLayoutContext } from "../types";

export default function CalendarPage() {
  const { activeTab, user, makeEventsPublic, setMakeEventsPublic } =
    useOutletContext<CalendarLayoutContext>();

  return (
    <>
      {activeTab.type === "personal" && <MyCalendar />}
      {activeTab.type === "group" && (
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
