import React from "react";
import { Calendar, Users } from "lucide-react";
import { formatISO } from "date-fns";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function EducationalRoundCard({ round, onClick, isDragging }) {
  const attendeeCount = (round.residents_present || []).length + (round.faculty_present || []).length;
  const presenterCount = (round.presenters || []).length;

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition-all ${
        isDragging
          ? "bg-white/10 border-white/30 opacity-50"
          : "bg-white/5 border-white/15 hover:bg-white/8 hover:border-white/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{round.event_type || "Round"}</p>
          <p className="text-[11px] text-white/50 truncate">{round.topic || "—"}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-white/40">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(round.date)}
        </div>
        {attendeeCount > 0 && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {attendeeCount} present
          </div>
        )}
      </div>
    </div>
  );
}