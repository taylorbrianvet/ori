import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const APPOINTMENT_TYPES = ["Surgery", "Recheck", "Consult", "Tech Appointment", "General Appointment", "Other"];
const SPECIES = ["Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];

export default function NewAppointmentModal({ selectedService, defaultDate, onSaved, onClose }) {
  const [patientId, setPatientId] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundPatient, setFoundPatient] = useState(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultDateStr = defaultDate ? `${format(defaultDate, "yyyy-MM-dd")}T08:00` : "";

  const [form, setForm] = useState({
    name: "",
    species: "Canine",
    breed: "",
    sex: "Female Spayed",
    age_years: "",
    weight_kg: "",
    appointment_datetime: defaultDateStr,
    appointment_reason: "General Appointment",
    appointment_clinician: "",
    reason_for_visit: "",
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Auto-search when patient ID changes
  useEffect(() => {
    if (!patientId.trim()) {
      setFoundPatient(null);
      setShowFullForm(false);
      return;
    }

    const searchPatient = async () => {
      setSearching(true);
      try {
        const existing = await base44.entities.GlobalPatient.filter({ 
          patient_id: patientId.trim() 
        });

        if (existing?.length > 0) {
          const gp = existing[0];
          setFoundPatient(gp);
          setShowFullForm(false);
          set("name", gp.name || "");
          set("species", gp.species || "Canine");
          set("breed", gp.breed || "");
          set("sex", gp.sex || "Female Spayed");
        } else {
          setFoundPatient(null);
          setShowFullForm(true);
          set("name", "");
        }
      } catch (err) {
        setFoundPatient(null);
        setShowFullForm(true);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(searchPatient, 500);
    return () => clearTimeout(timer);
  }, [patientId]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.appointment_datetime) return;
    setSaving(true);

    try {
      let globalPatientId = foundPatient?.id;

      if (!globalPatientId && patientId.trim()) {
        const existing = await base44.entities.GlobalPatient.filter({ 
          patient_id: patientId.trim() 
        });

        if (existing?.length > 0) {
          globalPatientId = existing[0].id;
        } else {
          const gp = await base44.entities.GlobalPatient.create({
            name: form.name.trim(),
            patient_id: patientId.trim(),
            species: form.species,
            breed: form.breed.trim() || undefined,
            sex: form.sex || undefined,
          });
          globalPatientId = gp.id;
        }
      }

      await base44.entities.PatientVisit.create({
        name: form.name.trim(),
        patient_id: patientId.trim() || undefined,
        global_patient_id: globalPatientId || undefined,
        species: form.species,
        breed: form.breed.trim() || undefined,
        sex: form.sex || undefined,
        age_years: form.age_years ? parseFloat(form.age_years) : undefined,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
        patient_type: "Appointment",
        discharge_status: "active",
        involved_services: [selectedService],
        appointment_datetime: new Date(form.appointment_datetime).toISOString(),
        appointment_reason: form.appointment_reason,
        appointment_clinician: form.appointment_clinician.trim() || undefined,
        appointment_notes: form.reason_for_visit.trim() || undefined,
      });

      setSaving(false);
      onSaved();
    } catch (err) {
      setSaving(false);
    }
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
        className="glass-panel rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass-panel rounded-t-2xl px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Appointment</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Patient ID input — always shown */}
          <div>
            <label className="block text-xs text-white/50 mb-2">Patient ID *</label>
            <div className="relative">
              <input
                type="text"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
                className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-sm"
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Found patient confirmation */}
          {foundPatient && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/20">
              <p className="text-xs text-green-200">
                Found: <span className="font-semibold">{foundPatient.name}</span>
              </p>
            </div>
          )}

          {/* Full form — shown only if no match or user chooses to create new */}
          {showFullForm && (
            <>
              {/* Patient name + Species */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="Patient name"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Species</label>
                  <select
                    value={form.species}
                    onChange={e => set("species", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  >
                    {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Breed + Sex */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Breed</label>
                  <input
                    value={form.breed}
                    onChange={e => set("breed", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Sex</label>
                  <select
                    value={form.sex}
                    onChange={e => set("sex", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  >
                    {["Female Spayed", "Female Intact", "Male Neutered", "Male Intact"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Age + Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Age (years)</label>
                  <input
                    type="number"
                    value={form.age_years}
                    onChange={e => set("age_years", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight_kg}
                    onChange={e => set("weight_kg", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* Appointment details — shown if patient found or full form visible */}
          {(foundPatient || showFullForm) && (
            <>
              {/* Date/Time + Appointment Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.appointment_datetime}
                    onChange={e => set("appointment_datetime", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Appointment Type</label>
                  <select
                    value={form.appointment_reason}
                    onChange={e => set("appointment_reason", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  >
                    {APPOINTMENT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Clinician */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Clinician</label>
                <input
                  value={form.appointment_clinician}
                  onChange={e => set("appointment_clinician", e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                />
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Reason for Visit</label>
                <textarea
                  value={form.reason_for_visit}
                  onChange={e => set("reason_for_visit", e.target.value)}
                  placeholder="Optional"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.appointment_datetime}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500/25 hover:bg-orange-500/35 border border-orange-400/30 text-orange-200 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "Creating…" : "Create Appointment"}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg bg-white/8 text-white/50 hover:bg-white/12 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}