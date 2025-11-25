"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { mois: "Jan", enfants: 1200, campagnes: 2 },
  { mois: "Fév", enfants: 1500, campagnes: 3 },
  { mois: "Mar", enfants: 1800, campagnes: 1 },
  { mois: "Avr", enfants: 2200, campagnes: 4 },
  { mois: "Mai", enfants: 2600, campagnes: 2 },
  { mois: "Juin", enfants: 2400, campagnes: 3 },
  { mois: "Juil", enfants: 2800, campagnes: 2 },
  { mois: "Août", enfants: 3000, campagnes: 3 },
  { mois: "Sept", enfants: 2700, campagnes: 2 },
  { mois: "Oct", enfants: 3200, campagnes: 4 },
  { mois: "Nov", enfants: 3500, campagnes: 3 },
  { mois: "Déc", enfants: 4000, campagnes: 5 },
];

export default function StatsChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-[400px]">
      <h3 className="text-lg font-semibold mb-4">
        Statistiques de vaccination (par mois)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mois" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="enfants"
            stroke="#2563eb" // Bleu
            strokeWidth={3}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="campagnes"
            stroke="#16a34a" // Vert
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
