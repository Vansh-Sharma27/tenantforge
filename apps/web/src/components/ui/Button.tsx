"use client";

import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-emerald-700 active:scale-[0.98] focus-visible:ring-accent",
  secondary:
    "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 active:scale-[0.98]",
  ghost:
    "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 active:scale-[0.98]",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 active:scale-[0.98] focus-visible:ring-red-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-small",
  md: "px-4 py-2 text-small",
  lg: "px-6 py-2.5 text-body",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      icon,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-[color,background-color,border-color,transform,box-shadow] duration-150 cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="h-4 w-4 flex items-center justify-center">{icon}</span>
        ) : null}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";
