import { X, Calendar, BookOpen, Users } from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function EducationalDetailPanel({ round, onClose }) {
  const residents = round.residents_present || [];
  const faculty = round.faculty_present || [];
  const presenters = round.presenters || [];

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onClose}
        className="self-end mb-3 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Event Type & Topic */}
        <div>
          <p className="text-[11px] font-semibold text-white/40 uppercase mb-1">Event Type</p>
          <p className="text-sm font-semibold text-white">{round.event_type || "—"}</p>
        </div>

        {round.topic && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase mb-1">Topic</p>
            <p className="text-xs text-white/75 leading-snug">{round.topic}</p>
          </div>
        )}

        {/* Date */}
        <div>
          <p className="text-[11px] font-semibold text-white/40 uppercase mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date
          </p>
          <p className="text-xs text-white/75">{formatDate(round.date)}</p>
        </div>

        {/* Department(s) */}
        {round.departments && round.departments.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase mb-1">Department</p>
            <div className="flex flex-wrap gap-1">
              {round.departments.map((dept, i) => (
                <span key={i} className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded">
                  {dept}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Presenters */}
        {presenters.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Presenters
            </p>
            <div className="space-y-1">
              {presenters.map((presenter, i) => (
                <p key={i} className="text-xs text-white/70">{presenter}</p>
              ))}
            </div>
          </div>
        )}

        {/* Residents Present */}
        {residents.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Residents ({residents.length})
            </p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {residents.map((resident, i) => (
                <p key={i} className="text-xs text-white/70">{resident}</p>
              ))}
            </div>
          </div>
        )}

        {/* Faculty Present */}
        {faculty.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Faculty ({faculty.length})
            </p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {faculty.map((fac, i) => (
                <p key={i} className="text-xs text-white/70">{fac}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}