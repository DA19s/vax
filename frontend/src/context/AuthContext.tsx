"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { usePathname, useRouter } from "next/navigation";

type Role = "NATIONAL" | "REGIONAL" | "DISTRICT" | "AGENT" | string;

type AuthUser = {
  id: string;
  role: Role;
  email?: string | null;
  agentLevel?: string | null;
};

type AuthContextShape = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (
    tokens: { accessToken: string; refreshToken: string },
    meta?: { email?: string | null }
  ) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

type JwtPayload = {
  sub: string;
  role: Role;
  agentLevel?: string | null;
  exp?: number;
};

const ACCESS_TOKEN_KEY = "vax_access_token";
const REFRESH_TOKEN_KEY = "vax_refresh_token";
const USER_KEY = "vax_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const storedAccess = Cookies.get(ACCESS_TOKEN_KEY) ?? null;
      const storedRefresh = Cookies.get(REFRESH_TOKEN_KEY) ?? null;
      const storedUser = Cookies.get(USER_KEY);

      if (storedAccess && storedRefresh && storedUser) {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        setUser(parsedUser);
      }
    } catch {
      // ignore corrupted cookies
      Cookies.remove(ACCESS_TOKEN_KEY);
      Cookies.remove(REFRESH_TOKEN_KEY);
      Cookies.remove(USER_KEY);
    }
  }, []);

  const login = (
    {
      accessToken: newAccess,
      refreshToken: newRefresh,
    }: {
      accessToken: string;
      refreshToken: string;
    },
    meta?: { email?: string | null }
  ) => {
    try {
      const decoded = jwtDecode<JwtPayload>(newAccess);
      if (!decoded?.sub || !decoded?.role) {
        throw new Error("Token invalide");
      }

      const authUser: AuthUser = {
        id: decoded.sub,
        role: decoded.role,
        email: meta?.email ?? null,
        agentLevel: decoded.agentLevel ?? null,
      };

      setAccessToken(newAccess);
      setRefreshToken(newRefresh);
      setUser(authUser);

      Cookies.set(ACCESS_TOKEN_KEY, newAccess, { sameSite: "strict" });
      Cookies.set(REFRESH_TOKEN_KEY, newRefresh, { sameSite: "strict" });
      Cookies.set(USER_KEY, JSON.stringify(authUser), {
        sameSite: "strict",
      });
    } catch (error) {
      console.error("Erreur décodage token:", error);
      logout();
      throw error;
    }
  };

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(USER_KEY);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!accessToken) {
      if (pathname !== "/login") {
        router.push("/login");
      }
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);
      if (decoded?.exp) {
        const expiresAt = decoded.exp * 1000;
        const delay = expiresAt - Date.now();

        if (delay <= 0) {
          logout();
        } else {
          timeout = setTimeout(() => logout(), delay);
        }
      }
    } catch (error) {
      console.error("Token invalide ou expiré:", error);
      logout();
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [accessToken, logout, pathname, router]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}

