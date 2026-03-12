import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronDown } from "lucide-react";

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
  const dropdownRef = useRef(null);

  const assignment = schedules.find(
    (s) =>
      s.date === date &&
      s.service === service &&
      s.shift_period === shiftPeriod &&
      s.position === position
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

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

  const positionLabel = position.charAt(0).toUpperCase() + position.slice(1);

  // Position color styling
  const positionColors = {
    primary:   { bg: "bg-blue-500/25 border-blue-400/50",   text: "text-blue-100",   btn: "bg-blue-500/20 border-blue-400/40 hover:bg-blue-500/35 text-blue-200" },
    secondary: { bg: "bg-purple-500/25 border-purple-400/50", text: "text-purple-100", btn: "bg-purple-500/20 border-purple-400/40 hover:bg-purple-500/35 text-purple-200" },
    tertiary:  { bg: "bg-amber-500/25 border-amber-400/50",  text: "text-amber-100",  btn: "bg-amber-500/20 border-amber-400/40 hover:bg-amber-500/35 text-amber-200" },
  };

  const currentColors = isCurrentShift
    ? { bg: "bg-green-500/35 border-green-400/60 shadow-lg shadow-green-500/20", text: "text-green-100", btn: "bg-green-500/20 border-green-400/40 hover:bg-green-500/35 text-green-200" }
    : (positionColors[position] || positionColors.primary);

  return (
    <div className="relative" ref={dropdownRef}>
      {assignment ? (
        <div className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between gap-1 border ${currentColors.bg}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[9px] font-medium uppercase tracking-wide opacity-60 flex-shrink-0 ${currentColors.text}`}>
              {positionLabel[0]}
            </span>
            <span className={`truncate font-bold ${currentColors.text}`} title={assignment.student_name}>
              {getInitials(assignment.student_name)}
            </span>
          </div>
          {canEdit && (
            <button
              onClick={handleRemove}
              className={`opacity-50 hover:opacity-90 flex-shrink-0 ${currentColors.text}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => canEdit && setIsOpen(!isOpen)}
            disabled={!canEdit || isLoading}
            className={`w-full flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 text-xs font-medium border transition-colors ${
              canEdit
                ? `${currentColors.btn} cursor-pointer`
                : "bg-white/5 border-white/10 text-white/20 cursor-default"
            }`}
          >
            <span className="truncate">{canEdit ? `+ ${positionLabel}` : "—"}</span>
            {canEdit && <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
          </button>

          {isOpen && (
            <div className="absolute top-full mt-1 left-0 z-50 min-w-[160px] max-h-48 overflow-y-auto rounded-xl border border-white/25 shadow-2xl"
              style={{ background: "rgba(15, 25, 60, 0.97)", backdropFilter: "blur(16px)" }}>
              {students.length === 0 ? (
                <div className="px-3 py-2 text-xs text-white/40">No students available</div>
              ) : (
                students.map((student) => {
                  const name = `${student.first_name} ${student.last_name}`;
                  return (
                    <button
                      key={student.id}
                      onClick={() => handleAssign(name)}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/15 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {name}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}