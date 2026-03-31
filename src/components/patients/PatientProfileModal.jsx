import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Dog, Cat, Bird, Calendar, Stethoscope } from "lucide-react";
import { format } from "date-fns";

const SPECIES_ICON = { Canine: Dog, Feline: Cat, Avian: Bird };

const VISIT_TYPE_COLORS = {
  Inpatient: "bg-orange-500/20 text-orange-300 border-orange-400/25",
  "Day Patient": "bg-sky-500/20 text-sky-300 border-sky-400/25",
  Appointment: "bg-violet-500/20 text-violet-300 border-violet-400/25",
  Discharged: "bg-white/10 text-white/40 border-white/15",
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40 flex-shrink-0">{label}</span>
      <span className="text-xs text-white/80 text-right">{value}</span>
    </div>
  );
}

export default function PatientProfileModal({ patient, visits, onClose }) {
  const Icon = SPECIES_ICON[patient.species] || Stethoscope;

  const sortedVisits = [...visits].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  const formatAge = (gp) => {
    const parts = [];
    if (gp.age_years) parts.push(`${gp.age_years}y`);
    if (gp.age_months) parts.push(`${gp.age_months}m`);
    if (gp.age_weeks) parts.push(`${gp.age_weeks}w`);
    return parts.join(" ") || null;
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-panel rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass-panel rounded-t-2xl px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{patient.name}</h2>
              <p className="text-xs text-white/40">{patient.patient_id || "No ID"} · {patient.species}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Demographics */}
          <div className="glass-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3">Demographics</p>
            <InfoRow label="Breed" value={patient.breed} />
            <InfoRow label="Sex" value={patient.sex} />
            <InfoRow label="Age" value={formatAge(patient)} />
            <InfoRow label="Infectious Status" value={patient.infectious_status !== "Negative" ? patient.infectious_status : null} />
            {patient.alerts?.length > 0 && (
              <div className="flex justify-between items-start gap-4 py-1.5">
                <span className="text-xs text-white/40 flex-shrink-0">Alerts</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {patient.alerts.map((a) => (
                    <span key={a} className="px-1.5 py-0.5 rounded border text-[10px] bg-red-500/20 text-red-300 border-red-400/25">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visit History */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3">Visit History ({sortedVisits.length})</p>
            {sortedVisits.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">No visits recorded</p>
            ) : (
              <div className="space-y-2">
                {sortedVisits.map((v) => {
                  const typeColor = VISIT_TYPE_COLORS[v.patient_type] || "bg-white/10 text-white/40 border-white/15";
                  return (
                    <div key={v.id} className="glass-card p-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${typeColor}`}>
                            {v.patient_type}
                          </span>
                          {v.appointment_reason && (
                            <span className="text-[11px] text-white/40">{v.appointment_reason}</span>
                          )}
                        </div>
                        {v.involved_services?.length > 0 && (
                          <p className="text-xs text-white/55 flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            {v.involved_services.join(", ")}
                          </p>
                        )}
                        {v.appointment_clinician && (
                          <p className="text-xs text-white/40 mt-0.5">Dr. {v.appointment_clinician}</p>
                        )}
                        {v.appointment_notes && (
                          <p className="text-xs text-white/30 mt-1 italic">{v.appointment_notes}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] text-white/35 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {v.appointment_datetime
                            ? format(new Date(v.appointment_datetime), "MMM d, yyyy")
                            : format(new Date(v.created_date), "MMM d, yyyy")}
                        </p>
                        {v.discharge_status === "discharged" && (
                          <p className="text-[10px] text-white/25 mt-0.5">Discharged</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}