import React, { useState } from "react";
import { X, Clock, Stethoscope, CalendarClock, ArrowUpCircle, Loader2, Pencil, Check, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const APPOINTMENT_REASONS = [
  "Surgery", "Recheck", "Consult", "Tech Appointment", "General Appointment", "Other",
];

const APPOINTMENT_REASON_COLORS = {
  Surgery: "bg-red-500/15 border-red-400/25",
  Recheck: "bg-sky-500/15 border-sky-400/25",
  Consult: "bg-violet-500/15 border-violet-400/25",
  "Tech Appointment": "bg-teal-500/15 border-teal-400/25",
  "General Appointment": "bg-white/8 border-white/12",
  Other: "bg-white/8 border-white/12",
};

function formatApptTime(isoString) {
  if (!isoString) return null;
  const s = /[Z+\-]\d*$/.test(isoString) ? isoString : isoString + "Z";
  return format(new Date(s), "EEEE, MMM d, yyyy · h:mm a");
}

function toLocalDatetimeInput(isoString) {
  if (!isoString) return "";
  const s = /[Z+\-]\d*$/.test(isoString) ? isoString : isoString + "Z";
  const d = new Date(s);
  // Format as yyyy-MM-ddTHH:mm for datetime-local input
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentDetailModal({ appt: initialAppt, selectedService, onClose }) {
  const [appt, setAppt] = useState(initialAppt);
  const [editing, setEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    appointment_datetime: toLocalDatetimeInput(appt.appointment_datetime),
    appointment_reason: appt.appointment_reason || "General Appointment",
    appointment_clinician: appt.appointment_clinician || "",
    appointment_notes: appt.appointment_notes || "",
  });

  const queryClient = useQueryClient();

  const set = (key, val) => setEditForm(f => ({ ...f, [key]: val }));

  const handleSaveEdit = async () => {
    setActionLoading("save");
    const updated = {
      appointment_datetime: editForm.appointment_datetime
        ? new Date(editForm.appointment_datetime).toISOString()
        : undefined,
      appointment_reason: editForm.appointment_reason,
      appointment_clinician: editForm.appointment_clinician.trim() || undefined,
      appointment_notes: editForm.appointment_notes.trim() || undefined,
    };
    await base44.entities.PatientVisit.update(appt.id, updated);
    setAppt(a => ({ ...a, ...updated }));
    queryClient.invalidateQueries({ queryKey: ["patient-visits"] });
    toast.success("Appointment updated");
    setEditing(false);
    setActionLoading(null);
  };

  const handleAdmit = async () => {
    setActionLoading("admit");
    await base44.entities.PatientVisit.update(appt.id, {
      patient_type: "Inpatient",
      discharge_status: "active",
      originated_from_appointment: true,
      involved_services: appt.involved_services?.length > 0
        ? [appt.involved_services[0]]
        : [selectedService],
    });
    toast.success(`${appt.name} admitted as Inpatient`);
    queryClient.invalidateQueries({ queryKey: ["patient-visits"] });
    onClose();
  };

  const handleCancel = async () => {
    setActionLoading("cancel");
    await base44.entities.PatientVisit.update(appt.id, { discharge_status: "discharged" });
    toast.success("Appointment cancelled");
    queryClient.invalidateQueries({ queryKey: ["patient-visits"] });
    onClose();
  };

  const reasonColor = APPOINTMENT_REASON_COLORS[appt.appointment_reason] || APPOINTMENT_REASON_COLORS.Other;
  const timeDisplay = formatApptTime(appt.appointment_datetime);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className={`sticky top-0 glass-panel border-b border-white/10 p-4 flex items-start justify-between gap-3 rounded-t-2xl ${reasonColor}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarClock className="w-4 h-4 text-white/60 flex-shrink-0" />
              <h2 className="text-base font-semibold text-white">{appt.name}</h2>
              {appt.patient_id && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 border border-white/10 text-white/45 font-mono">
                  #{appt.patient_id}
                </span>
              )}
              {appt.appointment_reason && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 border border-white/15 text-white/70">
                  {appt.appointment_reason}
                </span>
              )}
            </div>
            <p className="text-xs text-white/45 mt-0.5">
              {[appt.species, appt.breed].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setEditing(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title={editing ? "Cancel edit" : "Edit appointment"}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* View mode */}
          {!editing && (
            <div className="space-y-3">
              {/* Date/Time */}
              {timeDisplay && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <span>{timeDisplay}</span>
                </div>
              )}

              {/* Clinician */}
              {appt.appointment_clinician && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Stethoscope className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <span>{appt.appointment_clinician}</span>
                </div>
              )}

              {/* Services */}
              <div className="text-xs text-white/50">
                Service: <span className="text-white font-medium">{appt.involved_services?.join(", ") || selectedService}</span>
              </div>

              {/* Notes */}
              {appt.appointment_notes && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-3">
                  <p className="text-[10px] text-white/35 uppercase font-semibold mb-1">Notes</p>
                  <p className="text-sm text-white/70 leading-relaxed">{appt.appointment_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Edit mode */}
          {editing && (
            <div className="space-y-3 rounded-xl border border-white/12 bg-white/5 p-3">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">Edit Appointment</p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editForm.appointment_datetime}
                    onChange={e => set("appointment_datetime", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">Reason</label>
                  <select
                    value={editForm.appointment_reason}
                    onChange={e => set("appointment_reason", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  >
                    {APPOINTMENT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/40 mb-1">Clinician</label>
                <input
                  value={editForm.appointment_clinician}
                  onChange={e => set("appointment_clinician", e.target.value)}
                  placeholder="Optional"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/20 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-white/40 mb-1">Notes</label>
                <textarea
                  value={editForm.appointment_notes}
                  onChange={e => set("appointment_notes", e.target.value)}
                  rows={3}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/20 focus:outline-none text-xs resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading === "save"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/30 hover:bg-orange-500/45 border border-orange-400/30 text-orange-200 text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  {actionLoading === "save" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/8 text-white/50 text-xs hover:bg-white/12 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleAdmit}
              disabled={actionLoading === "admit"}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/20 border border-green-400/30 text-green-200 text-sm font-medium hover:bg-green-500/35 transition-colors disabled:opacity-50"
            >
              {actionLoading === "admit"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ArrowUpCircle className="w-4 h-4" />
              }
              Admit as Inpatient
            </button>

            {/* Cancel appointment */}
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Cancel Appointment
              </button>
            ) : (
              <div className="rounded-xl border border-red-400/25 bg-red-500/8 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
                  <p className="text-xs font-semibold text-red-200">Cancel this appointment?</p>
                </div>
                <p className="text-[11px] text-white/50 mb-3">This will mark the appointment as discharged and remove it from the board.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading === "cancel"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/45 border border-red-400/30 text-red-200 text-xs font-medium disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/8 text-white/50 text-xs hover:bg-white/12 transition-colors"
                  >
                    Keep Appointment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}