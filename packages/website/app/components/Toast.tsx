import { X } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  return (
    <div
      className="
        animate-slide-in
        fixed bottom-4 right-4 z-50
        bg-white border-l-4 border-red-500
        rounded-lg shadow-lg
        max-w-xs w-full p-4
      "
      role="alert"
    >
      {/* Header */}
      <div className="flex items-center">
        <X className="w-5 h-5 text-red-500" />
        <span className="ml-2 text-red-800 font-semibold">Error</span>
        <button
          onClick={onClose}
          className="ml-auto text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✖
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-red-200 my-2" />

      {/* Message */}
      <p className="text-red-700 text-sm">{message}</p>
    </div>
  );
}
