"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-small font-medium text-gray-900 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "block w-full appearance-none rounded-md border px-3 py-2 pr-8 text-body text-gray-900",
              "transition-default cursor-pointer",
              "focus:border-accent focus:ring-1 focus:ring-accent",
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200",
              className
            )}
            aria-invalid={error ? "true" : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        {error && <p className="mt-1 text-small text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
