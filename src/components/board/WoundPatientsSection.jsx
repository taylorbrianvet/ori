import React, { useState } from "react";
import { Activity, Dog, Cat } from "lucide-react";
import PatientDetailModal from "./PatientDetailModal";

export default function WoundPatientsSection({ woundCases, compact = false }) {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const SpeciesIcon = ({ species }) => {
    if (species === "Canine") return <Dog className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    if (species === "Feline") return <Cat className="w-4 h-4 text-orange-500 flex-shrink-0" />;
    return null;
  };

  if (compact) {
    return (
      <>
        <div className="glass-card p-3 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-white/70" />
            <h3 className="text-xs font-semibold text-white">
              Wound Patients ({woundCases.length})
            </h3>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {woundCases.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedPatient({ id: w.patient_id, name: w.patient_name, species: w.species })}
                className="w-full text-left p-2.5 rounded-lg bg-gradient-to-br from-white/15 to-white/10 border border-white/20 hover:from-white/20 hover:to-white/15 transition-colors text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <SpeciesIcon species={w.species} />
                  <span className="font-semibold text-white">{w.patient_name}</span>
                </div>
                <div className="text-white/70 text-[10px]">{w.species}</div>
                {w.wound_locations?.length > 0 && (
                  <div className="text-[9px] text-white/50 mt-0.5">
                    {w.wound_locations.slice(0, 1).join(", ")}
                    {w.wound_locations.length > 1 && ` +${w.wound_locations.length - 1}`}
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
          <Activity className="w-5 h-5 text-white/70" />
          <h2 className="text-sm font-semibold text-white">
            Wound Patients <span className="text-white/50 font-normal">({woundCases.length})</span>
          </h2>
        </div>

        <div className="space-y-2">
          {woundCases.map(w => (
            <button
              key={w.id}
              onClick={() => setSelectedPatient({ id: w.patient_id, name: w.patient_name, species: w.species })}
              className="w-full text-left p-3 rounded-lg bg-white/6 border border-white/12 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SpeciesIcon species={w.species} />
                <span className="font-semibold text-white text-sm">{w.patient_name}</span>
              </div>
              <p className="text-xs text-white/50">{w.species}</p>
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