import React from "react";
import { Users } from "lucide-react";

export default function ClinicTeamSection({ schedules }) {
  const team1 = {};
  const team2 = {};
  const faculty = new Set();

  schedules.forEach(s => {
    if (s.faculty_1) faculty.add(s.faculty_1);
    if (s.faculty_2) faculty.add(s.faculty_2);
    
    if (s.team_split === "Team 1" || s.team_split === "Team A") {
      team1.officers = [s.house_officer_1, s.house_officer_2, s.house_officer_3].filter(Boolean);
    }
    if (s.team_split === "Team 2" || s.team_split === "Team B") {
      team2.officers = [s.house_officer_4, s.house_officer_5, s.house_officer_6].filter(Boolean);
    }
  });

  const facultyList = Array.from(faculty).filter(Boolean);
  const hasTeamData = (team1.officers?.length > 0) || (team2.officers?.length > 0);
  
  if (facultyList.length === 0 && !hasTeamData) {
    return (
      <div className="glass-card p-2 mb-4">
        <p className="text-[10px] text-white/30">No staff scheduled</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-2 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-3.5 h-3.5 text-white/50" />
        <h3 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Today's Team</h3>
      </div>

      {facultyList.length > 0 && (
        <div className="mb-2">
          <p className="text-[9px] text-white/40 font-semibold mb-1">Faculty</p>
          <div className="flex flex-wrap gap-1">
            {facultyList.map(name => (
              <span key={name} className="px-1.5 py-0.5 rounded text-[9px] bg-white/8 border border-white/12 text-white/70">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasTeamData && (
        <div className="grid grid-cols-2 gap-2">
          {team1.officers?.length > 0 && (
            <div>
              <p className="text-[9px] text-white/40 font-semibold mb-1">Team 1</p>
              <div className="space-y-0.5">
                {team1.officers.map(name => (
                  <span key={name} className="text-[8px] text-white/60 block">{name}</span>
                ))}
              </div>
            </div>
          )}
          {team2.officers?.length > 0 && (
            <div>
              <p className="text-[9px] text-white/40 font-semibold mb-1">Team 2</p>
              <div className="space-y-0.5">
                {team2.officers.map(name => (
                  <span key={name} className="text-[8px] text-white/60 block">{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}