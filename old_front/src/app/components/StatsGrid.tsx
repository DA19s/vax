"use client";

import StatsCard, { StatCardProps } from "./StatsCards";

type StatsGridProps = {
  stats: StatCardProps[];
  columns?: string;
};

export default function StatsGrid({
  stats,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}: StatsGridProps) {
  return (
    <div className={`grid ${columns} gap-6`}>
      {stats.map((stat, idx) => (
        <StatsCard
          key={idx}
          title={stat.title}
          value={stat.value}
          color={stat.color}
        />
      ))}
    </div>
  );
}
