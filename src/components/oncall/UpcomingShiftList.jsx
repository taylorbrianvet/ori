import React from "react";
import { format, parseISO } from "date-fns";
import { Clock } from "lucide-react";
import GlassCard from "../shared/GlassCard";

export default function UpcomingShiftList({ schedules, services, userMap }) {
  const serviceMap = Object.fromEntries((services || []).map((s) => [s.id, s]));
  const today = format(new Date(), "yyyy-MM-dd");

  const upcoming = (schedules || [])
    .filter((s) => s.on_call && s.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  if (upcoming.length === 0) {
    return (
      <GlassCard>
      <p className="text-xs text-white/40 text-center py-4">No upcoming on-call shifts.</p>
      </GlassCard>
    );
  }

  let lastDate = null;

  return (
    <div className="space-y-1">
      {upcoming.map((s, i) => {
        const showDate = s.date !== lastDate;
        lastDate = s.date;
        const svc = serviceMap[s.service_id];
        const user = userMap?.[s.user_id];
        const name = s.user_name || user?.full_name || "Staff";

        return (
          <div key={i}>
            {showDate && (
              <div className="flex items-center gap-2 mt-3 mb-1.5 first:mt-0">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                <p className="text-[11px] font-semibold text-white/50">
                  {format(parseISO(s.date), "EEEE, MMM d")}
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-white/12 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white/80">{name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/85 truncate">{name}</p>
                <p className="text-[10px] text-white/45 truncate">{svc?.service_name}</p>
              </div>
              {s.team_name && (
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/10 text-white/50 shrink-0">{s.team_name}</span>
              )}
              {s.start_time && (
                <div className="flex items-center gap-1 text-[10px] text-white/40 shrink-0">
                  <Clock className="w-3 h-3" />
                  {s.start_time}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}