"use client";

import { useState } from "react";
import { LucideIcon } from "lucide-react";

interface AuthInputProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  icon: LucideIcon;
  required?: boolean;
  maxLength?: number;
  className?: string;
}

export default function AuthInput({
  type,
  placeholder,
  value,
  onChange,
  label,
  icon: Icon,
  required = false,
  maxLength,
  className = ""
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`space-y-2 transition-all duration-300 ${
      focused ? 'transform scale-105' : ''
    } ${className}`}>
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          maxLength={maxLength}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 bg-white/50 backdrop-blur-sm ${
            focused 
              ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 bg-white' 
              : 'border-slate-200 hover:border-slate-300'
          } outline-none text-slate-900 placeholder-slate-400 ${
            type === 'password' && maxLength === 6 ? 'text-center text-2xl font-mono tracking-widest' : ''
          }`}
        />
      </div>
    </div>
  );
}
