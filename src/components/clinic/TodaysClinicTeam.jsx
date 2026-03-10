import React from "react";
import { format } from "date-fns";

const SPLIT_SERVICES = ["Internal Medicine", "Orthopedic Surgery", "Soft Tissue Surgery", "Anesthesia"];

function PersonBadge({ name, role }) {
  if (!name) return null;
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 font-medium flex-shrink-0">
        {initials}
      </div>
      <div>
        <p className="text-xs text-white/80 font-medium leading-none">{name}</p>
        {role && <p className="text-[10px] text-white/35 mt-0.5">{role}</p>}
      </div>
    </div>
  );
}

function TeamBlock({ entry }) {
  const houseOfficers = [
    entry.house_officer_1, entry.house_officer_2, entry.house_officer_3,
    entry.house_officer_4, entry.house_officer_5, entry.house_officer_6,
  ].filter(Boolean);

  return (
    <div className="rounded-xl bg-white/4 border border-white/10 p-3">
      {entry.team_split && (
        <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">{entry.team_split}</p>
      )}
      <div className="space-y-2">
        {entry.faculty_1 && (
          <PersonBadge name={entry.faculty_1}
            role={entry.faculty_1?.toLowerCase().includes("chief") ? "Chief Block" : "Faculty"} />
        )}
        {entry.faculty_2 && (
          <PersonBadge name={entry.faculty_2}
            role={entry.faculty_2?.toLowerCase().includes("chief") ? "Chief Block" : "Faculty"} />
        )}
        {houseOfficers.map((ho, i) => (
          <PersonBadge key={i} name={ho} role="House Officer" />
        ))}
      </div>
    </div>
  );
}

export default function TodaysClinicTeam({ clinicSchedules = [], serviceName }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayEntries = clinicSchedules.filter(e => e.date === todayStr && e.service === serviceName);

  if (todayEntries.length === 0) {
    return (
      <div className="rounded-xl bg-white/4 border border-white/10 p-4 text-xs text-white/30 text-center">
        No clinic schedule entry found for today.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todayEntries.map((entry, i) => (
        <TeamBlock key={i} entry={entry} />
      ))}
    </div>
  );
}