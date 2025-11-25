"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty(
        "--primary-color",
        settings.primaryColor
      );
    }
  }, [settings?.primaryColor]);

  if (!mounted || loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Chargement...
      </div>
    );

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Déconnexion...
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* ✅ Sidebar fixe */}
      <Sidebar />

      {/* ✅ Colonne principale */}
      <div className="flex flex-col flex-1 min-h-screen ml-64">
        {/* ✅ Header fixé en haut */}
        <div className="fixed top-0 left-64 right-0 z-40">
          <Header />
        </div>

        {/* ✅ Contenu principal avec padding top pour compenser la hauteur du header */}
        <main className="flex-1 w-full p-6 pt-20 overflow-y-auto bg-[#f9fafb]">
          {children}
        </main>

        {/* ✅ Footer */}
        <footer className="text-center py-3 text-sm text-gray-500 border-t">
          © {new Date().getFullYear()} VacxCare • Tous droits réservés
        </footer>
      </div>
    </div>
  );
}