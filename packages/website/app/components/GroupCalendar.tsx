import { useState, useEffect } from "react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import CreateEventModal from "./CreateEventModal";
import InviteModal from "./InviteModal";
import { removeUserFromGroup } from "../hooks/group";
import type { User, Group } from "~/types";
import { useAuth } from "react-oidc-context";
import type { CalendarEventDto } from "@busybees/core";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const getDaysInMonth = (year: number, month: number): (number | null)[] => {
  const days = [];
  const date = dayjs(`${year}-${month + 1}-01`);

  let startDay = date.day();
  startDay = ((startDay + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const endDay = date.daysInMonth();
  const prev = [...Array(startDay).keys()].map(() => null);
  const curr = Array.from({ length: endDay }, (_, i) => i + 1);

  return [...prev, ...curr];
};

interface Slot {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

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

  const freeSlots = [];
  let lastEnd = start;

  for (const event of sorted) {
    const evStart = dayjs(event.start);
    const evEnd = dayjs(event.end);

    if (evStart.isAfter(lastEnd)) {
      freeSlots.push({ start: lastEnd, end: evStart });
    }

    if (evEnd.isAfter(lastEnd)) {
      lastEnd = evEnd;
    }
  }

  if (lastEnd.isBefore(end)) {
    freeSlots.push({ start: lastEnd, end });
  }

  return freeSlots;
};

const GroupCalendar = ({
  group,
  currentUser,
  makeEventsPublic,
  setMakeEventsPublic,
}: {
  group: Group;
  currentUser: User;
  makeEventsPublic: boolean;
  setMakeEventsPublic: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const auth = useAuth();
  const [viewDate, setViewDate] = useState(dayjs());
  const [showFreeSpots, setShowFreeSpots] = useState(false);
  const DEFAULT_START = 8;
  const DEFAULT_END = 21;
  const [showModal, setShowModal] = useState(false);
  const [dayStart, setDayStart] = useState(DEFAULT_START);
  const [dayEnd, setDayEnd] = useState(DEFAULT_END);
  const [tempStart, setTempStart] = useState(dayStart);
  const [tempEnd, setTempEnd] = useState(dayEnd);
  const [saveForGroup, setSaveForGroup] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState<string>("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [repeatType, setRepeatType] = useState("none");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!auth.user) return;

      try {
        const res = await fetch(`/api/groups/${group.id}/profile`, {
          headers: {
            Authorization: `Bearer ${auth.user.access_token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch group profile");

        const data = await res.json();
        setUsers(data.members); // Make sure `data.members` is a User[]
      } catch (err) {
        console.error("Error fetching group members:", err);
      }
    };

    fetchGroupMembers();
  }, [group.id, auth.user]);

  useEffect(() => {
    const fetchGroupProfile = async () => {
      try {
        const response = await fetch(`/api/groups/${group.id}/profile`, {
          headers: {
            Authorization: `Bearer ${auth.user?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch group profile");
        }

        const data = await response.json();
        setGroupMembers(data.members); // Assuming API returns `members: User[]`
      } catch (err) {
        console.error("Error fetching group profile:", err);
      }
    };

    fetchGroupProfile();
  }, [group.id]);

  useEffect(() => {
    const fetchGroupEvents = async () => {
      if (!auth.user) return;
      const from = viewDate.startOf("month").toISOString();
      const until = viewDate.endOf("month").toISOString();

      try {
        const response = await fetch(
          `/api/groups/${group.id}/events?from=${from}&until=${until}`,
          {
            headers: {
              Authorization: `Bearer ${auth.user.access_token}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch events.");
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchGroupEvents();
  }, [viewDate, group.id, auth.user]);

  const handleInviteAgain = () => {
    const inviteLink = `${window.location.origin}/invite/${group.id}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert(`Invite link copied: ${inviteLink}`);
    });
  };

  const today = dayjs().startOf("day");
  const eightMonthsAhead = today.add(8, "month").endOf("month");

  const days = getDaysInMonth(viewDate.year(), viewDate.month());

  const eventsOnDay = (day: number): CalendarEventDto[] => {
    if (!day) return [];
    const date = viewDate.date(day).format("YYYY-MM-DD");
    return events.filter((e) => dayjs(e.start).format("YYYY-MM-DD") === date);
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
      localStorage.setItem(`group:${group.id}:dayStart`, tempStart.toString());
      localStorage.setItem(`group:${group.id}:dayEnd`, tempEnd.toString());
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
                await removeUserFromGroup(group.id, userId);
                setGroupMembers((prev) => prev.filter((u) => u.id !== userId));
              } catch (e) {
                alert("Failed to remove user.");
                console.error(e);
              }
            }}
            onClose={() => setShowInviteModal(false)}
          />
        )}

        <h2 className="text-2xl font-bold text-center flex-1">{group.name}</h2>

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
        onSave={() => {
          const newEvent = {
            id: crypto.randomUUID(),
            title: eventTitle,
            start: eventStart,
            end: eventEnd,
            userId: String(currentUser.id),
            allDay,
          };

          setEvents((prev) => [...prev, newEvent]);
          setShowEventModal(false);
        }}
      />
    </div>
  );
};

export default GroupCalendar;
