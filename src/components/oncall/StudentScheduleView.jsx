import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StudentShiftSlot from "./StudentShiftSlot";
import { format, addDays } from "date-fns";

export default function StudentScheduleView({ service, blockStartDate, currentUser, canEdit = false }) {
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Staff.filter({ role: "Student" }),
  });

  const { data: schedules = [], refetch } = useQuery({
    queryKey: ["student-on-call-schedules"],
    queryFn: () => base44.entities.StudentOnCallSchedule.list(),
  });

  const shifts = useMemo(() => {
    const grouped = {};
    for (let i = 0; i < 14; i++) {
      const date = addDays(blockStartDate, i);
      const dateStr = format(date, "yyyy-MM-dd");
      grouped[dateStr] = [
        { period: "day", positions: ["primary", "secondary"] },
        { period: "night", positions: ["primary", "secondary"] },
      ];
    }
    return grouped;
  }, [blockStartDate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">{service} Schedule</h2>
        <div className="grid gap-2">
          {Object.entries(shifts).map(([date, dayShifts]) => (
            <div key={date} className="space-y-2">
              <div className="text-sm font-medium text-white/70">{format(new Date(date + "T00:00:00"), "EEE, MMM d")}</div>
              <div className="grid grid-cols-4 gap-2">
                {dayShifts.map((shift, idx) => (
                  <div key={`${date}-${shift.period}`}>
                    <div className="text-xs text-white/50 mb-1 capitalize">{shift.period}</div>
                    <div className="space-y-1">
                      {shift.positions.map((position) => (
                        <StudentShiftSlot
                          key={`${date}-${shift.period}-${position}`}
                          date={date}
                          service={service}
                          shiftPeriod={shift.period}
                          position={position}
                          students={students}
                          schedules={schedules}
                          blockStartDate={blockStartDate}
                          onUpdate={() => refetch()}
                          canEdit={canEdit || currentUser?.role === "student"}
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
}