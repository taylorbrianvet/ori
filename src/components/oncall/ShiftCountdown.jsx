import React, { useState, useEffect } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { format, addDays } from "date-fns";

// Returns ms until next 8am
function msUntilNextShift() {
  const now = new Date();
  const next8am = new Date(now);
  next8am.setHours(8, 0, 0, 0);
  if (now >= next8am) next8am.setDate(next8am.getDate() + 1);
  return next8am - now;
}

function formatCountdown(ms) {
  if (ms <= 0) return "Shift change now";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m until shift change`;
  if (m > 0) return `${m}m ${s}s until shift change`;
  return `${s}s until shift change`;
}

export default function ShiftCountdown({ onViewNext }) {
  const [ms, setMs] = useState(msUntilNextShift());
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const show = ms <= twoHoursMs;

  useEffect(() => {
    const interval = setInterval(() => setMs(msUntilNextShift()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  const nextDate = format(addDays(new Date(), 1), "MMMM d");

  return (
    <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Clock className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
        <div>
          <p className="text-sm font-semibold text-amber-200">{formatCountdown(ms)}</p>
          <p className="text-xs text-amber-300/60">Next shift begins {nextDate} at 8:00 AM</p>
        </div>
      </div>
      <button
        onClick={onViewNext}
        className="flex items-center gap-1 text-xs font-medium text-amber-200 bg-amber-400/15 hover:bg-amber-400/25 px-3 py-1.5 rounded-xl transition-colors shrink-0"
      >
        Next shift <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}