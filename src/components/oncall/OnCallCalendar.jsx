import React, { useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isToday
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function OnCallCalendar({ schedules, services }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const serviceMap = Object.fromEntries((services || []).map((s) => [s.id, s]));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return (schedules || []).filter((s) => s.date === dateStr && s.on_call);
  };

  const selectedEntries = selected ? getForDay(selected) : [];

  return (
    <div className="glass-card p-4 lg:p-5">
      {/* Month Nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors text-white/60"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white/90">{format(currentMonth, "MMMM yyyy")}</span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors text-white/60"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-white/40 py-1.5">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, i) => {
          const entries = getForDay(d);
          const inMonth = isSameMonth(d, currentMonth);
          const today = isToday(d);
          const isSelected = selected && format(d, "yyyy-MM-dd") === format(selected, "yyyy-MM-dd");

          return (
            <div
              key={i}
              onClick={() => setSelected(isSelected ? null : d)}
              className={`relative rounded-xl p-1 min-h-[52px] cursor-pointer transition-all duration-150 ${
                !inMonth ? "opacity-25 pointer-events-none" : ""
              } ${today ? "bg-white/20 ring-1 ring-white/40" : "hover:bg-white/8"} ${
                isSelected ? "bg-white/15 ring-2 ring-white/30" : ""
              }`}
            >
              <span className={`text-[11px] font-medium block text-center ${today ? "text-white font-bold" : "text-white/70"}`}>
                {format(d, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {entries.slice(0, 2).map((e, j) => {
                  const svc = serviceMap[e.service_id];
                  return (
                    <div key={j} className="text-[8px] px-1 py-0.5 rounded-md bg-white/20 text-white/90 truncate font-medium leading-tight">
                      {svc?.service_name?.split(" ")[0] || e.user_name?.split(" ")[0] || "•"}
                    </div>
                  );
                })}
                {entries.length > 2 && (
                  <span className="text-[8px] text-white/40 pl-1">+{entries.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs font-semibold text-white/90 mb-2">{format(selected, "EEEE, MMMM d")}</p>
          {selectedEntries.length === 0 ? (
            <p className="text-xs text-white/40">No on-call assignments.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedEntries.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  <span className="text-white/90 font-medium">{e.user_name || "Staff"}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/50">{serviceMap[e.service_id]?.service_name || "Service"}</span>
                  {e.team_name && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/55">{e.team_name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}