"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "gradient-primary hover:opacity-90 text-white glow-primary":
            variant === "primary",
          "gradient-secondary hover:opacity-90 text-white glow-secondary":
            variant === "secondary",
          "border-2 border-[#ff3366] text-[#ff3366] hover:bg-[#ff3366] hover:text-white":
            variant === "outline",
          "text-[#a1a1aa] hover:text-white hover:bg-white/10":
            variant === "ghost",
        },
        {
          "px-4 py-2 text-sm": size === "sm",
          "px-6 py-3 text-base": size === "md",
          "px-8 py-4 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
