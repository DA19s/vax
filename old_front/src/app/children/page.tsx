"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ChildrenRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const role = user.role;
    if (role === "agent") router.replace("/agent/enfants");
    else if (role === "regional") router.replace("/regional/enfants");
    else if (role === "national") router.replace("/national/enfants");
    else router.replace("/");
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-600">
      Redirection en cours…
    </div>
  );
}
