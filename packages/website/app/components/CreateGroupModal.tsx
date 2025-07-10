import React from "react";
import type { CreateGroupModalProps } from "~/types"; // adjust path as needed

export default function CreateGroupModal({
  newGroupName,
  onNameChange,
  nameError,
  isNameValid,
  makeEventsPublic,
  toggleMakeEventsPublic,
  onInviteFriends,
  onClose,
}: CreateGroupModalProps) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4">Create Shared Calendar</h2>
        <input
          type="text"
          placeholder="Calendar name..."
          value={newGroupName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-2"
        />
        {nameError && <p className="text-red-500 text-sm mb-2">{nameError}</p>}

        <div className="flex items-center mb-4">
          <label htmlFor="privacyToggle" className="mr-2 text-sm">
            Make my event titles public
          </label>
          <input
            id="privacyToggle"
            type="checkbox"
            checked={makeEventsPublic}
            onChange={toggleMakeEventsPublic}
            className="w-4 h-4"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onInviteFriends}
            disabled={!isNameValid}
            className={`${
              isNameValid
                ? "bg-green-200 text-green-800 px-4 py-2 rounded-full shadow-md hover:bg-green-300 transition-all"
                : "bg-gray-300 text-gray-600 cursor-not-allowed px-4 py-2 rounded-full shadow-md"
            }`}
          >
            Create Calendar & Copy Invite Link
          </button>
          <button
            onClick={onClose}
            className="mt-3 text-sm underline text-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
