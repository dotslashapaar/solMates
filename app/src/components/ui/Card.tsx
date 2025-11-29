"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[#1a1a2e] border border-[#2a2a4e] rounded-2xl p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
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
    <h3 className={cn("text-xl font-bold text-white", className)}>{children}</h3>
  );
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("", className)}>{children}</div>;
}
