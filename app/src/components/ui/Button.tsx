"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "hot" | "electric" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "hot",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
        {
          // Hot Rose - Primary CTA
          "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5":
            variant === "hot",
          // Electric Rose Outline
          "border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500":
            variant === "electric",
          // Ghost
          "text-zinc-400 hover:text-white hover:bg-white/[0.04]":
            variant === "ghost",
          // Glass
          "bg-white/[0.04] border border-white/[0.06] text-white hover:bg-white/[0.08]":
            variant === "glass",
        },
        {
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
