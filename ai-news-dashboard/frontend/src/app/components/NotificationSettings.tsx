"use client";

type Props = {
  emailEnabled: boolean;
  frequency: "hourly" | "6hour" | "daily";
  onToggle: () => void;
  onFrequencyChange: (f: "hourly" | "6hour" | "daily") => void;
  onSave: () => void;
  loadingEmail: boolean;
};

export default function NotificationSettings({
  emailEnabled,
  frequency,
  onToggle,
  onFrequencyChange,
  onSave,
  loadingEmail,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900">
        Notification Settings
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Control how and when you receive news updates.
      </p>

      {/* Enable toggle */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Email Notifications
        </span>

        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            emailEnabled ? "bg-emerald-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              emailEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Frequency */}
      <div className="mt-6">
        <label className="text-sm font-medium text-gray-700">
          Frequency
        </label>

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => onFrequencyChange("hourly")}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              frequency === "hourly"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Every hour
          </button>

          <button
            onClick={() => onFrequencyChange("6hour")}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              frequency === "6hour"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Every 6 hours
          </button>

          <button
            onClick={() => onFrequencyChange("daily")}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              frequency === "daily"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        disabled={loadingEmail}
        onClick={onSave}
        className="mt-6 w-full rounded-lg bg-emerald-500 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {loadingEmail ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
