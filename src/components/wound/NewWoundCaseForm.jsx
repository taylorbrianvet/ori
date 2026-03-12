import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { X, Plus, Trash2, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { calculateAgeComponents } from "../shared/ageCalculator";

const SERVICES = [
  "Soft Tissue Surgery", "Orthopedic Surgery", "Neurology", "Dermatology",
  "Cardiology", "Internal Medicine", "Oncology", "Ophthalmology",
  "Emergency", "Critical Care", "Primary Care", "General Surgery"
];
const SPECIES = ["Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];
const SEXES = ["Female Spayed", "Female Intact", "Male Neutered", "Male Intact"];

export default function NewWoundCaseForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    patient_name: "",
    patient_case_number: "",
    species: "",
    breed: "",
    birthdate: "", // ISO date for dynamic age calculation
    weight_kg: "",
    sex: "",
    service: "",
    primary_clinician: "",
    problem_list: [""],
    wound_locations: [""],
  });
  const [saving, setSaving] = useState(false);
  const [existingCases, setExistingCases] = useState(null);

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  // Fetch GlobalPatient to check if patient exists
  const { data: existingGlobalPatient } = useQuery({
    queryKey: ["global-patient-by-id", form.patient_case_number],
    queryFn: () => form.patient_case_number
      ? base44.entities.GlobalPatient.filter({ patient_id: form.patient_case_number }).then(r => r?.[0])
      : null,
    enabled: !!form.patient_case_number,
  });

  const clinicianOptions = staffList
    .filter(s => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map(s => `${s.first_name} ${s.last_name}`);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const setProblem = (i, val) => {
    const arr = [...form.problem_list];
    arr[i] = val;
    set("problem_list", arr);
  };

  const addProblem = () => set("problem_list", [...form.problem_list, ""]);

  const removeProblem = (i) => {
    const arr = form.problem_list.filter((_, idx) => idx !== i);
    set("problem_list", arr.length === 0 ? [""] : arr);
  };

  const setWound = (i, val) => {
    const arr = [...form.wound_locations];
    arr[i] = val;
    set("wound_locations", arr);
  };

  const addWound = () => set("wound_locations", [...form.wound_locations, ""]);

  const removeWound = (i) => {
    const arr = form.wound_locations.filter((_, idx) => idx !== i);
    set("wound_locations", arr.length === 0 ? [""] : arr);
  };

  const proceedCreate = async () => {
    setExistingCases(null);
    await doCreate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const wounds = form.wound_locations.filter(w => w.trim());
    if (!form.patient_name || !form.species || !form.service || wounds.length === 0) {
      toast.error("Please fill in patient name, species, service, and at least one wound location.");
      return;
    }

    // Check for existing wound cases with same patient ID
    if (form.patient_case_number) {
      setSaving(true);
      try {
        const found = await base44.entities.WoundCase.filter({ patient_case_number: form.patient_case_number });
        if (found.length > 0) {
          setExistingCases(found);
          setSaving(false);
          return;
        }
      } finally {
        setSaving(false);
      }
    }

    await doCreate();
  };

  const doCreate = async () => {
    const wounds = form.wound_locations.filter(w => w.trim());
    const problems = form.problem_list.filter(p => p.trim());
    setSaving(true);
    try {
      let globalPatientId = null;
      let globalPatient = existingGlobalPatient;

      // Create or update GlobalPatient
      if (!globalPatient && form.birthdate) {
        globalPatient = await base44.entities.GlobalPatient.create({
          patient_id: form.patient_case_number || form.patient_name,
          name: form.patient_name,
          birthdate: form.birthdate,
          species: form.species,
          breed: form.breed || undefined,
          sex: form.sex || undefined,
        });
      }

      globalPatientId = globalPatient?.id;

      // Calculate age components from birthdate
      const ageComponents = form.birthdate ? calculateAgeComponents(form.birthdate) : { years: 0, months: 0, weeks: 0 };

      // Create PatientVisit for wound case
      let patientVisitId = null;
      if (globalPatientId) {
        const patientVisit = await base44.entities.PatientVisit.create({
          global_patient_id: globalPatientId,
          name: form.patient_name,
          patient_id: form.patient_case_number,
          species: form.species,
          breed: form.breed || undefined,
          sex: form.sex || undefined,
          age_years: ageComponents.years,
          age_months: ageComponents.months,
          age_weeks: ageComponents.weeks,
          weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
          patient_type: "Inpatient",
          service: form.service,
          primary_clinician: form.primary_clinician || undefined,
          problem_list: problems,
          discharge_status: "active",
          is_wound_patient: true,
        });
        patientVisitId = patientVisit.id;
      }

      // Initialize wound_statuses map
      const wound_statuses = {};
      wounds.forEach(w => { wound_statuses[w] = "active"; });

      // Create WoundCase
      const woundCase = await base44.entities.WoundCase.create({
        patient_name: form.patient_name,
        patient_case_number: form.patient_case_number || undefined,
        species: form.species,
        breed: form.breed || undefined,
        age_years: ageComponents.years,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
        sex: form.sex || undefined,
        service: form.service,
        primary_clinician: form.primary_clinician || undefined,
        problem_list: problems,
        wound_locations: wounds,
        wound_statuses,
        status: "active",
      });

      toast.success("Wound case created and patient visit synced.");
      onSuccess(woundCase);
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = "w-full px-3 py-2.5 rounded-xl border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/30 transition-colors [color-scheme:dark]";
  const labelCls = "block text-xs text-white/55 mb-1.5";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="relative glass-panel w-full sm:rounded-2xl sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl"
      >
        <div className="sticky top-0 z-10 glass-panel rounded-t-2xl px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">New Wound Case</h2>
            <p className="text-xs text-white/45 mt-0.5">Enter patient & wound details</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Patient info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Patient Name <span className="text-red-400">*</span></label>
              <input className={fieldCls} placeholder="e.g. Buddy" value={form.patient_name} onChange={e => set("patient_name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Case / Patient ID</label>
              <input className={fieldCls} placeholder="e.g. 12345678" value={form.patient_case_number} onChange={e => set("patient_case_number", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Species <span className="text-red-400">*</span></label>
              <select className={fieldCls} value={form.species} onChange={e => set("species", e.target.value)}>
                <option value="">Select…</option>
                {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Breed</label>
              <input className={fieldCls} placeholder="e.g. Labrador" value={form.breed} onChange={e => set("breed", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Sex</label>
              <select className={fieldCls} value={form.sex} onChange={e => set("sex", e.target.value)}>
                <option value="">Select…</option>
                {SEXES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Age (years)</label>
              <input type="number" className={fieldCls} placeholder="e.g. 5" value={form.age_years} onChange={e => set("age_years", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Weight (kg)</label>
              <input type="number" className={fieldCls} placeholder="e.g. 25" value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} />
            </div>
          </div>

          {/* Service + Clinician */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Service <span className="text-red-400">*</span></label>
              <select className={fieldCls} value={form.service} onChange={e => set("service", e.target.value)}>
                <option value="">Select…</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Primary Clinician</label>
              <select className={fieldCls} value={form.primary_clinician} onChange={e => set("primary_clinician", e.target.value)}>
                <option value="">Select…</option>
                {clinicianOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Wound locations */}
          <div>
            <label className={labelCls}>Wound Locations <span className="text-red-400">*</span></label>
            <div className="space-y-2">
              {form.wound_locations.map((w, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={`${fieldCls} flex-1`}
                    placeholder={`e.g. Left forelimb distal`}
                    value={w}
                    onChange={e => setWound(i, e.target.value)}
                  />
                  {form.wound_locations.length > 1 && (
                    <button type="button" onClick={() => removeWound(i)}
                      className="w-10 h-10 rounded-xl bg-white/8 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addWound}
                className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors py-1">
                <Plus className="w-3.5 h-3.5" /> Add wound location
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Initial Notes / History</label>
            <textarea className={`${fieldCls} resize-none`} rows={2} placeholder="Brief case history…" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm text-white/55 hover:text-white hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/15 hover:bg-white/22 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Creating…" : "Create Wound Case"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Existing case conflict dialog */}
      <AnimatePresence>
        {existingCases && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setExistingCases(null)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative glass-panel rounded-2xl w-full max-w-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Patient Already Has a Wound Case</h3>
                  <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                    Patient ID <span className="text-white/75 font-medium">{form.patient_case_number}</span> already has {existingCases.length} wound case{existingCases.length !== 1 ? "s" : ""}. Would you like to add wound care to an existing case, or log a brand new case?
                  </p>
                </div>
              </div>

              {/* Existing cases */}
              <div className="space-y-2 mb-4">
                {existingCases.map(c => (
                  <button key={c.id}
                    onClick={() => { window.location.href = createPageUrl(`WoundCaseDetail?id=${c.id}`); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/8 hover:bg-white/14 transition-colors text-left">
                    <div>
                      <p className="text-xs font-medium text-white">{c.patient_name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        {(c.wound_locations || []).join(", ")}
                        {c.status === "complete" && <span className="text-green-400 ml-1.5">· Healed</span>}
                        {c.status !== "complete" && <span className="text-amber-400 ml-1.5">· Active</span>}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/25" />
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setExistingCases(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                  Go Back
                </button>
                <button onClick={proceedCreate} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-white/15 hover:bg-white/22 text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Log New Case Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}