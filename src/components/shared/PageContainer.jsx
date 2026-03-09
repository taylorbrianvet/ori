import React from "react";
import { cn } from "@/lib/utils";

export default function PageContainer({ children, className }) {
  return (
    <div className={cn("px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto", className)}>
      {children}
    </div>
  );
}