import React from "react";
import { Users } from "lucide-react";

export default function ClinicTeamSection({ schedules }) {
  // Group by faculty first, then by team
  const staffByFaculty = {};
  const teamStaff = {};

  schedules.forEach(s => {
    if (s.faculty_1) {
      if (!staffByFaculty[s.faculty_1]) staffByFaculty[s.faculty_1] = [];
    }
    
    if (s.team_split) {
      if (!teamStaff[s.team_split]) teamStaff[s.team_split] = [];
      const houseOfficers = [s.house_officer_1, s.house_officer_2, s.house_officer_3, s.house_officer_4, s.house_officer_5, s.house_officer_6]
        .filter(Boolean);
      if (houseOfficers.length > 0) {
        teamStaff[s.team_split] = houseOfficers;
      }
    }
  });

  const faculty = Object.keys(staffByFaculty).filter(Boolean);
  
  if (faculty.length === 0 && Object.keys(teamStaff).length === 0) {
    return (
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-white/70" />
          <h3 className="text-xs font-semibold text-white">Today's Clinic Team</h3>
        </div>
        <p className="text-xs text-white/30">No staff scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-3 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-white/70" />
        <h3 className="text-xs font-semibold text-white">Today's Clinic Team</h3>
      </div>

      <div className="space-y-2">
        {faculty.length > 0 && (
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Faculty</p>
            <div className="flex flex-wrap gap-1">
              {faculty.map(name => (
                <span key={name} className="px-2 py-0.5 rounded-lg bg-white/8 border border-white/12 text-[11px] text-white/75">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(teamStaff).length > 0 && (
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Teams</p>
            <div className="space-y-1.5">
              {Object.entries(teamStaff).map(([team, members]) => (
                <div key={team}>
                  <p className="text-[10px] text-white/50 font-medium mb-0.5">{team}</p>
                  <div className="flex flex-wrap gap-1">
                    {members.map(name => (
                      <span key={name} className="px-2 py-0.5 rounded-lg bg-white/6 border border-white/10 text-[10px] text-white/60">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}