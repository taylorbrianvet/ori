import React, { useState } from "react";
import { X, Edit2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";

export default function PatientDetailModal({ patient, onClose }) {
  const [isEditing, setIsEditing] = useState(false);

  const { data: surgeries = [] } = useQuery({
    queryKey: ["surgical-logs", patient.id],
    queryFn: () => base44.entities.SurgicalLogEntry.filter({ patient_id: patient.id }),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["patient-notes", patient.id],
    queryFn: () => base44.entities.PatientNote.filter({ patient_id: patient.id }),
  });

  const { data: woundCases = [] } = useQuery({
    queryKey: ["wound-cases", patient.id],
    queryFn: () => base44.entities.WoundCase.filter({ patient_id: patient.id }),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 border-b border-white/10 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{patient.name}</h2>
            <p className="text-xs text-white/50">{patient.patient_id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Patient Info */}
          <div className="bg-white/6 rounded-lg p-3 border border-white/10">
            <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
              <div>Species: <span className="text-white/90">{patient.species}</span></div>
              <div>Age: <span className="text-white/90">{patient.age_years}y</span></div>
              <div>Sex: <span className="text-white/90">{patient.sex}</span></div>
              <div>Breed: <span className="text-white/90">{patient.breed}</span></div>
            </div>
            {patient.problem_list?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-white/50 font-semibold mb-1">Problem List</p>
                <div className="space-y-1">
                  {patient.problem_list.map((prob, i) => (
                    <p key={i} className="text-xs text-white/75">• {prob}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Surgeries */}
          {surgeries.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Surgical Procedures</h3>
              <div className="space-y-2">
                {surgeries.map(s => (
                  <div key={s.id} className="bg-white/6 rounded-lg p-2 border border-white/10 text-xs text-white/75">
                    <div className="font-medium text-white/90">{s.procedure}</div>
                    <div className="text-[10px] text-white/50">
                      {format(parseISO(s.surgery_date), "MMM d, yyyy")} • {s.primary_surgeon}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Notes */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Progress Notes</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notes.length > 0 ? (
                notes.map(n => (
                  <div key={n.id} className="bg-white/6 rounded-lg p-2 border border-white/10">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs text-white/50">{format(parseISO(n.created_date), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="text-xs text-white/75">{n.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/30">No notes yet</p>
              )}
            </div>
          </div>

          {/* Wounds */}
          {woundCases.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Wound Cases</h3>
              <p className="text-xs text-white/70">This patient has active wound cases. View in Wound Care section.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}