// import { useState, useEffect } from "react";
// import { useParams } from "react-router";
// import dayjs from "dayjs";
// import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
// import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
// import CreateEventModal from "../components/CreateEventModal";
// import InviteModal from "../components/InviteModal";
// import { removeUserFromGroup } from "../hooks/group";
// import { useAuth } from "react-oidc-context";
// import type { GroupCalendarDto, CalendarEventDto, UserProfileDto } from "@busybees/core";
// import { useOutletContext } from "react-router";

// dayjs.extend(isSameOrAfter);
// dayjs.extend(isSameOrBefore);

// type CalendarCtx = {
//   activeTab:
//     | { type: "personal" }
//     | { type: "group"; group: GroupCalendarDto };
//   makeEventsPublic: boolean;
//   setMakeEventsPublic: (b: boolean) => void;
// };

// const getDaysInMonth = (year: number, month: number): (number | null)[] => {
//   const days = [];
//   const date = dayjs(`${year}-${month + 1}-01`);

//   let startDay = date.day();
//   startDay = ((startDay + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

//   const endDay = date.daysInMonth();
//   const prev = [...Array(startDay).keys()].map(() => null);
//   const curr = Array.from({ length: endDay }, (_, i) => i + 1);

//   return [...prev, ...curr];
// };

// interface Slot {
//   start: dayjs.Dayjs;
//   end: dayjs.Dayjs;
// }

// const findFreeSlots = (
//   events: CalendarEventDto[],
//   date: string,
//   startHour: number,
//   endHour: number,
// ): Slot[] => {
//   const start = dayjs(date).hour(startHour).minute(0).second(0);
//   const end = dayjs(date).hour(endHour).minute(0).second(0);

//   const sorted = [...events].sort((a, b) =>
//     dayjs(a.start).diff(dayjs(b.start)),
//   );

//   const freeSlots = [];
//   let lastEnd = start;

//   for (const event of sorted) {
//     const evStart = dayjs(event.start);
//     const evEnd = dayjs(event.end);

//     if (evStart.isAfter(lastEnd)) {
//       freeSlots.push({ start: lastEnd, end: evStart });
//     }

//     if (evEnd.isAfter(lastEnd)) {
//       lastEnd = evEnd;
//     }
//   }

//   if (lastEnd.isBefore(end)) {
//     freeSlots.push({ start: lastEnd, end });
//   }

//   return freeSlots;
// };

// export default function GroupCalendar(){
//   const auth = useAuth();
//   const { activeTab, makeEventsPublic, setMakeEventsPublic } =
//     useOutletContext<CalendarCtx>();

//   const [viewDate, setViewDate] = useState(dayjs());
//   const [showFreeSpots, setShowFreeSpots] = useState(false);
//   const DEFAULT_START = 8;
//   const DEFAULT_END = 21;
//   const [showModal, setShowModal] = useState(false);
//   const [dayStart, setDayStart] = useState(DEFAULT_START);
//   const [dayEnd, setDayEnd] = useState(DEFAULT_END);
//   const [tempStart, setTempStart] = useState(dayStart);
//   const [tempEnd, setTempEnd] = useState(dayEnd);
//   const [saveForGroup, setSaveForGroup] = useState(true);
//   const [showEventModal, setShowEventModal] = useState(false);
//   const [eventTitle, setEventTitle] = useState("");
//   const [eventDate, setEventDate] = useState<string>("");
//   const [eventStart, setEventStart] = useState("");
//   const [eventEnd, setEventEnd] = useState("");
//   const [allDay, setAllDay] = useState(false);
//   const [repeatType, setRepeatType] = useState("none");
//   const [rangeEndDate, setRangeEndDate] = useState("");
//   const [events, setEvents] = useState<CalendarEventDto[]>([]);
//   const [showInviteModal, setShowInviteModal] = useState(false);
//   const [groupMembers, setGroupMembers] = useState<UserProfileDto[]>([]);
//   const [users, setUsers] = useState<UserProfileDto[]>([]);

