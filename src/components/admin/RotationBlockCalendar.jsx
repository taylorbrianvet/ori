import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const SERVICE_COLORS = {
  Anesthesia: "bg-purple-500/80 border-purple-400",
  Surgery: "bg-blue-500/80 border-blue-400",
  Neurosurgery: "bg-emerald-500/80 border-emerald-400",
};

const SERVICE_DEFAULTS = {
  Anesthesia: 3,
  Surgery: 2,
  Neurosurgery: 2,
};

export default function RotationBlockCalendar({ service }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [toggling, setToggling] = useState(null);
  const queryClient = useQueryClient();

  const { data: blocks = [] } = useQuery({
    queryKey: ["rotation-blocks", service],
    queryFn: () => base44.entities.RotationBlock.filter({ service }),
  });

  const blockDateSet = useMemo(() => {
    return new Set(blocks.map((b) => b.start_date));
  }, [blocks]);

  const blockByDate = useMemo(() => {
    return Object.fromEntries(blocks.map((b) => [b.start_date, b]));
  }, [blocks]);

  // Calculate block lengths for display
  const sortedDates = useMemo(() => {
    return [...blocks].map((b) => b.start_date).sort();
  }, [blocks]);

  const getBlockLength = (dateStr) => {
    const idx = sortedDates.indexOf(dateStr);
    if (idx === -1) return null;
    if (idx === sortedDates.length - 1) return SERVICE_DEFAULTS[service];
    const next = new Date(sortedDates[idx + 1] + "T12:00:00");
    const curr = new Date(dateStr + "T12:00:00");
    const diffDays = Math.round((next - curr) / (1000 * 60 * 60 * 24));
    return Math.round(diffDays / 7);
  };

  const handleDayClick = async (dateStr) => {
    if (toggling) return;
    setToggling(dateStr);
    try {
      if (blockDateSet.has(dateStr)) {
        const block = blockByDate[dateStr];
        await base44.entities.RotationBlock.delete(block.id);
        toast.success(`Removed block start: ${dateStr}`);
      } else {
        await base44.entities.RotationBlock.create({ service, start_date: dateStr });
        toast.success(`Added block start: ${dateStr}`);
      }
      queryClient.invalidateQueries({ queryKey: ["rotation-blocks", service] });
      queryClient.invalidateQueries({ queryKey: ["rotation-blocks-all"] });
    } finally {
      setToggling(null);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startPad = getDay(monthStart); // 0=Sun
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const colorClass = SERVICE_COLORS[service] || "bg-primary/80 border-primary";

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">{format(currentMonth, "MMMM yyyy")}</span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs text-white/40 py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {paddedDays.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;
          const dateStr = format(day, "yyyy-MM-dd");
          const isBlock = blockDateSet.has(dateStr);
          const blockLen = isBlock ? getBlockLength(dateStr) : null;
          const isToggling = toggling === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              disabled={!!toggling}
              className={`relative flex flex-col items-center justify-center aspect-square rounded-lg text-xs font-medium transition-all border
                ${isBlock
                  ? `${colorClass} text-white shadow-md`
                  : "border-transparent text-white/60 hover:bg-white/10 hover:text-white"
                }
                ${isToggling ? "opacity-50" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {isBlock && blockLen && (
                <span className="text-[9px] leading-none mt-0.5 opacity-80">{blockLen}w</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 text-xs text-white/50">
        Click a date to add/remove a block start. The number shown is the block length in weeks (based on next start date, or default if last).
        Default: <strong className="text-white/70">{SERVICE_DEFAULTS[service]} weeks</strong>.
      </div>
    </div>
  );
}