import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Users } from "lucide-react";
import PatientDetailModal from "./PatientDetailModal";

export default function InpatientSection({ patients }) {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const signalment = (p) => [p.age_years && `${p.age_years}y`, p.sex, p.species, p.breed]
    .filter(Boolean)
    .join(" • ");

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
              className="w-full text-left p-3 rounded-lg bg-white/6 border border-white/12 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{p.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/45 font-mono">
                      {p.patient_id}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mb-1">{signalment(p)}</p>
                  {p.problem_list?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.problem_list.slice(0, 2).map((prob, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/60">
                          {prob}
                        </span>
                      ))}
                      {p.problem_list.length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-white/40">+{p.problem_list.length - 2}</span>
                      )}
                    </div>
                  )}
                  {p.primary_clinician && (
                    <p className="text-xs text-white/50 mt-1">Clinician: {p.primary_clinician}</p>
                  )}
                  {p.discharge_time && (
                    <p className="text-xs text-amber-300 mt-1">
                      Discharge: {format(parseISO(p.discharge_time), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>
              </div>
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