//   if (activeTab.type !== "group") {
//     return <div className="p-4 text-red-600">No group selected</div>;
//   }

//   const group = activeTab.group;

//   useEffect(() => {
//     const fetchGroupMembers = async () => {
//       if (!group || !auth.user) return;

//       try {
//         const res = await fetch(`/api/groups/${group.groupId}/profile`, {
//           headers: {
//             Authorization: `Bearer ${auth.user.access_token}`,
//           },
//         });

//         if (!res.ok) throw new Error("Failed to fetch group profile");

//         const data = await res.json();
//         setUsers(data.members);
//       } catch (err) {
//         console.error("Error fetching group members:", err);
//       }
//     };

//     fetchGroupMembers();
//   }, [group.groupId, auth.user]);

//   useEffect(() => {
//     const fetchGroupProfile = async () => {
//       try {
//         const response = await fetch(`/api/groups/${group.groupId}/profile`, {
//           headers: {
//             Authorization: `Bearer ${auth.user?.access_token}`,
//           },
//         });

//         if (!response.ok) {
//           throw new Error("Failed to fetch group profile");
//         }

//         const data = await response.json();
//         setGroupMembers(data.members);
//       } catch (err) {
//         console.error("Error fetching group profile:", err);
//       }
//     };

//     fetchGroupProfile();
//   }, [group.groupId]);

//   useEffect(() => {
//     const fetchAllEvents = async () => {
//       if (!auth.user) return;
//       const timeMin = viewDate.startOf("month").toISOString();
//       const timeMax = viewDate.endOf("month").toISOString();

//       try {
//         const grpRes = await fetch(
//           `/api/groups/${group.groupId}/events?timeMin=${timeMin}&timeMax=${timeMax}`,
//           { headers: { Authorization: `Bearer ${auth.user.access_token}` } }
//         );
//         if (!grpRes.ok) throw new Error("Failed to load group events");
//         const groupEvents: CalendarEventDto[] = await grpRes.json();

//         let allEvents = [...groupEvents];

//         if (group.makeEventsPublic) {
//           const memberFetches = group.members.map(async (memberId) => {
//             const usrRes = await fetch(
//               `/api/user/${memberId}/events?timeMin=${timeMin}&timeMax=${timeMax}`,
//               { headers: { Authorization: `Bearer ${auth.user!.access_token}` } }
//             );
//             if (!usrRes.ok) {
//               console.warn(`Failed to load events for ${memberId}`);
//               return [] as CalendarEventDto[];
//             }
//             const payload = await usrRes.json() as { events: CalendarEventDto[] };
//             return payload.events;
//           });

//           const membersEventsArrays = await Promise.all(memberFetches);
//           membersEventsArrays.forEach(evArr => {
//             allEvents.push(...evArr);
//           });
//         }

//         setEvents(allEvents);
//       } catch (err) {
//         console.error("Error loading calendar events:", err);
//       }
//     };

//     fetchAllEvents();
//   }, [viewDate, group.groupId, group.makeEventsPublic, auth.user]);

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import CreateEventModal from "../components/CreateEventModal";
import InviteModal from "../components/InviteModal";
import { removeUserFromGroup } from "../hooks/group";
import { useAuth } from "react-oidc-context";
import { useOutletContext } from "react-router";
import type {
  GroupCalendarDto,
  CalendarEventDto,
  UserProfileDto,
} from "@busybees/core";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type CalendarCtx = {
  group?: GroupCalendarDto;
  makeEventsPublic: boolean;
  setMakeEventsPublic: (b: boolean) => void;
};

