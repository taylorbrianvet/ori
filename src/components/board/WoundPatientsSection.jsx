import React from "react";
import { Activity } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function WoundPatientsSection({ woundCases, compact = false }) {
  if (compact) {
    return (
      <div className="glass-card p-3 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-white/70" />
          <h3 className="text-xs font-semibold text-white">
            Wound Patients ({woundCases.length})
          </h3>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {woundCases.map(w => (
            <div key={w.id} className="p-2 rounded-lg bg-white/6 border border-white/12 text-[11px]">
              <div className="font-semibold text-white">{w.patient_name}</div>
              <div className="text-white/50 text-[10px]">{w.species}</div>
              {w.wound_locations?.length > 0 && (
                <div className="text-[9px] text-white/40 mt-0.5">
                  {w.wound_locations.slice(0, 1).join(", ")}
                  {w.wound_locations.length > 1 && ` +${w.wound_locations.length - 1}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            <div className="font-semibold text-white text-sm">{w.patient_name}</div>
            <p className="text-xs text-white/50">{w.species}</p>
          </div>
        ))}
      </div>
    </div>
  );
}