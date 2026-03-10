import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";

const SERVICES = [
  "Anesthesia","Cardiology","Clinical Pathology","Dermatology","Emergency","Critical Care",
  "Internal Medicine","Interventional Radiology","Neurology","Nutrition","Medical Oncology",
  "Radiation Oncology","Ophthalmology","Orthopedic Surgery","Primary Care","General Surgery",
  "Radiology","Soft Tissue Surgery"
];
const SPECIES = ["Canine","Feline","Equine","Bovine","Avian","Exotic","Other"];
const SEXES = ["Female Spayed","Female Intact","Male Neutered","Male Intact"];

export default function ConsultRequestForm({ onClose, onSuccess, consultingService, staffList = [] }) {
  const [form, setForm] = useState({
    patient_name: "",
    patient_case_number: "",
    species: "",
    breed: "",
    age_years: "",
    sex: "",
    weight_kg: "",
    reason_for_consult: "",
    requesting_service: "",
    requesting_clinician: "",
  });
  const [clinicianSearch, setClinicianSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filteredClinicians = staffList.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(clinicianSearch.toLowerCase())
  ).slice(0, 8);

  const handleSubmit = async () => {
    if (!form.patient_name || !form.reason_for_consult || !form.requesting_service || !form.requesting_clinician) {
      return toast.error("Please fill in all required fields.");
    }
    setSaving(true);

    // Find or create patient
    let patientId = null;
    if (form.patient_case_number) {
      const existing = await base44.entities.Patient.filter({ patient_id: form.patient_case_number });
      if (existing?.length > 0) {
        patientId = existing[0].id;
      } else {
        const newPt = await base44.entities.Patient.create({
          name: form.patient_name,
          patient_id: form.patient_case_number,
          species: form.species || "Canine",
          breed: form.breed,
          age_years: parseFloat(form.age_years) || undefined,
          sex: form.sex || undefined,
          weight_kg: parseFloat(form.weight_kg) || undefined,
          patient_type: "Inpatient",
        });
        patientId = newPt.id;
      }
    }

    await base44.entities.ConsultRequest.create({
      ...form,
      age_years: parseFloat(form.age_years) || undefined,
      weight_kg: parseFloat(form.weight_kg) || undefined,
      patient_id: patientId,
      consulting_service: consultingService,
      status: "pending",
      consult_date: format(new Date(), "yyyy-MM-dd"),
    });

    toast.success("Consult request submitted.");
    setSaving(false);
    onSuccess?.();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="relative glass-panel w-full sm:rounded-2xl sm:max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 glass-panel z-10">
          <div>
            <h2 className="text-sm font-semibold text-white">Request Consult</h2>
            {consultingService && <p className="text-xs text-white/40 mt-0.5">→ {consultingService}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold">Patient Information</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Patient Name *</label>
              <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                placeholder="e.g. Max" value={form.patient_name} onChange={e => set("patient_name", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Case / Patient ID</label>
              <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                placeholder="e.g. 123456" value={form.patient_case_number} onChange={e => set("patient_case_number", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Species</label>
              <select className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40"
                value={form.species} onChange={e => set("species", e.target.value)}>
                <option value="">Select…</option>
                {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Breed</label>
              <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                placeholder="e.g. Labrador" value={form.breed} onChange={e => set("breed", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Age (years)</label>
              <input type="number" min="0" step="0.1" className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                placeholder="e.g. 5" value={form.age_years} onChange={e => set("age_years", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Sex</label>
              <select className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40"
                value={form.sex} onChange={e => set("sex", e.target.value)}>
                <option value="">Select…</option>
                {SEXES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Weight (kg)</label>
              <input type="number" min="0" step="0.1" className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                placeholder="e.g. 25" value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} />
            </div>
          </div>

          <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold pt-2">Consult Details</p>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Reason for Consult *</label>
            <textarea rows={3} className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none"
              placeholder="Describe the reason for the consult…" value={form.reason_for_consult} onChange={e => set("reason_for_consult", e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Requesting Service *</label>
            <select className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40"
              value={form.requesting_service} onChange={e => set("requesting_service", e.target.value)}>
              <option value="">Select service…</option>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Requesting Clinician *</label>
            <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 mb-1"
              placeholder="Search clinician name…" value={clinicianSearch}
              onChange={e => { setClinicianSearch(e.target.value); set("requesting_clinician", e.target.value); }} />
            {clinicianSearch && filteredClinicians.length > 0 && !form.requesting_clinician?.includes(clinicianSearch.split(" ")[0]) && (
              <div className="rounded-xl border border-white/15 bg-black/50 overflow-hidden">
                {filteredClinicians.map(s => (
                  <button key={s.id} onClick={() => {
                    const name = `${s.first_name} ${s.last_name}`;
                    set("requesting_clinician", name);
                    setClinicianSearch(name);
                  }}
                    className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors border-b border-white/8 last:border-0">
                    {s.first_name} {s.last_name} <span className="text-white/30">· {s.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/15 hover:bg-white/22 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Submitting…" : "Submit Consult"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}