interface Slot {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

const getDaysInMonth = (y: number, m: number): (number | null)[] => {
  const date = dayjs(`${y}-${m + 1}-01`);
  let sd = ((date.day() + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const prev = Array(sd).fill(null);
  const daysInMonth = date.daysInMonth();
  const curr = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return [...prev, ...curr];
};

const findFreeSlots = (
  events: CalendarEventDto[],
  date: string,
  startHour: number,
  endHour: number,
): Slot[] => {
  const start = dayjs(date).hour(startHour).minute(0).second(0);
  const end = dayjs(date).hour(endHour).minute(0).second(0);
  const sorted = [...events].sort((a, b) =>
    dayjs(a.start).diff(dayjs(b.start)),
  );
  const slots: Slot[] = [];
  let lastEnd = start;
  for (const ev of sorted) {
    const s = dayjs(ev.start),
      e = dayjs(ev.end);
    if (s.isAfter(lastEnd)) slots.push({ start: lastEnd, end: s });
    if (e.isAfter(lastEnd)) lastEnd = e;
  }
  if (lastEnd.isBefore(end)) slots.push({ start: lastEnd, end });
  return slots;
};

export default function GroupCalendar() {
  const auth = useAuth();
  const { group, makeEventsPublic, setMakeEventsPublic } =
    useOutletContext<CalendarCtx>();

  const [viewDate, setViewDate] = useState(dayjs());
  const [showFree, setShowFree] = useState(false);
  const [dayStart, setDayStart] = useState(8);
  const [dayEnd, setDayEnd] = useState(21);
  const [tempStart, setTempStart] = useState(8);
  const [tempEnd, setTempEnd] = useState(21);
  const [showModal, setShowModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [members, setMembers] = useState<UserProfileDto[]>([]);
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFreeSpots, setShowFreeSpots] = useState(false);
  const [saveForGroup, setSaveForGroup] = useState(true);
  const [groupMembers, setGroupMembers] = useState<UserProfileDto[]>([]);
  const [users, setUsers] = useState<UserProfileDto[]>([]);

  // 1️⃣ load member profiles
  useEffect(() => {
    if (!auth.user) return;
    fetch(`/api/groups/${encodeURIComponent(group.groupId)}/profile`, {
      headers: { Authorization: `Bearer ${auth.user.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => setMembers(data.members))
      .catch(console.error);
  }, [group, auth.user]);

  // 2️⃣ load events for this month
  useEffect(() => {
    if (!auth.user) return;
    const t0 = viewDate.startOf("month").toISOString();
    const t1 = viewDate.endOf("month").toISOString();
    fetch(
      `/api/groups/${encodeURIComponent(group.groupId)}/events?timeMin=${t0}&timeMax=${t1}`,
      { headers: { Authorization: `Bearer ${auth.user.access_token}` } },
    )
      .then((r) => r.json())
      .then((groupEvents: CalendarEventDto[]) => {
        let all = [...groupEvents];
        if (makeEventsPublic) {
          // also pull each member's events
          Promise.all(
            group.members.map((memId) =>
              fetch(`/api/user/${memId}/events?timeMin=${t0}&timeMax=${t1}`, {
                headers: { Authorization: `Bearer ${auth.user?.access_token}` },
              })
                .then((r) => r.json())
                .then((p: { events: CalendarEventDto[] }) => p.events)
                .catch(() => []),
            ),
          ).then((arrs) => {
            arrs.forEach((a) => all.push(...a));
            setEvents(all);
          });
        } else {
          setEvents(all);
        }
      })
      .catch(console.error);
  }, [viewDate, group, makeEventsPublic, auth.user]);

  // if no group in context, show a message
  if (!group) {
    return <div className="p-4 text-red-600">No group selected</div>;
  }

  const days = getDaysInMonth(viewDate.year(), viewDate.month());
  const today = dayjs().startOf("day");
  const eightMonthsAhead = today.add(8, "month").endOf("month");
  const eventsOnDay = (d: number) => {
    if (!d) return [];
    const iso = viewDate.date(d).format("YYYY-MM-DD");
    return events.filter((e) => dayjs(e.start).format("YYYY-MM-DD") === iso);
  };

  const openModal = () => {
    setTempStart(dayStart);
    setTempEnd(dayEnd);
    setSaveForGroup(true);
    setShowModal(true);
  };

  const handleModalSave = () => {
    if (tempStart >= tempEnd) {
      alert("Start time must be before end time");
      return;
    }
    if (saveForGroup) {
      localStorage.setItem(
        `group:${group.groupId}:dayStart`,
        tempStart.toString(),
      );
      localStorage.setItem(`group:${group.groupId}:dayEnd`, tempEnd.toString());
      setDayStart(tempStart);
      setDayEnd(tempEnd);
    } else {
      setDayStart(tempStart);
      setDayEnd(tempEnd);
    }
    setShowModal(false);
  };

  const handleFindSpotClick = () => {
    if (tempStart >= tempEnd) {
      alert("Start time must be before end time");
      return;
    }
    handleModalSave();
    setShowFreeSpots(true);
  };

  const handleFreeSpotClick = () => {
    if (showFreeSpots) {
      setShowFreeSpots(false);
    } else {
      if (dayStart >= dayEnd) {
        alert("Your preferred start time must be before end time.");
      } else {
        setShowFreeSpots(true);
      }
    }
  };

  const handleFreeSlotSelect = (slot: Slot, date: dayjs.Dayjs) => {
    setEventTitle("");
    setEventDate(date.format("YYYY-MM-DD"));

    const duration = slot.end.diff(slot.start, "hour");

    if (duration <= 1) {
      setEventStart(slot.start.format("HH:mm"));
      setEventEnd(slot.end.format("HH:mm"));
    } else {
      setEventStart(slot.start.format("HH:mm"));
      setEventEnd("");
    }

    setShowEventModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto font-cute p-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        {/* Invite button and title */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-purple-200 text-purple-800 px-4 py-2 rounded-full shadow-md hover:bg-purple-300 transition-all"
        >
          Invite / Remove Friends
        </button>

        {showInviteModal && (
          <InviteModal
            group={group}
            members={groupMembers}
            onRemove={async (userId: string) => {
              try {
                await removeUserFromGroup(group.groupId, userId);
                setGroupMembers((prev) => prev.filter((u) => u.id !== userId));
              } catch (e) {
                alert("Failed to remove user.");
                console.error(e);
              }
            }}
            onClose={() => setShowInviteModal(false)}
          />
        )}

        <h2 className="text-2xl font-bold text-center flex-1">
          {group.groupId}
        </h2>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleFreeSpotClick}
            className="bg-green-200 text-green-800 px-4 py-2 rounded-full shadow-md hover:bg-green-300 transition-all"
          >
            {showFreeSpots ? "Hide Free Spots" : "Find Free Spot"}
          </button>

          <button
            onClick={openModal}
            className="text-xs text-green-700 underline mt-1"
          >
            Change Calendar Settings
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setViewDate(viewDate.subtract(1, "month"))}
          className="text-sm bg-gray-200 px-2 py-1 rounded-xl"
        >
          ←
        </button>
        <h2 className="text-xl font-bold">{viewDate.format("MMMM YYYY")}</h2>
        <button
          onClick={() => setViewDate(viewDate.add(1, "month"))}
          className="text-sm bg-gray-200 px-2 py-1 rounded-xl"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}

        {days.map((d, i) => {
          if (!d)
            return (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl min-h-[100px]"
              ></div>
            );

          const date = viewDate.date(d);
          const fullDate = dayjs(
            `${viewDate.year()}-${viewDate.month() + 1}-${d}`,
          );
          const inRange =
            fullDate.isSameOrAfter(today, "day") &&
            fullDate.isSameOrBefore(eightMonthsAhead, "day");
          const dayEvents = eventsOnDay(d);
          const freeSlots =
            showFreeSpots && inRange
              ? findFreeSlots(
                  dayEvents,
                  date.format("YYYY-MM-DD"),
                  dayStart,
                  dayEnd,
                )
              : [];

          const isFullyFree =
            showFreeSpots && inRange && dayEvents.length === 0;

          return (
            <div
              key={i}
              onClick={() =>
                handleFreeSlotSelect(
                  {
                    start: fullDate.startOf("day"),
                    end: fullDate.endOf("day"),
                  },
                  fullDate,
                )
              }
              className="w-full text-left"
            >
              <div
                className={`rounded-2xl min-h-[100px] p-2 border border-gray-200  cursor-pointer ${
                  isFullyFree ? "bg-green-100" : "bg-white"
                }`}
              >
                <div className="text-xs font-bold">{d}</div>
                {dayEvents.map((ev) => {
                  const user = users.find((u: User) => u.id === ev.userId);
                  if (!user) return null;
                  const isPrivate = !user.showTitles;
                  const title = ev.allDay
                    ? `${user.name} (All Day)`
                    : isPrivate
                      ? `${user.name}'s Event`
                      : ev.title;
                  return (
                    <div
                      key={ev.id}
                      className="rounded-md px-1 py-0.5 mt-1 text-xs text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {title}
                    </div>
                  );
                })}

                {/* Show free slots */}
                {showFreeSpots &&
                  inRange &&
                  !isFullyFree &&
                  freeSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFreeSlotSelect(slot, fullDate);
                      }}
                      className="bg-green-300 rounded-md px-1 py-0.5 mt-1 text-xs text-white"
                    >
                      Free: {slot.start.format("HH:mm")} –{" "}
                      {slot.end.format("HH:mm")}
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-bold mb-4">
              Select your preferred time range
            </h3>

            <div className="flex justify-between items-center mb-4">
              <label className="mr-2 font-semibold">From:</label>
              <input
                type="number"
                min={0}
                max={23}
                value={tempStart}
                onChange={(e) => setTempStart(Number(e.target.value))}
                className="border rounded px-2 py-1 w-20"
              />
              <span className="ml-2">:00</span>
            </div>

            <div className="flex justify-between items-center mb-4">
              <label className="mr-2 font-semibold">To:</label>
              <input
                type="number"
                min={0}
                max={23}
                value={tempEnd}
                onChange={(e) => setTempEnd(Number(e.target.value))}
                className="border rounded px-2 py-1 w-20"
              />
              <span className="ml-2">:00</span>
            </div>

            <div className="mb-4 flex items-center">
              <input
                id="saveForGroup"
                type="checkbox"
                checked={saveForGroup}
                onChange={() => setSaveForGroup(!saveForGroup)}
                className="w-4 h-4"
              />
              <label htmlFor="saveForGroup" className="mr-2 text-sm">
                Save for this group
              </label>
            </div>

            <div className="mb-4 flex items-center">
              <input
                id="privacyToggle"
                type="checkbox"
                checked={makeEventsPublic}
                onChange={() => setMakeEventsPublic(!makeEventsPublic)}
                className="w-4 h-4"
              />
              <label htmlFor="privacyToggle" className="mr-2 text-sm">
                Make my event titles public
              </label>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-full shadow-md hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleFindSpotClick}
                className="bg-green-200 text-green-800 px-4 py-2 rounded-full shadow-md hover:bg-green-300 transition-all"
              >
                Save Range
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateEventModal
        show={showEventModal}
        onClose={() => setShowEventModal(false)}
        eventTitle={eventTitle}
        setEventTitle={setEventTitle}
        eventDate={eventDate ?? ""}
        eventStart={eventStart}
        setEventStart={setEventStart}
        eventEnd={eventEnd}
        setEventEnd={setEventEnd}
        repeatType={repeatType}
        setRepeatType={setRepeatType}
        rangeEndDate={rangeEndDate}
        setRangeEndDate={setRangeEndDate}
        onSave={async () => {
          if (!auth.user) return;
          const newEvent: CalendarEventDto = {
            id: crypto.randomUUID(),
            title: eventTitle,
            start: `${eventDate}T${eventStart}`,
            end: `${eventDate}T${eventEnd}`,
            userId: auth.user.profile.sub as string,
            allDay: !eventStart || !eventEnd,
          };

          try {
            const res = await fetch(`/api/groups/${group.groupId}/events`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.user.access_token}`,
              },
              body: JSON.stringify(newEvent),
            });
            if (!res.ok) throw new Error("Failed to save event to group");
          } catch (err) {
            console.error(err);
          }

          setEvents((prev) => [...prev, newEvent]);
          setShowEventModal(false);
        }}
      />
    </div>
  );
}

// import React, { useState, useEffect } from "react";
// import dayjs from "dayjs";
// import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
// import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
// import CreateEventModal from "../components/CreateEventModal";
// import InviteModal from "../components/InviteModal";
// import { removeUserFromGroup } from "../hooks/group";
// import { useAuth } from "react-oidc-context";
// import type { GroupCalendarDto, CalendarEventDto, UserProfileDto } from "@busybees/core";

// dayjs.extend(isSameOrAfter);
// dayjs.extend(isSameOrBefore);

// interface GroupCalendarProps {
//   group: GroupCalendarDto;
//   makeEventsPublic: boolean;
//   setMakeEventsPublic: (b: boolean) => void;
// }

// interface Slot {
//   start: dayjs.Dayjs;
//   end: dayjs.Dayjs;
// }

// const getDaysInMonth = (year: number, month: number): (number | null)[] => {
//   const date = dayjs(`${year}-${month + 1}-01`);
//   let startDay = (date.day() + 6) % 7; // Monday = 0
//   const prevDays = Array(startDay).fill(null);
//   const daysInMonth = date.daysInMonth();
//   const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
//   return [...prevDays, ...currentDays];
// };

// const findFreeSlots = (
//   events: CalendarEventDto[],
//   date: string,
//   startHour: number,
//   endHour: number
// ): Slot[] => {
//   const dayStart = dayjs(date).hour(startHour).minute(0).second(0);
//   const dayEnd = dayjs(date).hour(endHour).minute(0).second(0);

//   const sortedEvents = [...events].sort((a, b) =>
//     dayjs(a.start).diff(dayjs(b.start))
//   );

//   const freeSlots: Slot[] = [];
//   let lastEnd = dayStart;

//   for (const event of sortedEvents) {
//     const evStart = dayjs(event.start);
//     const evEnd = dayjs(event.end);

//     if (evStart.isAfter(lastEnd)) {
//       freeSlots.push({ start: lastEnd, end: evStart });
//     }

//     if (evEnd.isAfter(lastEnd)) {
//       lastEnd = evEnd;
//     }
//   }

//   if (lastEnd.isBefore(dayEnd)) {
//     freeSlots.push({ start: lastEnd, end: dayEnd });
//   }

//   return freeSlots;
// };

// export default function GroupCalendar({
//   group,
//   makeEventsPublic,
//   setMakeEventsPublic,
// }: GroupCalendarProps) {
//   const auth = useAuth();

//   const [viewDate, setViewDate] = useState(dayjs());
//   const [members, setMembers] = useState<UserProfileDto[]>([]);
//   const [events, setEvents] = useState<CalendarEventDto[]>([]);
//   const [showInviteModal, setShowInviteModal] = useState(false);
//   const [showEventModal, setShowEventModal] = useState(false);
//   const [eventTitle, setEventTitle] = useState("");
//   const [eventDate, setEventDate] = useState("");
//   const [eventStart, setEventStart] = useState("");
//   const [eventEnd, setEventEnd] = useState("");
//   const [repeatType, setRepeatType] = useState("none");
//   const [rangeEndDate, setRangeEndDate] = useState("");
//   const [dayStart, setDayStart] = useState(8);
//   const [dayEnd, setDayEnd] = useState(21);
//   const [showFreeSpots, setShowFreeSpots] = useState(false);

//   // Fetch group members on mount or when group changes
//   useEffect(() => {
//     if (!auth.user) return;
//     fetch(`/api/groups/${encodeURIComponent(group.groupId)}/profile`, {
//       headers: { Authorization: `Bearer ${auth.user.access_token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Failed to fetch group profile");
//         return res.json();
//       })
//       .then((data) => setMembers(data.members))
//       .catch((err) => console.error("Error loading group members:", err));
//   }, [group.groupId, auth.user]);

//   // Fetch group events (and optionally member events) for current month
//   useEffect(() => {
//     if (!auth.user) return;
//     const timeMin = viewDate.startOf("month").toISOString();
//     const timeMax = viewDate.endOf("month").toISOString();

//     fetch(
//       `/api/groups/${encodeURIComponent(
//         group.groupId
//       )}/events?timeMin=${timeMin}&timeMax=${timeMax}`,
//       { headers: { Authorization: `Bearer ${auth.user.access_token}` } }
//     )
//       .then((res) => {
//         if (!res.ok) throw new Error("Failed to load group events");
//         return res.json();
//       })
//       .then(async (groupEvents: CalendarEventDto[]) => {
//         let allEvents = [...groupEvents];

//         if (makeEventsPublic && members.length) {
//           // Fetch each member's personal events to include
//           const memberEventsArrays = await Promise.all(
//             members.map((m) =>
//               fetch(
//                 `/api/user/${encodeURIComponent(
//                   m.id
//                 )}/events?timeMin=${timeMin}&timeMax=${timeMax}`,
//                 { headers: { Authorization: `Bearer ${auth.user!.access_token}` } }
//               )
//                 .then((res) => (res.ok ? res.json() : []))
//                 .then((data) => data.events || [])
//                 .catch(() => [])
//             )
//           );
//           memberEventsArrays.forEach((arr) => allEvents.push(...arr));
//         }

//         setEvents(allEvents);
//       })
//       .catch((err) => console.error("Error loading events:", err));
//   }, [viewDate, group.groupId, makeEventsPublic, auth.user, members]);

//   // Helper to get events on a specific day
//   const eventsOnDay = (day: number): CalendarEventDto[] => {
//     if (!day) return [];
//     const dateStr = viewDate.date(day).format("YYYY-MM-DD");
//     return events.filter(
//       (ev) => dayjs(ev.start).format("YYYY-MM-DD") === dateStr
//     );
//   };

//   // When user clicks a free slot or day to create event
//   const openCreateEventModal = (
//     slotStart: dayjs.Dayjs,
//     slotEnd: dayjs.Dayjs,
//     date: dayjs.Dayjs
//   ) => {
//     setEventTitle("");
//     setEventDate(date.format("YYYY-MM-DD"));
//     setEventStart(slotStart.format("HH:mm"));
//     setEventEnd(slotEnd.format("HH:mm"));
//     setRepeatType("none");
//     setRangeEndDate("");
//     setShowEventModal(true);
//   };

//   // Save event to backend group calendar
//   const saveEvent = async () => {
//     if (!auth.user) return;

//     const newEvent: CalendarEventDto = {
//       id: crypto.randomUUID(),
//       title: eventTitle,
//       start: `${eventDate}T${eventStart}`,
//       end: `${eventDate}T${eventEnd}`,
//       userId: auth.user.profile.sub as string,
//       allDay: !eventStart || !eventEnd,
//     };

//     try {
//       const res = await fetch(`/api/groups/${group.groupId}/events`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${auth.user.access_token}`,
//         },
//         body: JSON.stringify(newEvent),
//       });

//       if (!res.ok) throw new Error("Failed to save event");

//       setEvents((prev) => [...prev, newEvent]);
//       setShowEventModal(false);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to save event");
//     }
//   };

//   // Toggle show free spots
//   const toggleShowFreeSpots = () => setShowFreeSpots((v) => !v);

//   // Calendar days for grid
//   const days = getDaysInMonth(viewDate.year(), viewDate.month());

//   const today = dayjs().startOf("day");
//   const eightMonthsAhead = today.add(8, "month").endOf("month");

//   return (
//     <div className="max-w-5xl mx-auto p-4 font-sans">
//       <header className="flex justify-between items-center mb-4">
//         <button
//           onClick={() => setShowInviteModal(true)}
//           className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
//         >
//           Invite / Remove Members
//         </button>

//         <h2 className="text-2xl font-bold">{group.groupId}</h2>

//         <button
//           onClick={toggleShowFreeSpots}
//           className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
//         >
//           {showFreeSpots ? "Hide Free Slots" : "Find Free Slot"}
//         </button>
//       </header>

//       {/* Month Navigation */}
//       <div className="flex justify-between items-center mb-4">
//         <button
//           onClick={() => setViewDate(viewDate.subtract(1, "month"))}
//           className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
//         >
//           ←
//         </button>
//         <h3 className="font-semibold text-lg">{viewDate.format("MMMM YYYY")}</h3>
//         <button
//           onClick={() => setViewDate(viewDate.add(1, "month"))}
//           className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
//         >
//           →
//         </button>
//       </div>

//       {/* Calendar Grid */}
//       <div className="grid grid-cols-7 gap-2">
//         {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
//           <div key={day} className="font-semibold text-center">
//             {day}
//           </div>
//         ))}

//         {days.map((d, i) => {
//           if (!d) return <div key={i} className="min-h-[100px] bg-gray-50 rounded"></div>;

//           const date = viewDate.date(d);
//           const dayEvents = eventsOnDay(d);
//           const inRange =
//             date.isSameOrAfter(today, "day") && date.isSameOrBefore(eightMonthsAhead, "day");

//           // Calculate free slots if toggled on
//           const freeSlots = showFreeSpots && inRange
//             ? findFreeSlots(dayEvents, date.format("YYYY-MM-DD"), dayStart, dayEnd)
//             : [];

//           const isFullyFree = showFreeSpots && inRange && dayEvents.length === 0;

//           return (
//             <div
//               key={i}
//               className={`min-h-[100px] p-2 border rounded cursor-pointer ${
//                 isFullyFree ? "bg-green-100" : "bg-white"
//               }`}
//               onClick={() => {
//                 // If fully free, open modal for whole day slot
//                 if (isFullyFree) {
//                   openCreateEventModal(date.startOf("day"), date.endOf("day"), date);
//                 }
//               }}
//             >
//               <div className="text-xs font-bold">{d}</div>

//               {dayEvents.map((ev) => {
//                 const user = members.find((m) => m.id === ev.userId);
//                 if (!user) return null;

//                 const title = ev.allDay
//                   ? `${user.name} (All Day)`
//                   : !user.showTitles
//                   ? `${user.name}'s Event`
//                   : ev.title;

//                 return (
//                   <div
//                     key={ev.id}
//                     className="rounded px-1 py-0.5 mt-1 text-white text-xs"
//                     style={{ backgroundColor: user.color }}
//                   >
//                     {title}
//                   </div>
//                 );
//               })}

//               {/* Free Slots Buttons */}
//               {freeSlots.map((slot, idx) => (
//                 <button
//                   key={idx}
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     openCreateEventModal(slot.start, slot.end, date);
//                   }}
//                   className="bg-green-400 rounded px-1 py-0.5 mt-1 text-white text-xs"
//                 >
//                   Free: {slot.start.format("HH:mm")}–{slot.end.format("HH:mm")}
//                 </button>
//               ))}
//             </div>
//           );
//         })}
//       </div>

//       {/* Invite Modal */}
//       {showInviteModal && (
//         <InviteModal
//           group={group}
//           members={members}
//           onClose={() => setShowInviteModal(false)}
//           onRemove={async (userId) => {
//             try {
//               await removeUserFromGroup(group.groupId, userId);
//               setMembers((prev) => prev.filter((m) => m.id !== userId));
//             } catch {
//               alert("Failed to remove user.");
//             }
//           }}
//         />
//       )}

//       {/* Create Event Modal */}
//       {showEventModal && (
//         <CreateEventModal
//           show={showEventModal}
//           onClose={() => setShowEventModal(false)}
//           eventTitle={eventTitle}
//           setEventTitle={setEventTitle}
//           eventDate={eventDate}
//           eventStart={eventStart}
//           setEventStart={setEventStart}
//           eventEnd={eventEnd}
//           setEventEnd={setEventEnd}
//           repeatType={repeatType}
//           setRepeatType={setRepeatType}
//           rangeEndDate={rangeEndDate}
//           setRangeEndDate={setRangeEndDate}
//           onSave={saveEvent}
//         />
//       )}
//     </div>
//   );
// }
