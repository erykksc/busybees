interface CreateGroupModalProps {
  newGroupName: string;
  onNameChange: (value: string) => void;
  nameError: string;
  isNameValid: boolean;
  isCreatingGroup: boolean;
  makeEventsPublic: boolean;
  onTogglePublic: () => void;
  onCreateGroup: () => void;
  onClose: () => void;
}

export default function CreateGroupModal({
  newGroupName,
  onNameChange,
  nameError,
  isNameValid,
  isCreatingGroup,
  makeEventsPublic,
  onTogglePublic,
  onCreateGroup,
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
          disabled={isCreatingGroup}
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
            onChange={onTogglePublic}
            disabled={isCreatingGroup}
            className="w-4 h-4"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onCreateGroup}
            disabled={!isNameValid || isCreatingGroup}
            className={`flex items-center justify-center px-4 py-2 rounded-full shadow-md transition-all ${
              isNameValid
                ? "bg-green-200 text-green-800 hover:bg-green-300"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            } ${isCreatingGroup ? "opacity-70 cursor-wait" : ""}`}
          >
            {isCreatingGroup ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-green-800"
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
                    d="M4 12a8 8 0 018-8v4a4 0 00-4 4H4z"
                  />
                </svg>
                Creating…
              </>
            ) : (
              "Create Calendar & Copy Invite Link"
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isCreatingGroup}
            className="mt-3 text-sm underline text-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
