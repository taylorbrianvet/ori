import React from "react";
import { Activity } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function WoundPatientsSection({ woundCases }) {
  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-white/70" />
        <h2 className="text-sm font-semibold text-white">
          Wound Patients <span className="text-white/50 font-normal">({woundCases.length})</span>
        </h2>
      </div>

      <div className="space-y-2">
        {woundCases.map(w => (
          <div key={w.id} className="p-3 rounded-lg bg-white/6 border border-white/12">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold text-white text-sm">{w.patient_name}</div>
                <p className="text-xs text-white/50">{w.species} • {w.breed}</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/8 border border-white/12 text-white/45">
                {w.patient_case_number}
              </span>
            </div>

            {w.wound_locations?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-white/50 font-semibold mb-1">Wound Locations</p>
                <div className="flex flex-wrap gap-1">
                  {w.wound_locations.map((loc, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/60">
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {w.next_bandage_change && (
              <p className="text-xs text-amber-300">
                Next bandage change: {format(parseISO(w.next_bandage_change), "MMM d, h:mm a")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}