import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-12 w-full rounded-lg border border-border bg-card px-3 text-fg placeholder:text-muted-fg outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      {...props}
    />
  );
}
