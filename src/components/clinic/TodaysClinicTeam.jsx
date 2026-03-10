import React from "react";
import { format } from "date-fns";

function PersonBadge({ name, role }) {
  if (!name) return null;
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60 font-medium flex-shrink-0">
        {initials}
      </div>
      <div>
        <p className="text-xs text-white/80 font-medium leading-none">{name}</p>
        {role && <p className="text-[9px] text-white/35 mt-0.5">{role}</p>}
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
    <div className="rounded-xl bg-white/4 border border-white/10 p-3 flex-1 min-w-0">
      {entry.team_split && (
        <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">{entry.team_split}</p>
      )}
      <div className="space-y-2">
        {entry.faculty_1 && <PersonBadge name={entry.faculty_1} role="Faculty" />}
        {entry.faculty_2 && <PersonBadge name={entry.faculty_2} role="Faculty" />}
        {houseOfficers.map((ho, i) => (
          <PersonBadge key={i} name={ho} role="House Officer" />
        ))}
      </div>
    </div>
  );
}

// Labels that should sort to the LEFT (Team 1, IM1, Small Animal, etc.)
const LEFT_SPLITS = ["team 1", "team a", "im1", "1", "small animal", "large animal a"];

function sortEntries(entries) {
  if (entries.length <= 1) return entries;
  return [...entries].sort((a, b) => {
    const aLabel = (a.team_split || "").toLowerCase();
    const bLabel = (b.team_split || "").toLowerCase();
    const aIsLeft = LEFT_SPLITS.some(l => aLabel.includes(l));
    const bIsLeft = LEFT_SPLITS.some(l => bLabel.includes(l));
    if (aIsLeft && !bIsLeft) return -1;
    if (!aIsLeft && bIsLeft) return 1;
    return aLabel.localeCompare(bLabel);
  });
}

export default function TodaysClinicTeam({ clinicSchedules = [], serviceName }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayEntries = clinicSchedules.filter(e => {
    let entryDate = e.date || "";
    if (entryDate.includes("/")) {
      const parts = entryDate.split("/");
      if (parts.length === 3) {
        entryDate = `${parts[2]}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`;
      }
    } else {
      entryDate = entryDate.slice(0, 10);
    }
    return entryDate === todayStr && e.service === serviceName;
  });

  if (todayEntries.length === 0) {
    return (
      <div className="rounded-xl bg-white/4 border border-white/10 p-4 text-xs text-white/30 text-center">
        No clinic schedule entry found for today.
      </div>
    );
  }

  const sorted = sortEntries(todayEntries);
  const isSplit = sorted.length > 1;

  return (
    <div className={`flex gap-3 ${isSplit ? "flex-row" : "flex-col"}`}>
      {sorted.map((entry, i) => (
        <TeamBlock key={i} entry={entry} />
      ))}
    </div>
  );
}