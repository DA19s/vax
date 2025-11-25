"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import LogoPreview from "@/app/components/LogoPreview";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showHelpSection?: boolean;
}

export default function AuthLayout({ 
  children, 
  title, 
  subtitle = "Plateforme de gestion de vaccination",
  showHelpSection = true 
}: AuthLayoutProps) {
  const { settings, loading } = useSystemSettings();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Animation d'apparition après un court délai
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="w-full max-w-md px-4">
        {/* Animated container */}
        <div 
          className={`transform transition-all duration-1000 ease-out ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          {/* Logo and branding */}
          <div className="text-center mb-8">
            {/* Logo with animation */}
            <div className="mb-6">
              <LogoPreview 
                size="lg"
              />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              {settings.appName}
            </h1>
            
            {/* Subtitle */}
            <p className="text-slate-600 text-sm font-medium">
              {subtitle}
            </p>
          </div>

          {/* Main content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {title}
              </h2>
            </div>
            
            {children}
          </div>

          {/* Help section */}
          {showHelpSection && (
            <div className="mt-8 flex items-center justify-center gap-2 p-4 bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-200">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-700 font-medium">
                Besoin d'aide ? Contactez votre administrateur système
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
