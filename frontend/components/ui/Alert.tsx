import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "error" | "warning";
}

export function Alert({ className, variant = "info", children, ...props }: AlertProps) {
  const variants = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  return (
    <div
      className={cn("p-4 rounded-lg border text-sm", variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
