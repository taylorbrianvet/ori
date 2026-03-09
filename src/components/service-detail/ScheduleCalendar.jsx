import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import GlassCard from "../shared/GlassCard";
import { Badge } from "@/components/ui/badge";

export default function ScheduleCalendar({ schedules }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const getScheduleForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return (schedules || []).filter((s) => s.date === dateStr);
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">

          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">

          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) =>
        <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2">
            {d}
          </div>
        )}
        {days.map((d, i) => {
          const daySchedules = getScheduleForDay(d);
          const inMonth = isSameMonth(d, currentMonth);
          const today = isToday(d);
          return (
            <div
              key={i}
              className={`relative min-h-[56px] sm:min-h-[72px] p-1 border border-border/30 rounded-lg transition-colors ${
              !inMonth ? "opacity-30" : ""} ${
              today ? "bg-primary/5 border-primary/30" : "hover:bg-secondary/50"}`}>

              <span className={`text-[11px] font-medium ${today ? "text-primary font-bold" : "text-foreground"}`}>
                {format(d, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {daySchedules.slice(0, 2).map((s, j) =>
                <div key={j} className="bg-primary/10 text-slate-300 px-1 py-0.5 font-medium opacity-90 rounded truncate">
                    {s.user_name || "Staff"}
                  </div>
                )}
                {daySchedules.length > 2 &&
                <span className="text-[9px] text-muted-foreground">+{daySchedules.length - 2}</span>
                }
              </div>
            </div>);

        })}
      </div>
    </GlassCard>);

}