import { useState, useEffect } from "react";
import { useParams } from "react-router";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import CreateEventModal from "../components/CreateEventModal";
import InviteModal from "../components/InviteModal";
import { removeUserFromGroup } from "../hooks/group";
import { useAuth } from "react-oidc-context";
import { useGroup } from "../hooks/useGroup";
import { authGuard } from "~/components";
import type { CalendarEventDto } from "@busybees/core";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

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

// Generate consistent color for user based on their authSub
const getUserColor = (authSub: string): string => {
  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#84cc16",
    "#f59e0b",
    "#10b981",
    "#6366f1",
    "#f43f5e",
    "#e11d48",
    "#be123c",
    "#9f1239",
    "#881337",
    "#7c2d12",
    "#ea580c",
    "#dc2626",
    "#c2410c",
    "#9a3412",
    "#7c2d12",
    "#65a30d",
    "#16a34a",
    "#15803d",
    "#166534",
    "#14532d",
    "#0f766e",
    "#0d9488",
    "#0891b2",
    "#0e7490",
    "#155e75",
    "#164e63",
    "#1e40af",
    "#1d4ed8",
    "#2563eb",
    "#3b82f6",
    "#6366f1",
    "#7c3aed",
    "#8b5cf6",
    "#a855f7",
    "#c084fc",
    "#d946ef",
    "#e879f9",
    "#f0abfc",
    "#fbbf24",
    "#f59e0b",
    "#d97706",
    "#b45309",
    "#92400e",
    "#78350f",
    "#451a03",
    "#365314",
    "#4d7c0f",
    "#65a30d",
    "#84cc16",
    "#a3e635",
    "#bef264",
    "#d9f99d",
  ];

  // Create a simple hash from the authSub
  let hash = 0;
  for (let i = 0; i < authSub.length; i++) {
    hash = ((hash << 5) - hash + authSub.charCodeAt(i)) & 0xffffffff;
  }

  // Use the hash to pick a color consistently
  return colors[Math.abs(hash) % colors.length];
};

export default authGuard(GroupCalendar);

function GroupCalendar() {
  const auth = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const { group, loading: groupLoading, error: groupError } = useGroup(groupId);
  const [makeEventsPublic, setMakeEventsPublic] = useState(false);

  const [viewDate, setViewDate] = useState(dayjs());
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
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFreeSpots, setShowFreeSpots] = useState(false);
  const [saveForGroup, setSaveForGroup] = useState(true);

  // 2️⃣ load events for this month
  useEffect(() => {
    if (!auth.user || !group?.groupId || groupLoading) return;
    const t0 = viewDate.startOf("month").toISOString();
    const t1 = viewDate.endOf("month").toISOString();
    fetch(
      `/api/groups/${encodeURIComponent(group.groupId)}/events?timeMin=${t0}&timeMax=${t1}`,
      { headers: { Authorization: `Bearer ${auth.user.access_token}` } },
    )
      .then((r) => r.json())
      .then((jsonData) => {
        const groupEvents = jsonData.events as CalendarEventDto[];
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

  // Loading and error states
  if (groupLoading) {
    return <div className="p-4 text-center">Loading group...</div>;
  }

  if (groupError || !group) {
    return (
      <div className="p-4 text-red-600">{groupError || "Group not found"}</div>
    );
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
            members={group.members}
            onRemove={async (userId: string) => {
              try {
                await removeUserFromGroup(group.groupId, userId);
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
                  const isPrivate = false;
                  const title = ev.allDay
                    ? `${ev.userId} (All Day)`
                    : isPrivate
                      ? `${ev.userId}'s Event`
                      : ev.title;
                  return (
                    <div
                      key={ev.id}
                      className="rounded-md px-1 py-0.5 mt-1 text-xs text-white"
                      style={{
                        backgroundColor: getUserColor(ev.userId),
                      }}
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
