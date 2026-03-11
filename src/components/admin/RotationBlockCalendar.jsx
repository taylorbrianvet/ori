import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Split } from "lucide-react";
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
  const [mode, setMode] = useState("block"); // "block" | "split"
  const [labelInput, setLabelInput] = useState("");
  const queryClient = useQueryClient();

  const { data: blocks = [] } = useQuery({
    queryKey: ["rotation-blocks", service],
    queryFn: () => base44.entities.RotationBlock.filter({ service }),
  });

  const { data: splitDays = [] } = useQuery({
    queryKey: ["split-shift-days", service],
    queryFn: () => base44.entities.SplitShiftDay.filter({ service }),
  });

  const blockDateSet = useMemo(() => new Set(blocks.map((b) => b.start_date)), [blocks]);
  const blockByDate = useMemo(() => Object.fromEntries(blocks.map((b) => [b.start_date, b])), [blocks]);
  const splitDateSet = useMemo(() => new Set(splitDays.map((s) => s.date)), [splitDays]);
  const splitByDate = useMemo(() => Object.fromEntries(splitDays.map((s) => [s.date, s])), [splitDays]);

  const sortedDates = useMemo(() => [...blocks].map((b) => b.start_date).sort(), [blocks]);

  const getBlockLength = (dateStr) => {
    const idx = sortedDates.indexOf(dateStr);
    if (idx === -1) return null;
    if (idx === sortedDates.length - 1) return SERVICE_DEFAULTS[service];
    const next = new Date(sortedDates[idx + 1] + "T12:00:00");
    const curr = new Date(dateStr + "T12:00:00");
    return Math.round(Math.round((next - curr) / (1000 * 60 * 60 * 24)) / 7);
  };

  const handleDayClick = async (dateStr) => {
    if (toggling) return;
    setToggling(dateStr);
    try {
      if (mode === "block") {
        if (blockDateSet.has(dateStr)) {
          await base44.entities.RotationBlock.delete(blockByDate[dateStr].id);
          toast.success(`Removed block start: ${dateStr}`);
        } else {
          await base44.entities.RotationBlock.create({ service, start_date: dateStr });
          toast.success(`Added block start: ${dateStr}`);
        }
        queryClient.invalidateQueries({ queryKey: ["rotation-blocks", service] });
        queryClient.invalidateQueries({ queryKey: ["rotation-blocks-all"] });
      } else {
        // split shift mode
        if (splitDateSet.has(dateStr)) {
          await base44.entities.SplitShiftDay.delete(splitByDate[dateStr].id);
          toast.success(`Removed split shift: ${dateStr}`);
        } else {
          await base44.entities.SplitShiftDay.create({ service, date: dateStr, label: labelInput.trim() || undefined });
          toast.success(`Added split shift: ${dateStr}`);
        }
        queryClient.invalidateQueries({ queryKey: ["split-shift-days", service] });
        queryClient.invalidateQueries({ queryKey: ["split-shift-days-all"] });
      }
    } finally {
      setToggling(null);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const colorClass = SERVICE_COLORS[service] || "bg-primary/80 border-primary";

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("block")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            mode === "block"
              ? "bg-white/20 text-white border-white/30"
              : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Block Start
        </button>
        <button
          onClick={() => setMode("split")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            mode === "split"
              ? "bg-amber-500/30 text-amber-200 border-amber-400/40"
              : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70"
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          Split Shift Day
        </button>
      </div>

      {/* Label input for split shift mode */}
      {mode === "split" && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Optional label (e.g. Spring Break, Holiday)…"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            className="w-full bg-gray-900 text-white text-xs px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:border-amber-400/50 placeholder:text-white/30"
          />
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">{format(currentMonth, "MMMM yyyy")}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
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
          const isSplit = splitDateSet.has(dateStr);
          const blockLen = isBlock ? getBlockLength(dateStr) : null;
          const splitLabel = isSplit ? splitByDate[dateStr]?.label : null;
          const isToggling = toggling === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              disabled={!!toggling}
              title={isSplit ? (splitLabel || "Split shift day") : undefined}
              className={`relative flex flex-col items-center justify-center aspect-square rounded-lg text-xs font-medium transition-all border
                ${isBlock ? `${colorClass} text-white shadow-md` : ""}
                ${isSplit && !isBlock ? "bg-amber-500/25 border-amber-400/50 text-amber-200" : ""}
                ${isSplit && isBlock ? "ring-2 ring-amber-400/60" : ""}
                ${!isBlock && !isSplit ? "border-transparent text-white/60 hover:bg-white/10 hover:text-white" : ""}
                ${isToggling ? "opacity-50" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {isBlock && blockLen && (
                <span className="text-[9px] leading-none mt-0.5 opacity-80">{blockLen}w</span>
              )}
              {isSplit && !isBlock && (
                <span className="text-[8px] leading-none mt-0.5 opacity-80">split</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-1 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded ${colorClass} border flex-shrink-0`} />
          <span>Block start — number = block length in weeks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500/25 border border-amber-400/50 flex-shrink-0" />
          <span>Split shift day — appears as day+night slots for students</span>
        </div>
      </div>
    </div>
  );
}