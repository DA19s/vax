"use client";

import { useState, useEffect } from "react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

interface LogoPreviewProps {
  logoUrl?: string;
  appName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  forceUrl?: boolean; // Pour forcer l'utilisation du logoUrl passé en prop
}

export default function LogoPreview({ 
  logoUrl, 
  appName, 
  className = "",
  size = "md",
  forceUrl = false
}: LogoPreviewProps) {
  const { settings } = useSystemSettings();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Utiliser le logo du contexte global sauf si forceUrl est true
  const effectiveLogoUrl = forceUrl ? logoUrl : (logoUrl || settings.logoUrl);
  const effectiveAppName = appName || settings.appName;

  const containerSizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16", 
    lg: "h-24 w-24"
  };

  const imageSizeClasses = {
    sm: "h-8 w-8",   // Plus petit que le conteneur (12 -> 8)
    md: "h-10 w-10", // Plus petit que le conteneur (16 -> 10)
    lg: "h-16 w-16"  // Plus petit que le conteneur (24 -> 16)
  };

  useEffect(() => {
    if (effectiveLogoUrl) {
      // Tester si l'image est accessible
      const img = new Image();
      img.onload = () => {
        setImageSrc(effectiveLogoUrl);
        setImageError(false);
      };
      img.onerror = () => {
        setImageSrc("/logo.png");
        setImageError(true);
      };
      img.src = effectiveLogoUrl;
    } else {
      setImageSrc("/logo.png");
    }
  }, [effectiveLogoUrl]);

  return (
    <div className={`inline-flex items-center justify-center bg-white rounded-full shadow-xl transform transition-transform duration-2000 hover:scale-105 ${containerSizeClasses[size]} ${className}`}>
      {imageSrc ? (
        <img 
          src={imageSrc}
          alt={effectiveAppName} 
          className={`object-contain ${imageSizeClasses[size]} rounded`}
          onError={() => {
            if (!imageError) {
              setImageSrc("/logo.png");
              setImageError(true);
            }
          }}
        />
      ) : (
        <div className={`${containerSizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center`}>
          <div className="animate-pulse bg-gray-300 rounded-full w-6 h-6"></div>
        </div>
      )}
    </div>
  );
}
