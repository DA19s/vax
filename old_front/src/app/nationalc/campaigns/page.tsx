"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useState } from "react";
import { Megaphone, Lightbulb } from "lucide-react";
import CampaignsTab from "./components/CampaignsTab";
import HealthTipsTab from "./components/HealthTipsTab";

export default function CampaignsWithHealthTipsPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "health-tips">("campaigns");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Campagnes & Conseils de Santé</h1>
          <p className="text-blue-100">
            Gérez vos campagnes de vaccination et partagez des conseils de santé avec les parents
          </p>
        </div>

        {/* Tabs personnalisés (sans shadcn) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "campaigns"
                  ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Megaphone className="h-5 w-5" />
              Campagnes
            </button>
            <button
              onClick={() => setActiveTab("health-tips")}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "health-tips"
                  ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Lightbulb className="h-5 w-5" />
              Conseils de Santé
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "campaigns" && <CampaignsTab />}
            {activeTab === "health-tips" && <HealthTipsTab />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
