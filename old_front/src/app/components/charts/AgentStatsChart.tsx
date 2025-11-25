"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Enfants vaccinés", value: 90 },
  { name: "Rendez-vous restants", value: 30 },
  { name: "Non présentés", value: 10 },
];

const COLORS = ["#16a34a", "#2563eb", "#f97316"];

export default function AgentStatsChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Suivi des rendez-vous</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* ✅ Custom légende */}
      <div className="flex justify-center gap-4 mt-4">
        <span className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 bg-green-600 rounded-full"></span> Enfants
          vaccinés
        </span>
        <span className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 bg-blue-600 rounded-full"></span> Rendez-vous
          restants
        </span>
        <span className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 bg-orange-500 rounded-full"></span> Non
          présentés
        </span>
      </div>
    </div>
  );
}
