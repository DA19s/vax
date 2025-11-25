"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 🍞 Types de toast                                                         */
/* -------------------------------------------------------------------------- */
export type ToastType = "success" | "error" | "warning" | "info";
export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/* -------------------------------------------------------------------------- */
/* 🎨 Styles des toasts                                                      */
/* -------------------------------------------------------------------------- */
const toastStyles = {
  success: {
    bg: "bg-green-50 border-green-200",
    text: "text-green-800",
    icon: CheckCircle,
    iconColor: "text-green-500"
  },
  error: {
    bg: "bg-red-50 border-red-200", 
    text: "text-red-800",
    icon: AlertCircle,
    iconColor: "text-red-500"
  },
  warning: {
    bg: "bg-orange-50 border-orange-200",
    text: "text-orange-800", 
    icon: AlertTriangle,
    iconColor: "text-orange-500"
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: Info,
    iconColor: "text-blue-500"
  }
};

const positionStyles = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4", 
  "bottom-left": "bottom-4 left-4",
  "top-center": "top-4 left-1/2 transform -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2"
};

/* -------------------------------------------------------------------------- */
/* 🍞 Context du Toast                                                       */
/* -------------------------------------------------------------------------- */
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* 🍞 Hook useToast                                                          */
/* -------------------------------------------------------------------------- */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé dans un ToastProvider");
  }
  return context;
};

/* -------------------------------------------------------------------------- */
/* 🍞 Composant ToastItem                                                    */
/* -------------------------------------------------------------------------- */
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const style = toastStyles[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-suppression
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Durée de l'animation de sortie
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-2
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isRemoving ? 'scale-95' : 'scale-100'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={`
        max-w-sm w-full shadow-lg rounded-lg border p-4
        ${style.bg} ${style.text}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${style.iconColor}`} aria-hidden="true" />
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              {toast.title}
            </h3>
            {toast.message && (
              <p className="mt-1 text-sm opacity-90">
                {toast.message}
              </p>
            )}
            {toast.action && (
              <div className="mt-2">
                <button
                  onClick={toast.action.onClick}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleRemove}
              className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
              aria-label="Fermer la notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🍞 Composant ToastContainer                                               */
/* -------------------------------------------------------------------------- */
interface ToastContainerProps {
  position?: ToastPosition;
  maxToasts?: number;
}

function ToastContainer({ 
  position = "top-right", 
  maxToasts = 5 
}: ToastContainerProps) {
  const { toasts, removeToast } = useToast();
  
  // Limiter le nombre de toasts affichés
  const visibleToasts = toasts.slice(0, maxToasts);

  return (
    <div
      className={`fixed z-50 ${positionStyles[position]}`}
      aria-live="polite"
      aria-label="Notifications"
    >
      {visibleToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🍞 Provider ToastProvider                                                 */
/* -------------------------------------------------------------------------- */
interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({ 
  children, 
  position = "top-right",
  maxToasts = 5 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000 // 5 secondes par défaut
    };
    
    setToasts(prev => [newToast, ...prev]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer position={position} maxToasts={maxToasts} />
    </ToastContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* 🍞 Utilitaires de toast                                                   */
/* -------------------------------------------------------------------------- */
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: "success" as const,
    title,
    message,
    ...options
  }),
  
  error: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: "error" as const,
    title,
    message,
    duration: 7000, // Plus long pour les erreurs
    ...options
  }),
  
  warning: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: "warning" as const,
    title,
    message,
    ...options
  }),
  
  info: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: "info" as const,
    title,
    message,
    ...options
  }),
  
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    const loadingToast = {
      type: "info" as const,
      title: loading,
      duration: 0 // Pas de suppression automatique
    };
    
    return promise
      .then((data) => ({
        type: "success" as const,
        title: typeof success === "function" ? success(data) : success
      }))
      .catch((err) => ({
        type: "error" as const,
        title: typeof error === "function" ? error(err) : error
      }));
  }
};
