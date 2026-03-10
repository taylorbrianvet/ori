import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SERVICE_COLOR = {
  "Soft Tissue Surgery": "bg-blue-500/30 text-blue-200 border-blue-400/40",
  "Orthopedic Surgery": "bg-purple-500/30 text-purple-200 border-purple-400/40",
  "Internal Medicine": "bg-green-500/30 text-green-200 border-green-400/40",
  "Anesthesia": "bg-amber-500/30 text-amber-200 border-amber-400/40",
  "Neurology": "bg-rose-500/30 text-rose-200 border-rose-400/40",
  "Emergency": "bg-red-500/30 text-red-200 border-red-400/40",
  "default": "bg-white/10 text-white/60 border-white/20",
};

function getDotColor(service) {
  const map = {
    "Soft Tissue Surgery": "bg-blue-400",
    "Orthopedic Surgery": "bg-purple-400",
    "Internal Medicine": "bg-green-400",
    "Anesthesia": "bg-amber-400",
    "Neurology": "bg-rose-400",
    "Emergency": "bg-red-400",
  };
  return map[service] || "bg-white/50";
}

export default function ClinicScheduleCalendar({ scheduleEntries = [], personName = "" }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Find entries for a given day that match this person
  function getEntriesForDay(day) {
    const dayStr = format(day, "yyyy-MM-dd");
    return scheduleEntries.filter(e => {
      if (e.date !== dayStr) return false;
      if (!personName) return true;
      const name = personName.toLowerCase();
      const fields = [e.faculty_1, e.faculty_2, e.house_officer_1, e.house_officer_2,
        e.house_officer_3, e.house_officer_4, e.house_officer_5, e.house_officer_6];
      return fields.some(f => f && f.toLowerCase().includes(name));
    });
  }

  const startDow = startOfMonth(currentMonth).getDay(); // 0=Sun

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white/80">{format(currentMonth, "MMMM yyyy")}</span>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[10px] text-white/30 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Offset */}
        {Array(startDow).fill(null).map((_, i) => <div key={`empty-${i}`} />)}

        {days.map(day => {
          const entries = getEntriesForDay(day);
          const hasEntries = entries.length > 0;
          const today = isToday(day);

          return (
            <div key={day.toISOString()}
              className={`relative min-h-[52px] rounded-lg p-1 flex flex-col gap-0.5 transition-all
                ${today ? "ring-1 ring-white/30 bg-white/8" : hasEntries ? "bg-white/4" : ""}
              `}>
              <span className={`text-[11px] font-medium leading-none ${today ? "text-white" : "text-white/45"}`}>
                {format(day, "d")}
              </span>
              {entries.map((e, i) => (
                <div key={i} className={`text-[9px] px-1 py-0.5 rounded border leading-tight truncate ${SERVICE_COLOR[e.service] || SERVICE_COLOR.default}`}>
                  {e.team_split ? e.team_split : e.service.split(" ")[0]}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {scheduleEntries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[...new Set(scheduleEntries.map(e => e.service))].slice(0, 6).map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${getDotColor(s)}`} />
              <span className="text-[10px] text-white/40">{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}