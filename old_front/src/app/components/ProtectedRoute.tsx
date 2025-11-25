"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  allowedRoles?: string[]; // Ex: ["national", "regional"]
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⏳ Si pas connecté → rediriger vers login
    if (!user) {
      router.replace("/login");
      return;
    }

    // 🔒 Si des rôles sont définis et que l’utilisateur n’y correspond pas → rediriger vers son dashboard
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(`/dashboard/${user.role}`);
      return;
    }

    setLoading(false);
  }, [user, router, allowedRoles]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  return <>{children}</>;
}
