import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import CreateEventModal from "./CreateEventModal";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import type { CalendarEventDto } from "@busybees/core";
import { useAuth } from "react-oidc-context";
import { Toast } from "../components/Toast";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const getDaysInMonth = (year: number, month: number): (number | null)[] => {
  const date = dayjs(`${year}-${month + 1}-01`);

  let startDay = date.day();
  startDay = ((startDay + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const endDay = date.daysInMonth();
  const prev = [...Array(startDay).keys()].map(() => null);
  const curr = Array.from({ length: endDay }, (_, i) => i + 1);

  return [...prev, ...curr];
};

const MyCalendar = () => {
  const auth = useAuth();
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const hasFetched = useRef(false);
  const [viewDate, setViewDate] = useState(dayjs());
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const showError = (msg: string) => setToast({ message: msg });

  const goToNextMonth = () => setViewDate(viewDate.add(1, "month"));
  const goToPrevMonth = () => {
    const now = dayjs().startOf("month");
    if (viewDate.isAfter(now)) setViewDate(viewDate.subtract(1, "month"));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      if (auth.isLoading || !auth.user) return;
      if (hasFetched.current) return;
      hasFetched.current = true;

      setLoadingEvents(true);
      try {
        const timeMin = viewDate.startOf("month").toISOString();
        const timeMax = viewDate.endOf("month").toISOString();
        const res = await fetch(
          `/api/user/events?timeMin=${timeMin}&timeMax=${timeMax}`,
          {
            headers: {
              Authorization: `Bearer ${auth.user.access_token}`,
            },
          },
        );
        if (!res.ok) {
          console.error("Failed to fetch events:", await res.text());
          return;
        }
        const payload = (await res.json()) as { events: CalendarEventDto[] };
        setEvents(payload.events);
      } catch (err) {
        console.error("Error fetching events:", err);
        showError("Error fetching events.");
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [auth.isLoading, auth.user, viewDate]);

  const eventsOnDay = (day: number): CalendarEventDto[] => {
    if (!day) return [];
    const currentDate = viewDate.date(day).startOf("day");

    return events.filter((e) => {
      const start = dayjs(e.start).startOf("day");
      const end = dayjs(e.end).startOf("day");
      return (
        currentDate.isSame(start, "day") ||
        (end.isAfter(start, "day") &&
          currentDate.isSameOrAfter(start, "day") &&
          currentDate.isSameOrBefore(end, "day"))
      );
    });
  };

  const days = getDaysInMonth(viewDate.year(), viewDate.month());

  const handleDayClick = (day: number | null): void => {
    if (!day) return;

    const date = viewDate.date(day);
    setEventTitle("");
    setEventDate(date.format("YYYY-MM-DD"));
    setEventStart("");
    setEventEnd("");
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    const eventsToCreate: CalendarEventDto[] = [];

    const startDate = dayjs(eventDate);
    const endDate = rangeEndDate ? dayjs(rangeEndDate) : startDate;

    if (!auth.user) {
      console.warn("User not authenticated");
      return;
    }

    let current = startDate;
    while (current.isSameOrBefore(endDate, "day")) {
      eventsToCreate.push({
        id: String(Date.now() + Math.random()),
        title: eventTitle,
        start: current.format("YYYY-MM-DD") + "T" + eventStart,
        end: current.format("YYYY-MM-DD") + "T" + eventEnd,
        userId: auth.user.profile.sub,
        allDay: !eventStart || !eventEnd,
      });

      if (repeatType === "daily") current = current.add(1, "day");
      else if (repeatType === "weekly") current = current.add(1, "week");
      else if (repeatType === "yearly") current = current.add(1, "year");
      else break;
    }

    try {
      const response = await fetch("/api/user/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user.access_token}`,
        },
        body: JSON.stringify(eventsToCreate),
      });

      if (!response.ok) {
        console.error("Failed to save events.");
        return;
      }

      setEvents((prev) => [...prev, ...eventsToCreate]);
      setShowEventModal(false);
    } catch (err) {
      console.error("Error saving events:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-cute p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-center flex-1">My Calendar</h2>
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPrevMonth}
          className="text-sm bg-gray-200 px-2 py-1 rounded-xl"
        >
          ←
        </button>
        <h2 className="text-xl font-bold">{viewDate.format("MMMM YYYY")}</h2>
        <button
          onClick={goToNextMonth}
          className="text-sm bg-gray-200 px-2 py-1 rounded-xl"
        >
          →
        </button>
      </div>

      {/* Days Grid */}
      {loadingEvents ? (
        <div className="flex justify-center items-center h-64">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
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
          <span className="ml-2 text-blue-600">Loading events…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="text-center font-semibold">
              {day}
            </div>
          ))}

          {days.map((d, i) => (
            <div
              key={i}
              onClick={() => handleDayClick(d)}
              className="border rounded-2xl min-h-[100px] p-1 bg-white shadow-sm relative cursor-pointer hover:bg-gray-50"
            >
              {d && <div className="font-bold text-xs mb-1">{d}</div>}
              {d !== null &&
                eventsOnDay(d).map((ev) => {
                  const title = ev.allDay ? `(All Day)` : ev.title;

                  const startDay = dayjs(ev.start).startOf("day");
                  const endDay = dayjs(ev.end).startOf("day");

                  const isRange = !startDay.isSame(endDay, "day");

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => e.stopPropagation()}
                      className={clsx(
                        "relative rounded-md px-1 py-0.5 mt-1 text-xs text-white cursor-pointer",
                      )}
                      style={{ backgroundColor: "#4ade80" }}
                    >
                      {title}

                      {isRange && (
                        <div
                          className="absolute inset-x-0 top-0 bottom-0 bg-black opacity-10 rounded-full pointer-events-none"
                          title="Range event"
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {/* The Modal for create event*/}
      <CreateEventModal
        show={showEventModal}
        onClose={() => setShowEventModal(false)}
        eventTitle={eventTitle}
        setEventTitle={setEventTitle}
        eventDate={eventDate}
        eventStart={eventStart}
        setEventStart={setEventStart}
        eventEnd={eventEnd}
        setEventEnd={setEventEnd}
        repeatType={repeatType}
        setRepeatType={setRepeatType}
        rangeEndDate={rangeEndDate}
        setRangeEndDate={setRangeEndDate}
        onSave={handleSaveEvent}
      />

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default MyCalendar;
