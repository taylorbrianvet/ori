import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, addDays, startOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import StudentShiftSlot from "./StudentShiftSlot.js";

export default function StudentScheduleView({ service, blockStartDate, currentUser }) {
  const [students, setStudents] = useState([]);

  // Fetch all students for the shift assignment modal
  useEffect(() => {
    base44.entities.Staff.filter({ role: "Student" })
      .then(results => setStudents(results || []))
      .catch(() => {});
  }, []);

  // Fetch existing schedule for this block and service
  const { data: scheduleData, refetch } = useQuery({
    queryKey: ["studentSchedule", service, blockStartDate],
    queryFn: async () => {
      const blockEndDate = addDays(blockStartDate, 13); // 14 days total
      const results = await base44.entities.StudentOnCallSchedule.filter({
        service,
        block_start_date: format(blockStartDate, "yyyy-MM-dd")
      });
      return results || [];
    },
    initialData: [],
  });

  // Generate all shifts for the two-week block
  const generateShifts = () => {
    const shifts = [];
    for (let i = 0; i < 14; i++) {
      const shiftDate = addDays(blockStartDate, i);
      const dateStr = format(shiftDate, "yyyy-MM-dd");

      // Day shift (8am-8pm)
      shifts.push({
        date: dateStr,
        displayDate: format(shiftDate, "EEE, MMM d"),
        shift_period: "day",
        position: "primary",
        service,
      });
      shifts.push({
        date: dateStr,
        displayDate: format(shiftDate, "EEE, MMM d"),
        shift_period: "day",
        position: "secondary",
        service,
      });

      // Night shift (8pm-8am)
      shifts.push({
        date: dateStr,
        displayDate: format(shiftDate, "EEE, MMM d"),
        shift_period: "night",
        position: "primary",
        service,
      });
      shifts.push({
        date: dateStr,
        displayDate: format(shiftDate, "EEE, MMM d"),
        shift_period: "night",
        position: "secondary",
        service,
      });
    }
    return shifts;
  };

  const shifts = generateShifts();

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    if (!acc[shift.date]) {
      acc[shift.date] = { displayDate: shift.displayDate, shifts: [] };
    }
    acc[shift.date].shifts.push(shift);
    return acc;
  }, {});

  const sortedDates = Object.keys(shiftsByDate).sort();

  return (
    <div className="space-y-4">
      {sortedDates.map((dateStr) => {
        const { displayDate, shifts: dayShifts } = shiftsByDate[dateStr];
        const daySessions = [
          { period: "day", label: "8am - 8pm", shifts: dayShifts.filter(s => s.shift_period === "day") },
          { period: "night", label: "8pm - 8am", shifts: dayShifts.filter(s => s.shift_period === "night") },
        ];

        return (
          <div key={dateStr} className="glass-card p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-4">{displayDate}</h3>

            <div className="grid grid-cols-2 gap-6">
              {daySessions.map((session) => (
                <div key={`${dateStr}-${session.period}`}>
                  <p className="text-xs font-semibold text-white/60 uppercase mb-3">{session.label}</p>
                  <div className="space-y-2">
                    {session.shifts.map((shift) => {
                      const assignedData = scheduleData.find(
                        (s) =>
                          s.date === shift.date &&
                          s.shift_period === shift.shift_period &&
                          s.position === shift.position
                      );

                      return (
                        <StudentShiftSlot
                          key={`${shift.date}-${shift.shift_period}-${shift.position}`}
                          shift={shift}
                          assignedStudent={assignedData}
                          students={students}
                          currentUser={currentUser}
                          onAssignmentChange={refetch}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}