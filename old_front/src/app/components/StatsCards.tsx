"use client";

export type StatCardProps = {
  title: string;
  value: string | number;
  color?: string; // ex: "text-blue-600"
};

export default function StatsCard({ title, value, color }: StatCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 text-center">
      <p className="text-gray-500">{title}</p>
      <p className={`text-2xl font-bold ${color ?? "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}
