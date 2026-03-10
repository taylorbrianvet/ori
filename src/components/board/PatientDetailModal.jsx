import React, { useState } from "react";
import { X, Edit2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";

export default function PatientDetailModal({ patient, onClose }) {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: surgeries = [] } = useQuery({
    queryKey: ["surgical-logs", patient.id],
    queryFn: () => base44.entities.SurgicalLogEntry.filter({ patient_id: patient.id }),
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ["patient-notes", patient.id],
    queryFn: () => base44.entities.PatientNote.filter({ patient_id: patient.id }),
  });

  const { data: woundCases = [] } = useQuery({
    queryKey: ["wound-cases", patient.id],
    queryFn: () => base44.entities.WoundCase.filter({ patient_id: patient.id }),
  });

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      await base44.entities.PatientNote.create({
        patient_id: patient.id,
        note_date: new Date().toISOString().split("T")[0],
        content: newNote,
        clinician: (await base44.auth.me())?.full_name || "Unknown",
      });
      setNewNote("");
      refetchNotes();
    } catch (err) {
      console.error("Error adding note:", err);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{patient.name}</h2>
            <p className="text-xs text-slate-500">{patient.patient_id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Patient Info */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
              <div>Species: <span className="font-semibold text-slate-900">{patient.species}</span></div>
              <div>Age: <span className="font-semibold text-slate-900">{patient.age_years}y</span></div>
              <div>Sex: <span className="font-semibold text-slate-900">{patient.sex}</span></div>
              <div>Breed: <span className="font-semibold text-slate-900">{patient.breed}</span></div>
            </div>
            {patient.problem_list?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-slate-600 font-semibold mb-1">Problem List</p>
                <div className="space-y-1">
                  {patient.problem_list.map((prob, i) => (
                    <p key={i} className="text-xs text-slate-700">• {prob}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Surgeries */}
          {surgeries.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Surgical Procedures</h3>
              <div className="space-y-2">
                {surgeries.map(s => (
                  <div key={s.id} className="bg-amber-50 rounded-lg p-2 border border-amber-200 text-xs text-slate-700">
                    <div className="font-medium text-slate-900">{s.procedure}</div>
                    <div className="text-[10px] text-slate-600">
                      {format(parseISO(s.surgery_date), "MMM d, yyyy")} • {s.primary_surgeon}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Notes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Progress Notes</h3>
            
            {/* Add Note Form */}
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a new progress note..."
                className="w-full text-xs p-2 border border-green-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="2"
              />
              <button
                onClick={handleAddNote}
                disabled={isSubmitting || !newNote.trim()}
                className="mt-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white text-xs font-medium rounded transition-colors"
              >
                {isSubmitting ? "Saving..." : "Add Note"}
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notes.length > 0 ? (
                notes.map(n => (
                  <div key={n.id} className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs text-slate-600 font-medium">{n.clinician}</span>
                      <span className="text-[10px] text-slate-500">{format(parseISO(n.created_date), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="text-xs text-slate-700">{n.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No notes yet</p>
              )}
            </div>
          </div>

          {/* Wounds */}
          {woundCases.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Wound Cases</h3>
              <p className="text-xs text-slate-600">This patient has active wound cases. View in Wound Care section.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}