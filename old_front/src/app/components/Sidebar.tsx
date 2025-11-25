"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { useEffect, useState } from "react";
import LogoPreview from "@/app/components/LogoPreview";

// Icônes Lucide
import {
  BarChart2,
  Calendar,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Package,
  Settings,
  UserCog,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const { user, permissions } = useAuth();
  const { settings } = useSettings();
  const { settings: systemSettings } = useSystemSettings();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !user) return null;

  // 📊 Type pour les items de menu
  type MenuItem = {
    name: string;
    href: string;
    icon: any;
    perm?: string;
  };

  // 📊 Menus Agent (structure de santé)
  const agentMenus: MenuItem[] = [
    { name: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard, perm: "dashboard" },
    { name: "Enfants", href: "/agent/enfants", icon: Users, perm: "enfants" },
    { name: "Rendez-vous", href: "/agent/rendez-vous", icon: Calendar, perm: "rendezvous" },
    { name: "Campagnes", href: "/agent/campagnes", icon: Megaphone, perm: "campagnes" },
    { name: "Stocks & lots", href: "/agent/stocks", icon: Package, perm: "stocks" },
    { name: "Rapports", href: "/agent/reports", icon: BarChart2, perm: "rapports" },
  ];

  // ✅ Option "Équipe" : uniquement pour les facility_admin (pas pour facility_staff)
  if (user.role === "agent" && user.agentLevel === "facility_admin") {
    agentMenus.push({
      name: "Équipe",
      href: "/agent/team",
      icon: Users,
    });
  }

  // ✅ Option "Acteurs de santé" : pour les agents sans agentLevel (anciens agents de district)
  if (user.role === "agent" && !user.agentLevel) {
    agentMenus.push({
      name: "Acteurs de santé",
      href: "/agent/actors",
      icon: MapPinned,
    });
  }

  agentMenus.push({ name: "Paramètres", href: "/agent/parametre", icon: Settings });

  // 🏘️ Menus District (supervise les acteurs de santé de sa commune)
  const districtMenus: MenuItem[] = [
    { name: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard, perm: "dashboard" },
    { name: "Enfants", href: "/agent/enfants", icon: Users, perm: "enfants" },
    { name: "Rendez-vous", href: "/agent/rendez-vous", icon: Calendar, perm: "rendezvous" },
    { name: "Agents", href: "/agent/team", icon: UserCog },
    { name: "Acteurs de santé", href: "/agent/actors", icon: MapPinned },
    { name: "Campagnes", href: "/agent/campagnes", icon: Megaphone, perm: "campagnes" },
    { name: "Stocks & lots", href: "/agent/stocks", icon: Package, perm: "stocks" },
    { name: "Rapports", href: "/agent/reports", icon: BarChart2, perm: "rapports" },
    { name: "Paramètres", href: "/agent/parametre", icon: Settings },
  ];

  // 🗺️ Menus dynamiques par rôle
  const menus: Record<string, MenuItem[]> = {
    national: [
      { name: "Dashboard", href: "/dashboard/national", icon: LayoutDashboard, perm: "dashboard" },
      { name: "Enfants", href: "/national/enfants", icon: Users, perm: "enfants" },
      { name: "Régions", href: "/nationalr/regions", icon: MapPinned, perm: "agents" },
      { name: "Régionaux", href: "/nationalre/regionaux", icon: UserCog, perm: "agents" },
      { name: "Campagnes", href: "/nationalc/campaigns", icon: Megaphone, perm: "campagnes" },
      { name: "Rendez-vous", href: "/nationala/rendez-vous", icon: Calendar, perm: "rendezvous" },
      { name: "Stocks & lots", href: "/nationals/stocks", icon: Package, perm: "stocks" },
      { name: "Rapports", href: "/nationalrep/reports", icon: BarChart2, perm: "rapports" },
      {
        name: "Calendrier vaccinal",
        href: "/nationall/calendrier",
        icon: Calendar,
      },
      { name: "Paramètres", href: "/nationalp/parametre", icon: Settings, perm: "parametres" },
    ],
    regional: [
      { name: "Dashboard", href: "/dashboard/regional", icon: LayoutDashboard, perm: "dashboard" },
      { name: "Enfants", href: "/regional/enfants", icon: Users, perm: "enfants" },
      { name: "Agents de District", href: "/regional/agents", icon: UserCog, perm: "agents" },
      {
        name: "Districts",
        href: "/regionalh/healthcenters",
        icon: Package,
      },
      { name: "Stocks & lots", href: "/regionals/stocks", icon: Package, perm: "stocks" },
      { name: "Calendrier vaccinal", href: "/regionalc/calendrier", icon: Calendar },
      { name: "Campagnes", href: "/campaigns", icon: Megaphone, perm: "campagnes" },
      { name: "Rapports", href: "/regional/reports", icon: BarChart2, perm: "rapports" },
      { name: "Paramètres", href: "/regionalp/parametre", icon: Settings, perm: "parametres" },
    ],
    district: districtMenus,
    agent: agentMenus,
  };

  const currentMenusRaw = menus[user.role as keyof typeof menus] || [];
  // Filtrage par permissions
  let currentMenus = currentMenusRaw;
  if (user.role !== "national") {
    if (user.role === "regional") {
      // Toujours afficher Agents, Centres de santé et Paramètres pour les régionaux
      currentMenus = currentMenusRaw.filter((m: any) =>
        !m.perm || (permissions && (permissions as any)[m.perm]) ||
        m.href === "/regional/agents" || m.href === "/regionalh/healthcenters" || m.href === "/regionalp/parametre"
      );
    } else if (user.role === "district") {
      // Toujours afficher Agents, Acteurs de santé et Paramètres pour les districts
      currentMenus = currentMenusRaw.filter((m: any) =>
        !m.perm || (permissions && (permissions as any)[m.perm]) ||
        m.href === "/agent/team" || m.href === "/agent/actors" || m.href === "/agent/parametre"
      );
    } else {
      currentMenus = currentMenusRaw.filter((m: any) => !m.perm || (permissions && (permissions as any)[m.perm]));
    }
  }

  return (
    <aside
      className="fixed left-0 top-0 w-64 h-screen flex flex-col z-50 overflow-y-auto"
      style={{
        backgroundColor: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
      }}
    >
      {/* ✅ Logo et nom dynamiques */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-700 flex-shrink-0">
        <LogoPreview 
          size="sm"
          className="!shadow-md"
        />
        <span className="text-lg font-bold">
          {systemSettings?.appName || settings?.appName || "VacxCare"}
        </span>
      </div>

      {/* Menus */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {currentMenus.map((item: any) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md transition`}
                  style={
                    isActive
                      ? {
                          backgroundColor: "rgba(59,130,246,0.15)",
                          color: "var(--accent-color, #2563eb)",
                        }
                      : {
                          color: "var(--sidebar-text)",
                        }
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
