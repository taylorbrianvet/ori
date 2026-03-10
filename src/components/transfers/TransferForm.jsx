import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";

const SERVICES = [
  "Anesthesia", "Cardiology", "Clinical Pathology", "Dermatology",
  "Emergency", "Critical Care", "Internal Medicine", "Interventional Radiology",
  "Neurology", "Nutrition", "Medical Oncology", "Radiation Oncology",
  "Ophthalmology", "Orthopedic Surgery", "Primary Care", "General Surgery",
  "Radiology", "Soft Tissue Surgery"
];

const SPECIES = ["Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];
const SEX_OPTIONS = ["MI", "MC", "FI", "FS"];
const SEX_LABELS = { MI: "MI – Male Intact", MC: "MC – Male Castrated", FI: "FI – Female Intact", FS: "FS – Female Spayed" };
const LOCATIONS = ["ICU", "PCW", "ER", "Ward", "Recovery", "Imaging", "OR", "Other"];

const EMPTY = {
  patient_name: "", patient_id: "", age: "", sex: "", species: "", breed: "",
  location: "", problem_list: [], requesting_service: "", receiving_service: "",
  requesting_clinician: "", notes: "", already_transferred: false,
};

export default function TransferForm({ staffList = [], onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [problemInput, setProblemInput] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addProblem = () => {
    const p = problemInput.trim();
    if (!p) return;
    set("problem_list", [...(form.problem_list || []), p]);
    setProblemInput("");
  };

  const removeProblem = (i) => set("problem_list", form.problem_list.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.patient_name || !form.patient_id || !form.breed || !form.requesting_service || !form.receiving_service || !form.requesting_clinician) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    // Write to patient table if patient_id not found
    const existing = await base44.entities.Patient.filter({ patient_id: form.patient_id });
    if (!existing || existing.length === 0) {
      await base44.entities.Patient.create({
        name: form.patient_name,
        patient_id: form.patient_id,
        species: form.species,
        breed: form.breed,
        sex: form.sex === "MI" ? "Male Intact" : form.sex === "MC" ? "Male Neutered" : form.sex === "FI" ? "Female Intact" : "Female Spayed",
        problem_list: form.problem_list,
        service: form.requesting_service,
        patient_type: "Inpatient",
      });
    }
    await base44.entities.InterserviceTransfer.create(form);
    toast.success("Transfer submitted.");
    setForm(EMPTY);
    setProblemInput("");
    setSaving(false);
    onSaved?.();
  };

  const eligibleClinicians = staffList
    .filter(s => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map(s => `${s.first_name} ${s.last_name}`);

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white mb-1">New Transfer</h2>

      {/* Patient info row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient Name <span className="text-red-400">*</span></label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="e.g. Buddy" value={form.patient_name} onChange={e => set("patient_name", e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient ID <span className="text-red-400">*</span></label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="e.g. 123456" value={form.patient_id} onChange={e => set("patient_id", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Age</label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="e.g. 4y" value={form.age} onChange={e => set("age", e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Sex</label>
          <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.sex} onChange={e => set("sex", e.target.value)}>
            <option value="">—</option>
            {SEX_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Species</label>
          <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.species} onChange={e => set("species", e.target.value)}>
            <option value="">—</option>
            {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Breed <span className="text-red-400">*</span></label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="e.g. Golden Retriever" value={form.breed} onChange={e => set("breed", e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Location</label>
          <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.location} onChange={e => set("location", e.target.value)}>
            <option value="">—</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Problem list */}
      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Problem List</label>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="Add problem / diagnosis…"
            value={problemInput}
            onChange={e => setProblemInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addProblem()}
          />
          <button onClick={addProblem} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/16 text-white/70 hover:text-white transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {(form.problem_list || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.problem_list.map((p, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/75">
                {p}
                <button onClick={() => removeProblem(i)} className="text-white/30 hover:text-white/70 transition-colors ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Services */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Requesting Service <span className="text-red-400">*</span></label>
          <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.requesting_service} onChange={e => set("requesting_service", e.target.value)}>
            <option value="">Select…</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Receiving Service <span className="text-red-400">*</span></label>
          <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.receiving_service} onChange={e => set("receiving_service", e.target.value)}>
            <option value="">Select…</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Clinician */}
      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Requesting Clinician <span className="text-red-400">*</span></label>
        <input
          list="clinician-list"
          className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
          placeholder="Search or type name…"
          value={form.requesting_clinician}
          onChange={e => set("requesting_clinician", e.target.value)}
        />
        <datalist id="clinician-list">
          {eligibleClinicians.map(n => <option key={n} value={n} />)}
        </datalist>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Notes</label>
        <textarea
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35 resize-none"
          placeholder="Additional notes…"
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
        />
      </div>

      {/* Already transferred */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => set("already_transferred", !form.already_transferred)}
          className={`w-10 h-5.5 rounded-full border transition-colors flex items-center px-0.5 ${form.already_transferred ? "bg-green-500/40 border-green-400/50" : "bg-white/8 border-white/20"}`}
        >
          <div className={`w-4 h-4 rounded-full transition-transform ${form.already_transferred ? "translate-x-4 bg-green-300" : "translate-x-0 bg-white/30"}`} />
        </div>
        <span className="text-xs text-white/55">Patient already transferred</span>
      </label>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/12 hover:bg-white/18 border border-white/20 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Submit Transfer
      </button>
    </div>
  );
}