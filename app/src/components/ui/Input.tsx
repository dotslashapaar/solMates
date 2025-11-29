"use client";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a4e] rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366] transition-colors",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a4e] rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366] transition-colors resize-none",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
