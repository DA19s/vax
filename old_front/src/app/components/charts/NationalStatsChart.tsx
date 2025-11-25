"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { mois: "Jan", enfants: 1200, campagnes: 4 },
  { mois: "Fév", enfants: 1400, campagnes: 3 },
  { mois: "Mar", enfants: 1800, campagnes: 5 },
  { mois: "Avr", enfants: 2000, campagnes: 6 },
  { mois: "Mai", enfants: 2200, campagnes: 4 },
  { mois: "Juin", enfants: 2500, campagnes: 7 },
];

export default function NationalStatsChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        Tendance nationale des vaccinations
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="enfants"
            stroke="#2563eb"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="campagnes"
            stroke="#16a34a"
            strokeWidth={2}
          />
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis dataKey="mois" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>

      {/* ✅ Custom légende */}
      <div className="flex gap-4 justify-center mt-4">
        <span className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 bg-blue-600 rounded-full"></span> Enfants
          vaccinés
        </span>
        <span className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 bg-green-600 rounded-full"></span> Campagnes
          actives
        </span>
      </div>
    </div>
  );
}
