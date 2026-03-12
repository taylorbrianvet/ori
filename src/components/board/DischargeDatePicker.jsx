import React from "react";
import { ChevronLeft, ChevronRight, Loader2, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

const QUICK_TIMES = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function DischargeDatePicker({
  calendarViewMonth,
  setCalendarViewMonth,
  calendarDate,
  setCalendarDate,
  scheduleTime,
  setScheduleTime,
  onConfirm,
  onCancel,
  actionLoading,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = startOfMonth(calendarViewMonth);
  const monthEnd = endOfMonth(calendarViewMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  // Build calendar grid
  const days = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }

  const formatTime = (t) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const selectedLabel = calendarDate
    ? `${format(calendarDate, "EEE, MMM d")} at ${formatTime(scheduleTime)}`
    : "Pick a date";

  return (
    <div className="rounded-xl border border-green-400/25 bg-green-500/8 p-3 space-y-3">
      <p className="text-xs font-semibold text-green-200">Schedule Discharge Time</p>

      {/* Selected summary */}
      <div className="text-sm text-white font-medium px-2 py-1.5 rounded-lg bg-green-500/15 border border-green-400/20 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-green-300" />
        {selectedLabel}
      </div>

      {/* Calendar */}
      <div className="bg-black/25 rounded-xl p-3 border border-white/10">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCalendarViewMonth(subMonths(calendarViewMonth, 1))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-white/80">{format(calendarViewMonth, "MMMM yyyy")}</span>
          <button
            onClick={() => setCalendarViewMonth(addMonths(calendarViewMonth, 1))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
            <div key={day} className="text-center text-[9px] font-semibold text-white/30 py-1">{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, calendarViewMonth);
            const isSelected = calendarDate && isSameDay(day, calendarDate);
            const isToday = isSameDay(day, today);
            const isPast = day < today;

            return (
              <button
                key={i}
                onClick={() => !isPast && setCalendarDate(day)}
                disabled={isPast}
                className={`
                  text-center text-[11px] py-1.5 rounded-md transition-colors font-medium
                  ${!isCurrentMonth ? "text-white/15" : ""}
                  ${isPast ? "text-white/15 cursor-not-allowed" : "cursor-pointer"}
                  ${isSelected ? "bg-green-500 text-white shadow-sm" : ""}
                  ${isToday && !isSelected ? "bg-white/15 text-white ring-1 ring-green-400/50" : ""}
                  ${!isSelected && !isToday && !isPast && isCurrentMonth ? "hover:bg-white/10 text-white/70" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick time selector */}
      <div>
        <p className="text-[10px] text-white/40 uppercase font-semibold mb-1.5">Time</p>
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_TIMES.map(t => (
            <button
              key={t}
              onClick={() => setScheduleTime(t)}
              className={`py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                scheduleTime === t
                  ? "bg-green-500/40 border-green-400/50 text-green-200"
                  : "bg-black/20 border-white/10 text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              {formatTime(t)}
            </button>
          ))}
        </div>
        {/* Custom time */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-white/35">Custom:</span>
          <input
            type="time"
            value={scheduleTime}
            onChange={e => setScheduleTime(e.target.value)}
            className="px-2 py-1 rounded-lg bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Confirm / Cancel */}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={!calendarDate || actionLoading === "schedule"}
          className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {actionLoading === "schedule" ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : "Confirm Schedule"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/8 text-white/50 text-xs hover:bg-white/12">
          Cancel
        </button>
      </div>
    </div>
  );
}