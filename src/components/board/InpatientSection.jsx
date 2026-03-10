import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Users } from "lucide-react";
import PatientDetailModal from "./PatientDetailModal";

export default function InpatientSection({ patients, compact = false }) {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const signalment = (p) => [p.age_years && `${p.age_years}y`, p.sex, p.species]
    .filter(Boolean)
    .join(" • ");

  if (compact) {
    return (
      <>
        <div className="glass-card p-3 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-white/70" />
            <h3 className="text-xs font-semibold text-white">
              Inpatients ({patients.length})
            </h3>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className="w-full text-left p-2 rounded-lg bg-white/6 border border-white/12 hover:bg-white/10 transition-colors text-[11px]"
              >
                <div className="font-semibold text-white">{p.name}</div>
                <div className="text-white/50">{signalment(p)}</div>
                {p.problem_list?.length > 0 && (
                  <div className="text-[9px] text-white/40 mt-0.5">
                    {p.problem_list.slice(0, 1).map((prob, i) => prob).join(", ")}
                    {p.problem_list.length > 1 && ` +${p.problem_list.length - 1}`}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedPatient && (
          <PatientDetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-white/70" />
          <h2 className="text-sm font-semibold text-white">
            Inpatients <span className="text-white/50 font-normal">({patients.length})</span>
          </h2>
        </div>

        <div className="space-y-2">
          {patients.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className="w-full text-left p-3 rounded-lg bg-white/6 border border-white/12 hover:bg-white/10 transition-colors"
            >
              <div className="font-semibold text-white text-sm">{p.name}</div>
              <p className="text-xs text-white/50">{signalment(p)}</p>
              {p.primary_clinician && (
                <p className="text-xs text-white/50 mt-1">Clinician: {p.primary_clinician}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedPatient && (
        <PatientDetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </>
  );
}