import React, { useState } from "react";
import { Group } from "../types";
import { OnRemoveGroup } from "../types";

interface BurgerMenuProps {
  localGroups: Group[];
  activeTabId: string;
  onSelectCalendar: (calendar: "personal" | Group) => void;
  onCreateGroup: () => void;
  onRemoveGroup: (group: Group) => void ;
  onClose: () => void;
}

export default function BurgerMenu({
  localGroups,
  activeTabId,
  onSelectCalendar,
  onCreateGroup,
  onRemoveGroup,
  onClose,
}: BurgerMenuProps) {
  const [pendingRemove, setPendingRemove] = useState<Group | null>(null);

  return (
    <div className="fixed top-0 left-0 w-72 h-full bg-white shadow-xl z-50 p-6 flex flex-col">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-2xl font-bold text-gray-600 hover:text-red-500 transition"
      >
        ✖
      </button>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Calendars</h3>

      {/* List */}
      <ul className="space-y-3 flex-1 overflow-y-auto">
        <li>
          <button
            onClick={() => onSelectCalendar('personal')}
            className={`w-full text-left px-4 py-2 rounded-full shadow font-medium ${
              activeTabId === 'personal'
                ? 'bg-[#fbc289] text-gray-800'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            My Calendar
          </button>
        </li>

        {localGroups.map(group => (
          <li
            key={group.id}
            className={`flex justify-between items-center px-3 py-2 rounded-lg shadow-sm ${
              activeTabId === group.id ? 'bg-[#fbc289]' : 'bg-gray-100'
            }`}
          >
            <button
              onClick={() => onSelectCalendar(group)}
              className={`text-left font-medium w-full text-sm ${
                activeTabId === group.id ? 'text-gray-800' : 'text-gray-700 hover:underline'
              }`}
            >
              {group.name}
            </button>
            <button
              onClick={() => setPendingRemove(group)}
              className="text-red-500 hover:text-red-700"
              title="Remove"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      {/* Create Group Button */}
      <button
        onClick={onCreateGroup}
        className="mt-6 bg-purple-200 text-purple-800 px-4 py-2 rounded-full shadow-md hover:bg-purple-300 transition-all"
      >
        + Create Group Calendar
      </button>

      {/* Confirmation Modal */}
       {pendingRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm font-cute text-gray-800">
            <h3 className="text-lg mb-4 text-center">
                Are you sure you want to leave <br />
                <span className="text-black font-bold">{pendingRemove.name}</span>?
            </h3>
            <div className="flex justify-center gap-4 mt-4">
                <button
                onClick={() => setPendingRemove(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-all shadow text-sm"
                >
                No, Cancel
                </button>
                <button
                onClick={async () => {
                    await onRemoveGroup(pendingRemove);
                    setPendingRemove(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow text-sm"
                >
                Yes, Leave
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}
