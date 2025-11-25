"use client";

import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface AuthAlertProps {
  type: "error" | "success" | "info";
  message: string;
  className?: string;
}

export default function AuthAlert({ type, message, className = "" }: AuthAlertProps) {
  const config = {
    error: {
      icon: AlertCircle,
      bgColor: "bg-red-50/80",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      iconColor: "text-red-600"
    },
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50/80",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      iconColor: "text-green-600"
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50/80",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      iconColor: "text-blue-600"
    }
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div className={`flex items-center gap-3 p-3 ${bgColor} backdrop-blur-sm border ${borderColor} rounded-xl ${textColor} ${type === 'error' ? 'animate-pulse' : ''} ${className}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
