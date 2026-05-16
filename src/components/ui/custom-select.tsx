"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  required?: boolean;
}

export const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  triggerClassName,
  dropdownClassName,
  required,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("relative flex-1", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-slate-400",
          isOpen && "border-black ring-2 ring-black/5",
          triggerClassName
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180 text-black"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] min-w-[160px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50",
              dropdownClassName
            )}
          >
            <div className="max-h-[220px] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-50 mb-1">
                Select {placeholder}
              </div>
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-4 py-2.5 text-sm transition-all hover:bg-slate-50 active:bg-slate-100",
                    value === option.value ? "bg-slate-50 text-black font-bold" : "text-slate-600"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="absolute inset-0 h-0 w-0 opacity-0 pointer-events-none"
        />
      )}
    </div>
  );
};
