import React from "react";
import { format, parseISO, isToday, isPast } from "date-fns";
import { CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";

const EVENT_COLORS = {
  "Journal Club": "bg-blue-500/20 text-blue-200 border-blue-400/30",
  "Textbook Review": "bg-amber-500/20 text-amber-200 border-amber-400/30",
  "Morbidity & Mortality": "bg-red-500/20 text-red-200 border-red-400/30",
  "Formal Case Presentation": "bg-purple-500/20 text-purple-200 border-purple-400/30",
  "Seminar": "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  "Other": "bg-white/10 text-white/60 border-white/20",
};

const STATUS_ICON = {
  approved: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
  cancelled: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  scheduled: <Clock className="w-3.5 h-3.5 text-white/30" />,
};

export default function RoundRow({ round, onClick }) {
  const date = parseISO(round.date);
  const past = isPast(date) && !isToday(date);
  const colorClass = EVENT_COLORS[round.event_type] || EVENT_COLORS["Other"];

  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-xl border border-white/10 bg-white/4 hover:bg-white/8 transition-all p-3 flex items-center gap-3 ${past && round.status === "scheduled" ? "opacity-60" : ""}`}>
      {/* Date column */}
      <div className={`flex-shrink-0 w-12 text-center rounded-lg py-1.5 ${isToday(date) ? "bg-white/15" : "bg-white/6"}`}>
        <p className="text-[10px] text-white/40 font-medium uppercase">{format(date, "EEE")}</p>
        <p className="text-sm font-bold text-white leading-none mt-0.5">{format(date, "d")}</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
            {round.event_type}
          </span>
          <span className="text-[10px] text-white/30">{round.department}</span>
        </div>
        <p className="text-xs text-white/75 font-medium truncate">{round.topic || "No topic set"}</p>
        {round.clinician && (
          <p className="text-[10px] text-white/35 mt-0.5 truncate">{round.clinician}</p>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {STATUS_ICON[round.status] || STATUS_ICON.scheduled}
        <ChevronRight className="w-3.5 h-3.5 text-white/20" />
      </div>
    </button>
  );
}