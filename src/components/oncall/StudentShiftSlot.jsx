import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export default function StudentShiftSlot({
  date,
  service,
  shiftPeriod,
  position,
  students,
  schedules,
  blockStartDate,
  onUpdate,
  isStudent,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const assignment = schedules.find(
    (s) =>
      s.date === date &&
      s.service === service &&
      s.shift_period === shiftPeriod &&
      s.position === position
  );

  const handleAssign = async (studentName) => {
    setIsLoading(true);
    const selectedStudent = students.find((s) => `${s.first_name} ${s.last_name}` === studentName);
    
    if (assignment) {
      await base44.entities.StudentOnCallSchedule.update(assignment.id, {
        student_name: studentName,
        student_email: selectedStudent?.email || "",
      });
    } else {
      await base44.entities.StudentOnCallSchedule.create({
        date,
        service,
        shift_period: shiftPeriod,
        position,
        student_name: studentName,
        student_email: selectedStudent?.email || "",
        block_start_date: blockStartDate.toISOString().split("T")[0],
      });
    }
    setIsLoading(false);
    setIsOpen(false);
    onUpdate();
  };

  const handleRemove = async () => {
    if (assignment) {
      await base44.entities.StudentOnCallSchedule.delete(assignment.id);
      onUpdate();
    }
  };

  return (
    <div className="relative">
      {assignment ? (
        <div className="bg-white/10 border border-white/20 rounded-lg p-2 text-xs text-white/70">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate">{assignment.student_name}</span>
            <button
              onClick={handleRemove}
              className="text-white/40 hover:text-white/70 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full text-xs h-8"
            disabled={!isStudent}
          >
            {isStudent ? "Add" : "—"}
          </Button>

          {isOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white/10 border border-white/20 rounded-lg shadow-lg">
              <Select onValueChange={handleAssign} disabled={isLoading}>
                <SelectTrigger className="w-full text-xs border-0">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem
                      key={student.id}
                      value={`${student.first_name} ${student.last_name}`}
                    >
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}