"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { day: "Mon", volume: 45, sentiment: 50 },
  { day: "Tue", volume: 60, sentiment: 65 },
  { day: "Wed", volume: 40, sentiment: 45 },
  { day: "Thu", volume: 75, sentiment: 70 },
  { day: "Fri", volume: 55, sentiment: 60 },
  { day: "Sat", volume: 80, sentiment: 75 },
  { day: "Sun", volume: 65, sentiment: 55 },
];

export default function NewsTrendsChart() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        News Trends
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="volume"
              stroke="#22c55e"
              strokeWidth={2}
              name="News Volume"
            />
            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Sentiment Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


