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
  canEdit,
  isCurrentShift,
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

  const getInitials = (fullName) => {
    return fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const displayName = assignment ? getInitials(assignment.student_name) : null;

  return (
    <div className="relative">
      {assignment ? (
        <div className={`rounded-lg p-2 text-xs text-white font-semibold transition-colors flex items-center justify-between gap-1 ${
          isCurrentShift 
            ? "bg-green-500/40 border border-green-400/60 shadow-lg shadow-green-500/20" 
            : "bg-primary/30 border border-primary/50"
        }`}>
          <span className="truncate" title={assignment.student_name}>{displayName}</span>
          {canEdit && (
            <button
              onClick={handleRemove}
              className="text-white/40 hover:text-white/70 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full text-xs h-8"
            disabled={!canEdit}
          >
            {canEdit ? `+ ${position.charAt(0).toUpperCase() + position.slice(1)}` : "—"}
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