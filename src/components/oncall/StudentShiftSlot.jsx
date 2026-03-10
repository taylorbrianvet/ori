import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { X, Plus } from "lucide-react";

export default function StudentShiftSlot({
  shift,
  assignedStudent,
  students,
  currentUser,
  onAssignmentChange,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAssignStudent = async (student) => {
    setIsLoading(true);
    try {
      if (assignedStudent) {
        // Update existing assignment
        await base44.entities.StudentOnCallSchedule.update(assignedStudent.id, {
          student_name: student.first_name + " " + student.last_name,
          student_email: student.email,
        });
      } else {
        // Create new assignment
        await base44.entities.StudentOnCallSchedule.create({
          date: shift.date,
          service: shift.service,
          shift_period: shift.shift_period,
          position: shift.position,
          student_name: student.first_name + " " + student.last_name,
          student_email: student.email,
          block_start_date: format(new Date(shift.date), "yyyy-MM-dd"),
        });
      }
      setShowDropdown(false);
      onAssignmentChange();
    } catch (error) {
      console.error("Error assigning student:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!assignedStudent) return;
    setIsLoading(true);
    try {
      await base44.entities.StudentOnCallSchedule.delete(assignedStudent.id);
      onAssignmentChange();
    } catch (error) {
      console.error("Error removing student:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = currentUser?.role === "student" || currentUser?.role === "admin";

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={!canEdit || isLoading}
        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center justify-between ${
          assignedStudent
            ? "bg-gradient-to-br from-white/20 to-white/10 border border-white/20 text-white"
            : "bg-white/8 border border-white/12 text-white/60 hover:bg-white/12 hover:text-white"
        } ${!canEdit && "opacity-60 cursor-not-allowed"}`}
      >
        <div className="flex items-center gap-2">
          {assignedStudent ? (
            <>
              <span className="text-xs text-white/80">{shift.position}</span>
              <span className="font-semibold">{assignedStudent.student_name}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span className="text-xs text-white/50">{shift.position}</span>
            </>
          )}
        </div>
        {assignedStudent && canEdit && (
          <X className="w-4 h-4 text-white/50 hover:text-white" />
        )}
      </button>

      {showDropdown && canEdit && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/15 backdrop-blur border border-white/20 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {students.length > 0 ? (
              students.map((student) => (
                <button
                  key={student.id}
                  onClick={() =>
                    handleAssignStudent(student)
                  }
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/20 transition-colors border-b border-white/10 last:border-b-0 text-white"
                >
                  {student.first_name} {student.last_name}
                  {student.email && (
                    <div className="text-xs text-white/50">{student.email}</div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-white/50">No students available</div>
            )}

            {assignedStudent && (
              <>
                <div className="border-t border-white/20" />
                <button
                  onClick={handleRemoveStudent}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/20 transition-colors text-red-400"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}