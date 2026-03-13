import React from "react";
import { Users } from "lucide-react";

export default function ClinicTeamSection({ schedules, inline }) {
  const allClinicians = [];

  schedules.forEach(s => {
    if (s.faculty_1) allClinicians.push(s.faculty_1);
    if (s.faculty_2) allClinicians.push(s.faculty_2);
    if (s.house_officer_1) allClinicians.push(s.house_officer_1);
    if (s.house_officer_2) allClinicians.push(s.house_officer_2);
    if (s.house_officer_3) allClinicians.push(s.house_officer_3);
    if (s.house_officer_4) allClinicians.push(s.house_officer_4);
    if (s.house_officer_5) allClinicians.push(s.house_officer_5);
    if (s.house_officer_6) allClinicians.push(s.house_officer_6);
  });

  const uniqueClinicians = [...new Set(allClinicians)].filter(Boolean);
  
  if (uniqueClinicians.length === 0) {
    return (
      <div className="glass-card p-2 mb-4">
        <p className="text-[10px] text-white/30">No staff scheduled</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-2 mb-4">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-white/50" />
        <h3 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Today's Team</h3>
        <span className="text-[9px] text-white/50 truncate">{uniqueClinicians.join(", ")}</span>
      </div>
    </div>
  );
}