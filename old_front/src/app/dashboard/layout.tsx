"use client";

import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["national", "regional", "agent", "user"]}>
      {children}
    </ProtectedRoute>
  );
}
