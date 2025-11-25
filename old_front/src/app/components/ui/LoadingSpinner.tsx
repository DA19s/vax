"use client";

// Fonction utilitaire pour combiner les classes CSS
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/* -------------------------------------------------------------------------- */
/* 🔄 Types de spinners                                                      */
/* -------------------------------------------------------------------------- */
export type SpinnerSize = "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "primary" | "secondary" | "success" | "warning" | "error";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

/* -------------------------------------------------------------------------- */
/* 🎨 Styles des spinners                                                    */
/* -------------------------------------------------------------------------- */
const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
};

const variantClasses = {
  primary: "text-blue-600",
  secondary: "text-gray-600",
  success: "text-green-600",
  warning: "text-orange-600",
  error: "text-red-600"
};

const labelSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg"
};

/* -------------------------------------------------------------------------- */
/* 🔄 Composant LoadingSpinner                                               */
/* -------------------------------------------------------------------------- */
export default function LoadingSpinner({
  size = "md",
  variant = "primary",
  className,
  label = "Chargement...",
  showLabel = true
}: LoadingSpinnerProps) {
  return (
    <div 
      className={cn("flex flex-col items-center justify-center gap-2", className)}
      role="status"
      aria-label={label}
    >
      {/* Spinner SVG */}
      <svg
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      
      {/* Label */}
      {showLabel && (
        <span 
          className={cn(
            "font-medium text-gray-600",
            labelSizeClasses[size]
          )}
          aria-live="polite"
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🔄 Composant LoadingOverlay                                               */
/* -------------------------------------------------------------------------- */
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  spinnerProps?: Partial<LoadingSpinnerProps>;
  overlay?: boolean;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  spinnerProps = {},
  overlay = true,
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center z-50",
            overlay && "bg-white/80 backdrop-blur-sm"
          )}
          aria-hidden={!isLoading}
        >
          <LoadingSpinner {...spinnerProps} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🔄 Composant SkeletonLoader                                               */
/* -------------------------------------------------------------------------- */
interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  lines = 1
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  const variantClasses = {
    text: "h-4",
    rectangular: "h-20",
    circular: "rounded-full"
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              index === lines - 1 && "w-3/4", // Dernière ligne plus courte
              className
            )}
            style={style}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 🔄 Composant CardSkeleton                                                 */
/* -------------------------------------------------------------------------- */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 bg-white rounded-xl shadow-sm border", className)}>
      <div className="flex items-start space-x-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" lines={2} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton variant="rectangular" height={60} />
        <div className="flex justify-between">
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="20%" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🔄 Composant TableSkeleton                                                */
/* -------------------------------------------------------------------------- */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" width="20%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              variant="text" 
              width="20%" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}
