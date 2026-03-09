import React from "react";
import ContactActionButtons from "./ContactActionButtons";

function PersonRow({ entry, userMap }) {
  const user = userMap[entry.user_id] || {};
  const name = entry.user_name || user.full_name || "Unknown";
  const phone = user.phone;
  const email = user.email;

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-primary">{name.charAt(0)}</span>
        </div>
        <span className="text-xs text-foreground truncate">{name}</span>
      </div>
      <ContactActionButtons phone={phone} email={email} size="sm" />
    </div>
  );
}

export default function TeamRosterMiniBlock({ teamLabel, faculty, residents, interns, userMap }) {
  const hasFaculty = faculty && faculty.length > 0;
  const hasResidents = residents && residents.length > 0;
  const hasInterns = interns && interns.length > 0;

  if (!hasFaculty && !hasResidents && !hasInterns) return null;

  return (
    <div className="mb-2">
      {teamLabel && (
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 mt-2">{teamLabel}</p>
      )}
      {hasFaculty && (
        <div className="mb-1">
          <p className="text-[10px] text-muted-foreground/70 mb-0.5">Faculty</p>
          {faculty.map((e, i) => <PersonRow key={i} entry={e} userMap={userMap} />)}
        </div>
      )}
      {hasResidents && (
        <div className="mb-1">
          <p className="text-[10px] text-muted-foreground/70 mb-0.5">Residents</p>
          {residents.map((e, i) => <PersonRow key={i} entry={e} userMap={userMap} />)}
        </div>
      )}
      {hasInterns && (
        <div>
          <p className="text-[10px] text-muted-foreground/70 mb-0.5">Interns</p>
          {interns.map((e, i) => <PersonRow key={i} entry={e} userMap={userMap} />)}
        </div>
      )}
    </div>
  );
}