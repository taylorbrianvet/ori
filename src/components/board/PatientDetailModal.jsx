import React, { useState } from "react";
import { X, UserX, AlertCircle, ArrowLeftRight, Calendar, LogOut, RotateCcw, Stethoscope, Loader2, CheckCircle2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import TransferForm from "../transfers/TransferForm";

export default function PatientDetailModal({ patient: initialPatient, onClose }) {
  const [patient, setPatient] = useState(initialPatient);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showScheduleDischarge, setShowScheduleDischarge] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [assigningClinician, setAssigningClinician] = useState(false);
  const [clinicianInput, setClinicianInput] = useState(patient.primary_clinician || "");
  const [showClinicianEdit, setShowClinicianEdit] = useState(!patient.primary_clinician);
  const [actionLoading, setActionLoading] = useState(null);

  const queryClient = useQueryClient();

  const { data: surgeries = [] } = useQuery({
    queryKey: ["surgical-logs", patient.id],
    queryFn: () => base44.entities.SurgicalLogEntry.filter({ patient_id: patient.id }),
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ["patient-notes", patient.id],
    queryFn: () => base44.entities.PatientNote.filter({ patient_id: patient.id }),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const eligibleClinicians = staffList
    .filter(s => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map(s => `${s.first_name} ${s.last_name}`);

  const refreshPatient = async () => {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    const updated = await base44.entities.Patient.filter({ patient_id: patient.patient_id });
    if (updated?.length > 0) setPatient(updated[0]);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    const me = await base44.auth.me();
    await base44.entities.PatientNote.create({
      patient_id: patient.id,
      note_date: new Date().toISOString().split("T")[0],
      content: newNote,
      clinician: me?.full_name || "Unknown",
    });
    setNewNote("");
    refetchNotes();
    setIsSubmitting(false);
  };

  const handleAssignClinician = async () => {
    if (!clinicianInput.trim()) return;
    setAssigningClinician(true);
    await base44.entities.Patient.update(patient.id, { primary_clinician: clinicianInput.trim() });
    setPatient(p => ({ ...p, primary_clinician: clinicianInput.trim() }));
    setShowClinicianEdit(false);
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    toast.success("Clinician assigned");
    setAssigningClinician(false);
  };

  const handleDischarge = async () => {
    setActionLoading("discharge");
    await base44.entities.Patient.update(patient.id, {
      discharge_status: "discharged",
      scheduled_discharge_time: new Date().toISOString(),
    });
    toast.success(`${patient.name} discharged`);
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    onClose();
  };

  const handleScheduleDischarge = async () => {
    if (!scheduleDateTime) return;
    setActionLoading("schedule");
    await base44.entities.Patient.update(patient.id, {
      discharge_status: "scheduled",
      scheduled_discharge_time: new Date(scheduleDateTime).toISOString(),
    });
    toast.success("Discharge scheduled");
    setShowScheduleDischarge(false);
    await refreshPatient();
    setActionLoading(null);
  };

  const handleReadmit = async () => {
    setActionLoading("readmit");
    await base44.entities.Patient.update(patient.id, {
      discharge_status: "active",
      scheduled_discharge_time: null,
    });
    toast.success(`${patient.name} re-admitted`);
    await refreshPatient();
    setActionLoading(null);
  };

  const handleClaimService = async () => {
    const me = await base44.auth.me();
    if (!me) return;
    setActionLoading("claim");
    // Service admin should set this — for now uses first service in assigned_services
    const myStaff = staffList.find(s => s.email === me.email);
    const claimService = myStaff?.service || patient.assigned_services?.[0] || patient.service;
    await base44.entities.Patient.update(patient.id, { primary_service_claimed: claimService });
    setPatient(p => ({ ...p, primary_service_claimed: claimService }));
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    toast.success(`Primary service claimed: ${claimService}`);
    setActionLoading(null);
  };

  const isDoubleTransfer = patient.transfer_type === "double";
  const isScheduled = patient.discharge_status === "scheduled";
  const isDischarged = patient.discharge_status === "discharged";

  const scheduledTime = patient.scheduled_discharge_time
    ? (() => {
        const s = /[Z+\-]\d*$/.test(patient.scheduled_discharge_time) ? patient.scheduled_discharge_time : patient.scheduled_discharge_time + "Z";
        return new Date(s);
      })()
    : null;
  const isOverdueDischarge = isScheduled && scheduledTime && scheduledTime < new Date();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-panel border-b border-white/10 p-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-white">{patient.name}</h2>
              {patient.patient_id && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/45 font-mono">
                  #{patient.patient_id}
                </span>
              )}
              {isDoubleTransfer && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-200">
                  <AlertCircle className="w-3 h-3" /> Double Transfer
                </span>
              )}
              {isOverdueDischarge && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/25 border border-orange-400/35 text-orange-200 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> DC Overdue
                </span>
              )}
              {isDischarged && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-200">
                  Discharged
                </span>
              )}
            </div>
            <p className="text-xs text-white/45 mt-0.5">
              {[patient.age_years && `${patient.age_years}y`, patient.sex, patient.species, patient.breed].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Clinician Assignment */}
          <div className={`rounded-xl border p-3 ${!patient.primary_clinician ? "bg-amber-500/10 border-amber-400/30" : "bg-white/5 border-white/10"}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {patient.primary_clinician
                  ? <Stethoscope className="w-3.5 h-3.5 text-white/50" />
                  : <UserX className="w-3.5 h-3.5 text-amber-300" />
                }
                <span className="text-xs font-medium text-white/70">Primary Clinician</span>
              </div>
              {!showClinicianEdit && (
                <button onClick={() => setShowClinicianEdit(true)} className="text-[10px] text-white/40 hover:text-white/70 underline">
                  {patient.primary_clinician ? "Change" : "Assign"}
                </button>
              )}
            </div>
            {showClinicianEdit ? (
              <div className="mt-2 flex gap-2">
                <input
                  list="clinician-datalist"
                  value={clinicianInput}
                  onChange={e => setClinicianInput(e.target.value)}
                  placeholder="Search or type clinician name…"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/25 focus:outline-none"
                />
                <datalist id="clinician-datalist">
                  {eligibleClinicians.map(n => <option key={n} value={n} />)}
                </datalist>
                <button
                  onClick={handleAssignClinician}
                  disabled={assigningClinician || !clinicianInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/30 hover:bg-amber-500/45 text-amber-200 text-xs font-medium disabled:opacity-50"
                >
                  {assigningClinician ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </button>
                {patient.primary_clinician && (
                  <button onClick={() => setShowClinicianEdit(false)} className="px-3 py-1.5 rounded-lg bg-white/8 text-white/50 text-xs hover:bg-white/12">
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              patient.primary_clinician
                ? <p className="text-sm font-semibold text-white mt-1">{patient.primary_clinician}</p>
                : <p className="text-xs text-amber-300 mt-1">⚠ No clinician assigned — please assign one</p>
            )}
          </div>

          {/* Double Transfer Claim */}
          {isDoubleTransfer && (
            <div className="rounded-xl border border-red-400/25 bg-red-500/8 p-3">
              <p className="text-xs font-semibold text-red-200 mb-1">Double Transfer</p>
              <p className="text-xs text-white/55 mb-2">
                Services: {patient.assigned_services?.join(" + ") || "—"}
              </p>
              {patient.primary_service_claimed ? (
                <p className="text-xs text-green-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Primary claimed by: {patient.primary_service_claimed}
                </p>
              ) : (
                <button
                  onClick={handleClaimService}
                  disabled={actionLoading === "claim"}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/25 hover:bg-red-500/40 border border-red-400/30 text-red-200 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "claim" ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : "Claim as Primary Service"}
                </button>
              )}
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
              <div>Service: <span className="font-semibold text-white">{patient.service}</span></div>
              <div>Status: <span className="font-semibold text-white capitalize">{patient.discharge_status || "active"}</span></div>
              {patient.team && <div>Team: <span className="font-semibold text-white">{patient.team}</span></div>}
              {isScheduled && scheduledTime && (
                <div className={`col-span-2 ${isOverdueDischarge ? "text-orange-300" : "text-green-300"}`}>
                  DC Scheduled: <span className="font-semibold">{scheduledTime.toLocaleString()}</span>
                  {isOverdueDischarge && " ⚠ Overdue"}
                </div>
              )}
            </div>
            {patient.problem_list?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-[10px] text-white/40 uppercase font-semibold mb-1">Problem List</p>
                <div className="flex flex-wrap gap-1">
                  {patient.problem_list.map((prob, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-white/8 border border-white/12 text-white/70">
                      {prob}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isDischarged && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowTransferForm(v => !v)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500/15 border border-sky-400/25 text-sky-200 text-xs font-medium hover:bg-sky-500/25 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Patient
              </button>

              {isScheduled ? (
                <button
                  onClick={handleReadmit}
                  disabled={actionLoading === "readmit"}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white/60 text-xs font-medium hover:bg-white/14 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "readmit" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Cancel Discharge
                </button>
              ) : (
                <button
                  onClick={() => setShowScheduleDischarge(v => !v)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/15 border border-green-400/25 text-green-200 text-xs font-medium hover:bg-green-500/25 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" /> Schedule DC
                </button>
              )}

              <button
                onClick={handleDischarge}
                disabled={actionLoading === "discharge"}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-400/25 text-red-200 text-xs font-medium hover:bg-red-500/25 transition-colors col-span-2 disabled:opacity-50"
              >
                {actionLoading === "discharge" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Discharge Now
              </button>
            </div>
          )}

          {isDischarged && (
            <button
              onClick={handleReadmit}
              disabled={actionLoading === "readmit"}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-xs font-medium hover:bg-white/14 transition-colors disabled:opacity-50"
            >
              {actionLoading === "readmit" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Re-admit Patient
            </button>
          )}

          {/* Schedule Discharge Picker */}
          {showScheduleDischarge && (
            <div className="rounded-xl border border-green-400/25 bg-green-500/8 p-3 space-y-2">
              <p className="text-xs font-semibold text-green-200">Schedule Discharge Time</p>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={e => setScheduleDateTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-sm text-white focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleScheduleDischarge}
                  disabled={!scheduleDateTime || actionLoading === "schedule"}
                  className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === "schedule" ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : "Confirm Schedule"}
                </button>
                <button onClick={() => setShowScheduleDischarge(false)} className="px-4 py-2 rounded-lg bg-white/8 text-white/50 text-xs hover:bg-white/12">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Transfer Form */}
          {showTransferForm && (
            <div className="rounded-xl border border-sky-400/25 bg-sky-500/5 p-3">
              <p className="text-xs font-semibold text-sky-200 mb-3">New Transfer</p>
              <TransferForm
                staffList={staffList}
                prefill={{
                  patient_name: patient.name,
                  patient_id: patient.patient_id || "",
                  species: patient.species,
                  breed: patient.breed || "",
                  problem_list: patient.problem_list || [],
                  requesting_service: patient.service || "",
                  requesting_clinician: patient.primary_clinician || "",
                }}
                onSaved={() => {
                  setShowTransferForm(false);
                  queryClient.invalidateQueries({ queryKey: ["interservice-transfers"] });
                  toast.success("Transfer submitted");
                }}
              />
            </div>
          )}

          {/* Surgeries */}
          {surgeries.length > 0 && (
            <div>
              <p className="text-[10px] text-white/40 uppercase font-semibold mb-2">Surgical Procedures</p>
              <div className="space-y-2">
                {surgeries.map(s => (
                  <div key={s.id} className="rounded-xl p-2.5 border border-amber-400/20 bg-amber-500/8 text-xs text-white/70">
                    <div className="font-medium text-white">{s.procedure}</div>
                    <div className="text-[10px] text-white/45 mt-0.5">
                      {s.surgery_date ? format(parseISO(s.surgery_date), "MMM d, yyyy") : ""} • {s.primary_surgeon}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Notes */}
          <div>
            <p className="text-[10px] text-white/40 uppercase font-semibold mb-2">Progress Notes</p>
            <div className="mb-3 p-3 bg-white/5 border border-white/10 rounded-xl">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a new progress note…"
                className="w-full text-xs p-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/25 focus:outline-none resize-none"
                rows="2"
              />
              <button
                onClick={handleAddNote}
                disabled={isSubmitting || !newNote.trim()}
                className="mt-2 px-3 py-1.5 bg-white/12 hover:bg-white/18 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? "Saving…" : "Add Note"}
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notes.length > 0 ? (
                notes.map(n => (
                  <div key={n.id} className="bg-white/5 rounded-lg p-2 border border-white/8">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs text-white/60 font-medium">{n.clinician}</span>
                      <span className="text-[10px] text-white/35">
                        {n.created_date ? format(parseISO(n.created_date), "MMM d, h:mm a") : ""}
                      </span>
                    </div>
                    <p className="text-xs text-white/70">{n.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/30">No notes yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}