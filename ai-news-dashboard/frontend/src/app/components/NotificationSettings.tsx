"use client";

import { useState } from "react";

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState("6h");
  const [time, setTime] = useState("09:00");

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
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            enabled ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              enabled ? "translate-x-6" : "translate-x-1"
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
          {[
            { id: "1h", label: "Every hour" },
            { id: "6h", label: "Every 6 hours" },
            { id: "daily", label: "Daily" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFrequency(opt.id)}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                frequency === opt.id
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time picker */}
      <div className="mt-6">
        <label className="text-sm font-medium text-gray-700">
          Preferred Time
        </label>

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Save */}
      <button
        className="mt-6 w-full rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600"
        onClick={() =>
          alert(
            `Saved!\nEnabled: ${enabled}\nFrequency: ${frequency}\nTime: ${time}`
          )
        }
      >
        Save Settings
      </button>
    </div>
  );
}
