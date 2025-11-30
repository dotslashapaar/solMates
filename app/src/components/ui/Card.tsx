"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  variant?: "glass" | "gradient-border" | "solid";
}

export function Card({ className, children, variant = "glass" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6",
        {
          // Dark solid card (glass and solid have same styles)
          "bg-zinc-900 border border-white/[0.06]": variant === "glass" || variant === "solid",
          // Gradient Border
          "gradient-border": variant === "gradient-border",
        },
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-white", className)}>{children}</h3>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("", className)}>{children}</div>;
}
