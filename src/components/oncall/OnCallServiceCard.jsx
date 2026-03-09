import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import TeamRosterMiniBlock from "./TeamRosterMiniBlock";

function groupByTeam(entries) {
  const teams = {};
  for (const e of entries) {
    const key = e.team_name || "Team";
    if (!teams[key]) teams[key] = { faculty: [], residents: [], interns: [] };
    const sub = (e.subtype || "").toLowerCase();
    if (sub === "faculty") teams[key].faculty.push(e);
    else if (sub === "intern") teams[key].interns.push(e);
    else teams[key].residents.push(e); // resident / default
  }
  return teams;
}

export default function OnCallServiceCard({ service, entries, userMap, index, onClick }) {
  const teams = groupByTeam(entries);
  const teamKeys = Object.keys(teams);
  const multiTeam = teamKeys.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <div
        onClick={onClick}
        className="glass-card p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/60" />
            <h3 className="text-sm font-semibold text-white">{service?.service_name || "Service"}</h3>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-200" />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-3" />

        {/* Teams */}
        {entries.length === 0 ? (
          <p className="text-xs text-white/40 italic">No assignments today</p>
        ) : (
          teamKeys.map((teamKey) => (
            <TeamRosterMiniBlock
              key={teamKey}
              teamLabel={multiTeam ? teamKey : null}
              faculty={teams[teamKey].faculty}
              residents={teams[teamKey].residents}
              interns={teams[teamKey].interns}
              userMap={userMap}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}