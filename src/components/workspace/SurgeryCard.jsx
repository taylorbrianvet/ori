import React from "react";
import { format } from "date-fns";
import { AlertTriangle, Users } from "lucide-react";

function formatLongDate(dateStr) {
  if (!dateStr) return "—";
  try {
    // parse as local date to avoid timezone shift
    const [y, m, d] = dateStr.split("-").map(Number);
    return format(new Date(y, m - 1, d), "MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export default function SurgeryCard({ entry, onClick, isDragging = false }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-3 cursor-pointer hover:bg-white/12 transition-all select-none ${
        isDragging ? "opacity-60 scale-95 rotate-1" : ""
      }`}
    >
      {/* Procedure name */}
      <p className="text-sm font-semibold text-white leading-snug mb-2">{entry.procedure}</p>

      {/* Date */}
      <p className="text-[11px] text-white/55 mb-2">{formatLongDate(entry.surgery_date)}</p>

      {/* Details grid */}
      <div className="space-y-1">
        {entry.species && (
          <div className="flex gap-1.5 text-[11px]">
            <span className="text-white/35 w-16 flex-shrink-0">Species</span>
            <span className="text-white/70">{entry.species}</span>
          </div>
        )}
        {entry.diagnosis && (
          <div className="flex gap-1.5 text-[11px]">
            <span className="text-white/35 w-16 flex-shrink-0">Diagnosis</span>
            <span className="text-white/70 line-clamp-1">{entry.diagnosis}</span>
          </div>
        )}
        {entry.laterality && entry.laterality !== "N/A" && (
          <div className="flex gap-1.5 text-[11px]">
            <span className="text-white/35 w-16 flex-shrink-0">Laterality</span>
            <span className="text-white/70">{entry.laterality}</span>
          </div>
        )}
        {entry.primary_surgeon && (
          <div className="flex gap-1.5 text-[11px]">
            <span className="text-white/35 w-16 flex-shrink-0">Surgeon</span>
            <span className="text-white/70">{entry.primary_surgeon}</span>
          </div>
        )}
        {entry.faculty_present && (
          <div className="flex gap-1.5 text-[11px]">
            <span className="text-white/35 w-16 flex-shrink-0">Faculty</span>
            <span className="text-white/70">{entry.faculty_present}</span>
          </div>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        {entry.emergency && (
          <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-2.5 h-2.5" /> Emergency
          </span>
        )}
        {(entry.residents_scrubbed_in || []).length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-white/45 bg-white/8 px-2 py-0.5 rounded-full">
            <Users className="w-2.5 h-2.5" />
            {entry.residents_scrubbed_in.length} resident{entry.residents_scrubbed_in.length !== 1 ? "s" : ""}
          </span>
        )}
        {entry.case_number && (
          <span className="text-[10px] text-white/30 ml-auto">#{entry.case_number}</span>
        )}
      </div>
    </div>
  );
}