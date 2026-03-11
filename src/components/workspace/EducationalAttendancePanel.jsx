import { Users, Plus, X } from "lucide-react";

export default function EducationalAttendancePanel({ round, currentUserEmail, onToggleLog }) {
  const residentsPresent = round?.residents_present || [];
  const facultyPresent = round?.faculty_present || [];
  const loggedBy = round?.logged_by || [];
  const hasLoggedThisRound = loggedBy.includes(currentUserEmail);

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-xs font-semibold text-white/70 flex items-center gap-2">
        <Users className="w-3.5 h-3.5" />
        Attendance
      </h3>

      {/* Residents */}
      <div>
        <p className="text-[10px] text-white/50 uppercase tracking-wide mb-2">Residents ({residentsPresent.length})</p>
        {residentsPresent.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {residentsPresent.map((name, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-[10px] text-white/70"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-white/30 italic">No residents recorded</p>
        )}
      </div>

      {/* Faculty */}
      <div>
        <p className="text-[10px] text-white/50 uppercase tracking-wide mb-2">Faculty ({facultyPresent.length})</p>
        {facultyPresent.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {facultyPresent.map((name, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-white/70"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-white/30 italic">No faculty recorded</p>
        )}
      </div>

      {/* Log Button */}
      <button
        onClick={() => onToggleLog(round.id)}
        className={`w-full py-2 rounded-lg text-xs font-medium transition-all border ${
          hasLoggedThisRound
            ? "bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30"
            : "bg-white/10 border-white/20 text-white/70 hover:bg-white/15"
        }`}
      >
        {hasLoggedThisRound ? "✓ Logged Attendance" : "Log Your Attendance"}
      </button>
    </div>
  );
}