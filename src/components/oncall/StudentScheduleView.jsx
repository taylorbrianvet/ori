import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StudentShiftSlot from "./StudentShiftSlot";
import { format, addDays, isToday } from "date-fns";

const SERVICE_DEFAULTS = { Anesthesia: 3, Surgery: 2, Neurosurgery: 2 };

export default function StudentScheduleView({ service, blockStartDate, numWeeks, currentUser, canEdit = false }) {
  const effectiveNumWeeks = numWeeks ?? SERVICE_DEFAULTS[service] ?? 2;
  const positions = service === "Anesthesia" ? ["primary", "secondary", "tertiary"] : ["primary", "secondary"];

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Staff.filter({ role: "Student" }),
  });

  const { data: schedules = [], refetch } = useQuery({
    queryKey: ["student-on-call-schedules"],
    queryFn: () => base44.entities.StudentOnCallSchedule.list(),
  });

  const { data: splitDays = [] } = useQuery({
    queryKey: ["split-shift-days", service],
    queryFn: () => base44.entities.SplitShiftDay.filter({ service }),
  });

  const splitDateSet = useMemo(() => new Set(splitDays.map((s) => s.date)), [splitDays]);
  const splitByDate = useMemo(() => Object.fromEntries(splitDays.map((s) => [s.date, s])), [splitDays]);

  const getCurrentShift = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = format(now, "yyyy-MM-dd");
    const dayOfWeek = now.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    if (isWeekday) {
      if (currentHour >= 17 || currentHour < 8) return { dateStr: currentDate, shiftPeriod: "main" };
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { dateStr: format(yesterday, "yyyy-MM-dd"), shiftPeriod: "main" };
    } else {
      if (currentHour >= 8 && currentHour < 20) return { dateStr: currentDate, shiftPeriod: "day" };
      return { dateStr: currentDate, shiftPeriod: "night" };
    }
  };

  const currentShift = getCurrentShift();

  const weekData = useMemo(() => {
    if (!blockStartDate) return [];
    const weeks = [];
    for (let weekNum = 0; weekNum < effectiveNumWeeks; weekNum++) {
      const week = [];
      const weekStart = addDays(blockStartDate, weekNum * 7);
      for (let dayNum = 0; dayNum < 7; dayNum++) {
        const date = addDays(weekStart, dayNum);
        week.push({ dateStr: format(date, "yyyy-MM-dd"), date, dayName: format(date, "EEE") });
      }
      weeks.push(week);
    }
    return weeks;
  }, [blockStartDate, effectiveNumWeeks]);

  if (!blockStartDate) {
    return <p className="text-white/50 text-sm py-8 text-center">No active rotation block configured for {service}.</p>;
  }

  const renderDay = (day, isSplitDay) => {
    const splitInfo = splitByDate[day.dateStr];
    const dayIsToday = isToday(day.date);

    if (isSplitDay) {
      // Render like a weekend: day + night slots
      return (
        <div key={day.dateStr} className={`space-y-3 p-3 rounded-lg transition-colors border border-amber-400/30 bg-amber-500/8 ${dayIsToday ? "ring-1 ring-white/30" : ""}`}>
          <div className="text-sm font-medium text-white">
            <div>{day.dayName}</div>
            <div className={`text-xs ${dayIsToday ? "text-white/80 font-semibold" : "text-white/60"}`}>
              {format(new Date(day.dateStr + "T00:00:00"), "MMM d")}
            </div>
            {splitInfo?.label && (
              <div className="text-[10px] text-amber-300/80 font-medium mt-0.5 truncate">{splitInfo.label}</div>
            )}
          </div>
          <div className="space-y-3">
            {[
              { period: "day", label: "Day", time: "(8am – 8pm)" },
              { period: "night", label: "Night", time: "(8pm – 8am)" },
            ].map(({ period, label, time }) => (
              <div key={period} className="space-y-1">
                <div className="text-xs text-white/50 font-medium">{label} <span className="text-white/30">{time}</span></div>
                <div className="space-y-1">
                  {positions.map((position) => (
                    <StudentShiftSlot
                      key={`${day.dateStr}-${period}-${position}`}
                      date={day.dateStr}
                      service={service}
                      shiftPeriod={period}
                      position={position}
                      students={students}
                      schedules={schedules}
                      blockStartDate={blockStartDate}
                      onUpdate={() => refetch()}
                      canEdit={canEdit || currentUser?.role === "Student"}
                      isCurrentShift={currentShift?.dateStr === day.dateStr && currentShift?.shiftPeriod === period}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Normal weekday
    return (
      <div key={day.dateStr} className={`space-y-3 p-3 rounded-lg transition-colors ${dayIsToday ? "bg-white/10 border border-white/20" : ""}`}>
        <div className="text-sm font-medium text-white">
          <div>{day.dayName}</div>
          <div className={`text-xs ${dayIsToday ? "text-white/80 font-semibold" : "text-white/60"}`}>
            {format(new Date(day.dateStr + "T00:00:00"), "MMM d")}
          </div>
        </div>
        <div className="space-y-1">
          {positions.map((position) => (
            <StudentShiftSlot
              key={`${day.dateStr}-main-${position}`}
              date={day.dateStr}
              service={service}
              shiftPeriod="main"
              position={position}
              students={students}
              schedules={schedules}
              blockStartDate={blockStartDate}
              onUpdate={() => refetch()}
              canEdit={canEdit || currentUser?.role === "Student"}
              isCurrentShift={currentShift?.dateStr === day.dateStr && currentShift?.shiftPeriod === "main"}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{service}</h2>

      {weekData.map((week, weekIdx) => {
        const weekdays = week.slice(0, 5);
        const weekend = week.slice(5, 7);

        // Group weekdays: normal vs split. Split days get pulled out to their own row.
        const normalWeekdays = weekdays.filter((d) => !splitDateSet.has(d.dateStr));
        const splitWeekdays = weekdays.filter((d) => splitDateSet.has(d.dateStr));

        return (
          <div key={weekIdx} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Week {weekIdx + 1}</h3>

            {/* Mon–Fri normal days */}
            {normalWeekdays.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">
                  Monday – Friday <span className="text-white/30">(5pm – 8am)</span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {normalWeekdays.map((day) => renderDay(day, false))}
                </div>
              </div>
            )}

            {/* Split shift weekdays */}
            {splitWeekdays.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-medium text-amber-300/70 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400/70 inline-block" />
                  Split Shift Days
                </div>
                <div className={`grid gap-4 grid-cols-${Math.min(splitWeekdays.length, 3)}`}>
                  {splitWeekdays.map((day) => renderDay(day, true))}
                </div>
              </div>
            )}

            {/* Sat–Sun */}
            <div>
              <div className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">Saturday – Sunday</div>
              <div className="grid grid-cols-2 gap-4">
                {weekend.map((day) => (
                  <div key={day.dateStr} className={`space-y-3 p-3 rounded-lg transition-colors ${isToday(day.date) ? "bg-white/10 border border-white/20" : ""}`}>
                    <div className="text-sm font-medium text-white">
                      <div>{day.dayName}</div>
                      <div className={`text-xs ${isToday(day.date) ? "text-white/80 font-semibold" : "text-white/60"}`}>
                        {format(new Date(day.dateStr + "T00:00:00"), "MMM d")}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { period: "day", label: "Day", time: "(8am – 8pm)" },
                        { period: "night", label: "Night", time: "(8pm – 8am)" },
                      ].map(({ period, label, time }) => (
                        <div key={period} className="space-y-2">
                          <div className="text-xs text-white/50 font-medium">{label} <span className="text-white/30">{time}</span></div>
                          <div className="space-y-1">
                            {positions.map((position) => (
                              <StudentShiftSlot
                                key={`${day.dateStr}-${period}-${position}`}
                                date={day.dateStr}
                                service={service}
                                shiftPeriod={period}
                                position={position}
                                students={students}
                                schedules={schedules}
                                blockStartDate={blockStartDate}
                                onUpdate={() => refetch()}
                                canEdit={canEdit || currentUser?.role === "Student"}
                                isCurrentShift={currentShift?.dateStr === day.dateStr && currentShift?.shiftPeriod === period}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}