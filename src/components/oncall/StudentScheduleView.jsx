import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StudentShiftSlot from "./StudentShiftSlot";
import { format, addDays, startOfWeek, getDay, isToday } from "date-fns";
import { Button } from "@/components/ui/button";

export default function StudentScheduleView({ service: initialService, blockStartDate, currentUser, canEdit = false }) {
  const [selectedService, setSelectedService] = useState(initialService);
  
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Staff.filter({ role: "Student" }),
  });

  const { data: schedules = [], refetch } = useQuery({
    queryKey: ["student-on-call-schedules"],
    queryFn: () => base44.entities.StudentOnCallSchedule.list(),
  });

  const weekData = useMemo(() => {
    const weeks = [];
    for (let weekNum = 0; weekNum < 2; weekNum++) {
      const week = [];
      // Start from Monday of the block
      const weekStart = addDays(blockStartDate, weekNum * 7);
      
      // Get all 7 days
      for (let dayNum = 0; dayNum < 7; dayNum++) {
        const date = addDays(weekStart, dayNum);
        const dateStr = format(date, "yyyy-MM-dd");
        week.push({
          dateStr,
          date,
          dayName: format(date, "EEE"),
          dayNum: getDay(date),
        });
      }
      weeks.push(week);
    }
    return weeks;
  }, [blockStartDate]);

  return (
    <div className="space-y-8">
      {/* Service Selector */}
      <div className="flex gap-3">
        <Button
          variant={selectedService === "Neurosurgery" ? "default" : "outline"}
          onClick={() => setSelectedService("Neurosurgery")}
          className="text-sm"
        >
          Neurosurgery
        </Button>
        <Button
          variant={selectedService === "Surgery" ? "default" : "outline"}
          onClick={() => setSelectedService("Surgery")}
          className="text-sm"
        >
          Surgery
        </Button>
      </div>

      {/* Two-week calendar */}
      {weekData.map((week, weekIdx) => (
        <div key={weekIdx} className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Week {weekIdx + 1}</h3>

          {/* Monday-Friday */}
          <div>
            <div className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">Monday - Friday <span className="text-white/30">(5pm - 8am)</span></div>
            <div className="grid grid-cols-5 gap-4">
              {week.slice(0, 5).map((day) => (
                <div key={day.dateStr} className={`space-y-3 p-3 rounded-lg transition-colors ${isToday(day.date) ? "bg-white/10 border border-white/20" : ""}`}>
                  <div className={`text-sm font-medium ${isToday(day.date) ? "text-white" : "text-white"}`}>
                    <div>{day.dayName}</div>
                    <div className={`text-xs ${isToday(day.date) ? "text-white/80 font-semibold" : "text-white/60"}`}>{format(new Date(day.dateStr + "T00:00:00"), "MMM d")}</div>
                  </div>
                  <div className="space-y-1">
                    {["primary", "secondary"].map((position) => (
                      <StudentShiftSlot
                        key={`${day.dateStr}-${position}`}
                        date={day.dateStr}
                        service={selectedService}
                        shiftPeriod="main"
                        position={position}
                        students={students}
                        schedules={schedules}
                        blockStartDate={blockStartDate}
                        onUpdate={() => refetch()}
                        canEdit={canEdit || currentUser?.role === "Student"}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saturday-Sunday */}
          <div>
            <div className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">Saturday - Sunday</div>
            <div className="grid grid-cols-2 gap-4">
              {week.slice(5, 7).map((day) => (
                <div key={day.dateStr} className={`space-y-3 p-3 rounded-lg transition-colors ${isToday(day.date) ? "bg-white/10 border border-white/20" : ""}`}>
                  <div className={`text-sm font-medium ${isToday(day.date) ? "text-white" : "text-white"}`}>
                    <div>{day.dayName}</div>
                    <div className={`text-xs ${isToday(day.date) ? "text-white/80 font-semibold" : "text-white/60"}`}>{format(new Date(day.dateStr + "T00:00:00"), "MMM d")}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="text-xs text-white/50 font-medium">Day <span className="text-white/30">(8am - 8pm)</span></div>
                      <div className="space-y-1">
                        {["primary", "secondary"].map((position) => (
                          <StudentShiftSlot
                            key={`${day.dateStr}-day-${position}`}
                            date={day.dateStr}
                            service={selectedService}
                            shiftPeriod="day"
                            position={position}
                            students={students}
                            schedules={schedules}
                            blockStartDate={blockStartDate}
                            onUpdate={() => refetch()}
                            canEdit={canEdit || currentUser?.role === "Student"}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-white/50 font-medium">Night <span className="text-white/30">(8pm - 8am)</span></div>
                      <div className="space-y-1">
                        {["primary", "secondary"].map((position) => (
                          <StudentShiftSlot
                            key={`${day.dateStr}-night-${position}`}
                            date={day.dateStr}
                            service={selectedService}
                            shiftPeriod="night"
                            position={position}
                            students={students}
                            schedules={schedules}
                            blockStartDate={blockStartDate}
                            onUpdate={() => refetch()}
                            canEdit={canEdit || currentUser?.role === "Student"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}