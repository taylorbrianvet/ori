import React from "react";
import { cn } from "@/lib/utils";

export default function GlassCard({ children, className, hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card p-5",
        hover && "glass-hover cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}