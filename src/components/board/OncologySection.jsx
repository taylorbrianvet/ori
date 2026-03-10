import React from "react";
import { TrendingUp } from "lucide-react";

export default function OncologySection({ patients }) {
  const signalment = (p) => [p.age_years && `${p.age_years}y`, p.sex, p.species, p.breed]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-white/70" />
        <h2 className="text-sm font-semibold text-white">
          Recurring Oncology Patients <span className="text-white/50 font-normal">({patients.length})</span>
        </h2>
      </div>

      <div className="space-y-2">
        {patients.map(p => (
          <div key={p.id} className="p-3 rounded-lg bg-white/6 border border-white/12">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">{p.name}</div>
                <p className="text-xs text-white/50">{signalment(p)}</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/8 border border-white/12 text-white/45">
                {p.patient_id}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}