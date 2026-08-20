"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line } from "recharts";

const CATEGORY_COLOR = {
  water: "#1c5a85",
  roads: "#5b3b8c",
  electricity: "#8a6d0a",
  healthcare: "#a02c2c",
  sanitation: "#226354",
  other: "#888",
};

const URGENCY_COLOR = {
  critical: "#b8391a",
  high: "#ad5f14",
  medium: "#8a6d0a",
  low: "#2c6b4f",
};

export function CategoryBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e2d8" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#6b6f80" }} />
        <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 13, fill: "#12172b" }} />
        <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 13, borderRadius: 8 }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={CATEGORY_COLOR[entry.category] || "#888"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ data }) {
  const categories = ["water", "roads", "electricity", "healthcare", "sanitation", "other"];
  const CATEGORY_COLOR2 = {
    water: "#1c5a85",
    roads: "#5b3b8c",
    electricity: "#8a6d0a",
    healthcare: "#a02c2c",
    sanitation: "#226354",
    other: "#888",
  };
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: 4, right: 20, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e2d8" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b6f80" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b6f80" }} />
        <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 13, borderRadius: 8 }} />
        {categories.map((cat) => (
          <Line
            key={cat}
            type="monotone"
            dataKey={cat}
            stroke={CATEGORY_COLOR2[cat]}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function UrgencyPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="urgency" innerRadius={55} outerRadius={95} paddingAngle={3}>
          {data.map((entry, i) => (
            <Cell key={i} fill={URGENCY_COLOR[entry.urgency] || "#888"} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 13, borderRadius: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
