"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Article = {
  id: string,
  title: string;
  summary: string;
  link: string;
  image_url?: string;
  trending?: boolean;
  category?: string;
  bookmark?: boolean;
  created_at: string;
}

function buildCategoryData(articles: Article[]) {
  const map: Record<string, number> = {};

  articles.forEach((article) => {
    if (!article.category) return; // ignore null

    map[article.category] = (map[article.category] || 0) + 1;
  });

  return Object.entries(map).map(([category, count]) => ({
    category,
    count,
  }));
}


export default function NewsTrendsChart({
  articles,
}: {
  articles: Article[]
}) {
  const data = buildCategoryData(articles)
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        News Trends
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Bar
              dataKey="count"
              fill="#3b82f6"
              name="Articles"
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#eb1165"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Trend Line"
            />
          </ComposedChart >

        </ResponsiveContainer>
      </div>
    </div>
  );
}


