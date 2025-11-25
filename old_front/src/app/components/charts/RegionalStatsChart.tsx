"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { centre: "Dakar", enfants: 1200 },
  { centre: "Thiès", enfants: 950 },
  { centre: "Saint-Louis", enfants: 780 },
  { centre: "Kaolack", enfants: 650 },
  { centre: "Ziguinchor", enfants: 500 },
];

export default function RegionalStatsChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Vaccinations par région</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="centre" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="enfants" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>

      {/* ✅ Custom légende */}
      <div className="flex justify-center mt-4">
        <span className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 bg-blue-600 rounded-full"></span> Enfants
          vaccinés
        </span>
      </div>
    </div>
  );
}
