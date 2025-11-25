"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

/* -------------------------------------------------------------------------- */
/* 🔐 TYPES                                                                  */
/* -------------------------------------------------------------------------- */
type Permissions = {
  dashboard: boolean;
  enfants: boolean;
  rendezvous: boolean;
  campagnes: boolean;
  vaccins: boolean;
  rapports: boolean;
  agents: boolean;
  stocks: boolean;
  parametres: boolean;
};

type User = {
  id: string;
  email: string;
  role: "agent" | "district" | "regional" | "national" | string;
  firstName?: string;
  lastName?: string;
  region?: string;
  healthCenter?: string;
  agentLevel?: "facility_admin" | "facility_staff"; // District n'est plus un agentLevel
  permissions?: Permissions;
  token?: string;
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  permissions: Permissions | null;
}

/* -------------------------------------------------------------------------- */
/* 🧩 CONTEXTE AUTHENTIFICATION                                              */
/* -------------------------------------------------------------------------- */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  /* ✅ Hydratation immédiate depuis les cookies */
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = Cookies.get("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Note: JWT is stored as HttpOnly cookie by backend; it is not readable in JS.
  // We keep a token state for API convenience but do not hydrate it from cookies.
  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  /* -------------------------------------------------------------------------- */
  /* 🔑 Recharger les permissions utilisateur                                 */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/users/${user.id}/roles`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.permissions) {
          const updated = { ...user, permissions: data.permissions };
          setUser(updated);
          setPermissions(data.permissions);
          Cookies.set("user", JSON.stringify(updated), { sameSite: "strict" });
        }
      } catch (err) {
        console.error("Erreur chargement permissions:", err);
      }
    };
    loadPermissions();
  }, [user?.id]);

  /* -------------------------------------------------------------------------- */
  /* 🔐 LOGIN                                                                 */
  /* -------------------------------------------------------------------------- */
  const login = (userData: User, jwtToken?: string) => {
    // Server already set HttpOnly cookie 'token'. We only persist the user object for UI.
    const mergedUser = userData;
    setUser(mergedUser);
    setToken(null);
    Cookies.set("user", JSON.stringify(mergedUser), { sameSite: "strict" });
    setPermissions(null);
  };

  /* -------------------------------------------------------------------------- */
  /* 🚪 LOGOUT                                                                */
  /* -------------------------------------------------------------------------- */
  const logout = () => {
    setUser(null);
    setToken(null);
    setPermissions(null);
    Cookies.remove("user");
    Cookies.remove("token");
    setTimeout(() => router.push("/login"), 150);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, permissions }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/* 🧭 HOOK CUSTOM                                                            */
/* -------------------------------------------------------------------------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
};