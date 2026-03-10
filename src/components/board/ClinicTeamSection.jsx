import React from "react";
import { Users } from "lucide-react";

export default function ClinicTeamSection({ schedules }) {
  const faculty = schedules
    .filter(s => !s.team_name)
    .map(s => s.user_name)
    .filter(Boolean);

  const teamGroups = {};
  schedules.forEach(s => {
    if (s.team_name) {
      if (!teamGroups[s.team_name]) teamGroups[s.team_name] = [];
      teamGroups[s.team_name].push(s.user_name);
    }
  });

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-white/70" />
        <h2 className="text-sm font-semibold text-white">Today's Clinic Team</h2>
      </div>

      <div className="space-y-3">
        {faculty.length > 0 && (
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Faculty</p>
            <div className="flex flex-wrap gap-2">
              {faculty.map(name => (
                <span key={name} className="px-3 py-1 rounded-lg bg-white/8 border border-white/12 text-xs text-white/80">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(teamGroups).length > 0 && (
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Teams</p>
            <div className="space-y-2">
              {Object.entries(teamGroups).map(([team, members]) => (
                <div key={team}>
                  <p className="text-xs text-white/60 font-medium mb-1">{team}</p>
                  <div className="flex flex-wrap gap-2">
                    {members.map(name => (
                      <span key={name} className="px-3 py-1 rounded-lg bg-white/6 border border-white/10 text-xs text-white/70">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {faculty.length === 0 && Object.keys(teamGroups).length === 0 && (
          <p className="text-xs text-white/30">No scheduled staff for today</p>
        )}
      </div>
    </div>
  );
}