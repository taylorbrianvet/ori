import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isToday, parseISO, isSameMonth
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ClinicDayDetailModal from "./ClinicDayDetailModal";

function getLastNames(entry) {
  const people = [
    entry.faculty_1, entry.faculty_2,
    entry.house_officer_1, entry.house_officer_2, entry.house_officer_3,
    entry.house_officer_4, entry.house_officer_5, entry.house_officer_6,
  ].filter(Boolean);
  return people.map(p => p.split(" ").pop()).join(", ");
}

export default function ClinicScheduleSection({ clinicSchedules = [], serviceName, allStaff = [], currentUser }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const queryClient = useQueryClient();

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDow = startOfMonth(currentMonth).getDay();

  function normalizeDate(raw) {
    if (!raw) return "";
    if (raw.includes("/")) {
      const parts = raw.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`;
      }
    }
    return raw.slice(0, 10);
  }

  function getEntriesForDay(day) {
    const dayStr = format(day, "yyyy-MM-dd");
    return clinicSchedules.filter(e => normalizeDate(e.date) === dayStr);
  }

  const selectedEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  return (
    <>
      <div className="glass-card p-4">
        {/* Month nav */}
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
          {Array(startDow).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const entries = getEntriesForDay(day);
            const hasEntries = entries.length > 0;
            const today = isToday(day);
            const lastNames = hasEntries ? getLastNames(entries[0]) : "";
            const isSelected = selectedDay && format(selectedDay, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");

            return (
              <button key={day.toISOString()}
                onClick={() => hasEntries ? setSelectedDay(day) : null}
                className={`relative min-h-[52px] rounded-lg p-1 flex flex-col gap-0.5 text-left transition-all w-full
                  ${today ? "ring-1 ring-white/30 bg-white/8" : ""}
                  ${hasEntries ? "cursor-pointer hover:bg-white/8" : "cursor-default"}
                  ${isSelected ? "ring-1 ring-white/40 bg-white/10" : hasEntries ? "bg-white/4" : ""}
                `}>
                <span className={`text-[11px] font-medium leading-none ${today ? "text-white" : "text-white/45"}`}>
                  {format(day, "d")}
                </span>
                {hasEntries && (
                  <p className="text-[8px] text-white/40 leading-tight truncate w-full">{lastNames}</p>
                )}
                {entries.length > 1 && (
                  <span className="text-[8px] text-white/30">+{entries.length - 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {clinicSchedules.length === 0 && (
          <p className="text-center text-xs text-white/25 mt-4 pb-2">No clinic schedule data available.</p>
        )}
      </div>

      {/* Day detail modal */}
      <AnimatePresence>
        {selectedDay && selectedEntries.length > 0 && (
          <ClinicDayDetailModal
            entries={selectedEntries}
            date={selectedDay}
            serviceName={serviceName}
            allStaff={allStaff}
            currentUser={currentUser}
            onClose={() => setSelectedDay(null)}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ["clinic-schedules", serviceName] });
              setSelectedDay(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}