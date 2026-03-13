import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const APPOINTMENT_REASONS = [
  "Surgery",
  "Recheck",
  "Consult",
  "Tech Appointment",
  "General Appointment",
  "Other",
];

const SPECIES = ["Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];

export default function NewAppointmentForm({ selectedService, defaultDate, onSaved, onCancel }) {
  const defaultDateStr = defaultDate
    ? `${format(defaultDate, "yyyy-MM-dd")}T08:00`
    : "";

  const [form, setForm] = useState({
    name: "",
    patient_id: "",
    species: "Canine",
    breed: "",
    appointment_datetime: defaultDateStr,
    appointment_reason: "General Appointment",
    appointment_clinician: "",
    appointment_notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.appointment_datetime) return;
    setSaving(true);

    // Check / create GlobalPatient if patient_id provided
    let globalPatientId = null;
    if (form.patient_id.trim()) {
      const existing = await base44.entities.GlobalPatient.filter({ patient_id: form.patient_id.trim() });
      if (existing?.length > 0) {
        globalPatientId = existing[0].id;
      } else {
        const gp = await base44.entities.GlobalPatient.create({
          name: form.name.trim(),
          patient_id: form.patient_id.trim(),
          species: form.species,
          breed: form.breed.trim() || undefined,
        });
        globalPatientId = gp.id;
      }
    }

    await base44.entities.PatientVisit.create({
      name: form.name.trim(),
      patient_id: form.patient_id.trim() || undefined,
      global_patient_id: globalPatientId || undefined,
      species: form.species,
      breed: form.breed.trim() || undefined,
      patient_type: "Appointment",
      discharge_status: "active",
      involved_services: [selectedService],
      appointment_datetime: new Date(form.appointment_datetime).toISOString(),
      appointment_reason: form.appointment_reason,
      appointment_clinician: form.appointment_clinician.trim() || undefined,
      appointment_notes: form.appointment_notes.trim() || undefined,
    });

    setSaving(false);
    onSaved();
  };

  return (
    <div className="rounded-xl border border-white/12 bg-white/5 p-3 space-y-2.5 text-xs">
      <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">New Appointment</p>

      {/* Patient name + ID */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Patient Name *</label>
          <input
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Buddy"
            className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/20 focus:outline-none text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Patient ID</label>
          <input
            value={form.patient_id}
            onChange={e => set("patient_id", e.target.value)}
            placeholder="Optional"
            className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/20 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Species + Breed */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Species</label>
          <select
            value={form.species}
            onChange={e => set("species", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
          >
            {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Breed</label>
          <input
            value={form.breed}
            onChange={e => set("breed", e.target.value)}
            placeholder="Optional"
            className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/20 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Date/Time + Reason */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Date & Time *</label>
          <input
            type="datetime-local"
            value={form.appointment_datetime}
            onChange={e => set("appointment_datetime", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Reason</label>
          <select
            value={form.appointment_reason}
            onChange={e => set("appointment_reason", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
          >
            {APPOINTMENT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Clinician */}
      <div>
        <label className="block text-[10px] text-white/40 mb-1">Clinician</label>
        <input
          value={form.appointment_clinician}
          onChange={e => set("appointment_clinician", e.target.value)}
          placeholder="Optional"
          className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/20 focus:outline-none text-xs"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] text-white/40 mb-1">Notes</label>
        <textarea
          value={form.appointment_notes}
          onChange={e => set("appointment_notes", e.target.value)}
          placeholder="Optional"
          rows={2}
          className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/20 focus:outline-none text-xs resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim() || !form.appointment_datetime}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/30 hover:bg-orange-500/45 border border-orange-400/30 text-orange-200 text-xs font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {saving ? "Saving…" : "Create Appointment"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg bg-white/8 text-white/50 text-xs hover:bg-white/12 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}