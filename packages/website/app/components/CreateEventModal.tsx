import type { CreateEventModalProps } from "~/types";

const CreateEventModal = ({
  show,
  onClose,
  eventTitle,
  setEventTitle,
  eventDate,
  eventStart,
  setEventStart,
  eventEnd,
  setEventEnd,
  repeatType,
  setRepeatType,
  rangeEndDate,
  setRangeEndDate,
  onSave,
}: CreateEventModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-bold mb-4">Create Event</h3>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Title:</label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Date:</label>
          <input
            type="text"
            value={eventDate}
            disabled
            className="border rounded px-2 py-1 w-full bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Start Time:</label>
          <input
            type="time"
            value={eventStart}
            onChange={(e) => setEventStart(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">End Time:</label>
          <input
            type="time"
            value={eventEnd}
            onChange={(e) => setEventEnd(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Repeat:</label>
          <select
            value={repeatType}
            onChange={(e) => setRepeatType(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="none">None</option>
            <option value="daily">Every Day</option>
            <option value="weekly">Every Week</option>
            <option value="yearly">Every Year</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Range Start Date:</label>
          <input
            type="date"
            value={rangeEndDate || eventDate}
            min={eventDate}
            onChange={(e) => setRangeEndDate(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Range End Date:</label>
          <input
            type="date"
            value={rangeEndDate || eventDate}
            min={eventDate}
            onChange={(e) => setRangeEndDate(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-full shadow-md hover:bg-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="bg-green-200 text-green-800 px-4 py-2 rounded-full shadow-md hover:bg-green-300 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
