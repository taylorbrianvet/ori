import React from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isThisWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function WeekNav({ weekStart, onPrev, onNext }) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const isCurrentWeek = isThisWeek(weekStart, { weekStartsOn: 1 });

  return (
    <div className="flex items-center justify-between mb-5">
      <button onClick={onPrev}
        className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </p>
        {isCurrentWeek && (
          <p className="text-[10px] text-white/40 mt-0.5">Current week</p>
        )}
      </div>
      <button onClick={onNext}
        className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}