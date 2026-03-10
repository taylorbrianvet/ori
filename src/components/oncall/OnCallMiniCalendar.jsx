import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import OnCallPersonRow from "./OnCallPersonRow";

function buildSlots(record) {
  if (!record) return [];
  const slots = [];
  if (record.primary_name) slots.push({ slot: "primary", name: record.primary_name, role: record.primary_role, phone: record.primary_phone, email: record.primary_email });
  if (record.secondary_name) slots.push({ slot: "secondary", name: record.secondary_name, role: record.secondary_role, phone: record.secondary_phone, email: record.secondary_email });
  if (record.tertiary_name) slots.push({ slot: "tertiary", name: record.tertiary_name, role: record.tertiary_role, phone: record.tertiary_phone, email: record.tertiary_email });
  return slots;
}

export default function OnCallMiniCalendar({ service, records }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: studentSchedules = [] } = useQuery({
    queryKey: ["student-on-call-schedules"],
    queryFn: () => base44.entities.StudentOnCallSchedule.list(),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const recordMap = {};
  records.forEach((r) => {
    if (r.service === service) recordMap[r.date] = r;
  });

  const selectedRecord = selectedDay ? recordMap[format(selectedDay, "yyyy-MM-dd")] : null;
  const selectedSlots = buildSlots(selectedRecord);
  
  const selectedStudents = selectedDay 
    ? studentSchedules.filter((s) => s.date === format(selectedDay, "yyyy-MM-dd") && s.service === service)
      .sort((a, b) => a.position === "primary" ? -1 : 1)
      .map(s => {
        const studentInfo = staff.find(st => st.email === s.student_email);
        return { ...s, phone: studentInfo?.phone };
      })
    : [];

  return (
    <div className="rounded-xl bg-white/5 border border-white/8 p-3">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-white/80">{format(currentMonth, "MMMM yyyy")}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-white/30 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const hasRecord = !!recordMap[key];
          const isSelected = selectedDay && format(selectedDay, "yyyy-MM-dd") === key;
          const today = isToday(day);
          return (
            <button
              key={key}
              onClick={() => inMonth && setSelectedDay(isSelected ? null : day)}
              className={`rounded-lg py-1.5 text-center transition-all duration-150 ${!inMonth ? "opacity-20 pointer-events-none" : ""} ${isSelected ? "bg-white/20 ring-1 ring-white/30" : today ? "bg-white/12 ring-1 ring-white/25" : "hover:bg-white/8"}`}
            >
              <span className={`text-[10px] font-medium ${today ? "text-white" : "text-white/65"}`}>{format(day, "d")}</span>
              {hasRecord && inMonth && (
                <div className="w-1 h-1 rounded-full bg-green-400 mx-auto mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-3 pt-3 border-t border-white/8">
          <p className="text-[11px] font-semibold text-white/60 mb-2">{format(selectedDay, "EEEE, MMMM d")}</p>
          {selectedSlots.length === 0 ? (
            <p className="text-xs text-white/30 italic">No on-call data.</p>
          ) : selectedSlots.map((s, i) => (
            <OnCallPersonRow key={i} {...s} />
          ))}
          {selectedStudents.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/8">
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1">Students On Call</p>
              {selectedStudents.map((s, i) => (
                <OnCallPersonRow
                  key={i}
                  slot={s.position}
                  name={s.student_name}
                  phone={s.phone}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}