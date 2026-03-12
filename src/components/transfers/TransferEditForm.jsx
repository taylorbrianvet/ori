import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { X, Loader2, Plus } from "lucide-react";

const SERVICES = [
  "Cardiology", "Dermatology",
  "Emergency", "Critical Care", "Internal Medicine", "Interventional Radiology",
  "Neurology", "Oncology",
  "Ophthalmology", "Orthopedic Surgery", "Primary Care",
  "Soft Tissue Surgery"
];
const SPECIES = ["Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];
const SEX_OPTIONS = ["MI", "MC", "FI", "FS"];
const LOCATIONS = ["ICU", "PCW", "ER", "Ward", "Recovery", "Imaging", "OR", "Other"];

export default function TransferEditForm({ transfers, onClose, onSaved }) {
   const primary = transfers[0];
   const [form, setForm] = useState({
     patient_name: primary.patient_name || "",
     patient_id: primary.patient_id || "",
     age_years: primary.age_years || "",
     age_months: primary.age_months || "",
     age_weeks: primary.age_weeks || "",
     sex: primary.sex || "",
     species: primary.species || "",
     breed: primary.breed || "",
     location: primary.location || "",
     problem_list: primary.problem_list || [],
     requesting_service: primary.requesting_service || "",
     receiving_service: primary.receiving_service || "",
     requesting_clinician: primary.requesting_clinician || "",
     estimate: primary.estimate || "",
     notes: primary.notes || "",
     already_transferred: primary.already_transferred || false,
   });
   const [problemInput, setProblemInput] = useState("");
   const [saving, setSaving] = useState(false);

   // If patient came from GlobalPatient, lock demographic fields
   const isFromGlobalPatient = !!primary.global_patient_id;

   const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addProblem = () => {
    const p = problemInput.trim();
    if (!p) return;
    set("problem_list", [...(form.problem_list || []), p]);
    setProblemInput("");
  };

  const removeProblem = (i) => set("problem_list", form.problem_list.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    for (const t of transfers) {
      await base44.entities.InterserviceTransfer.update(t.id, {
        patient_name: form.patient_name,
        patient_id: form.patient_id,
        age: form.age,
        sex: form.sex,
        species: form.species,
        breed: form.breed,
        location: form.location,
        problem_list: form.problem_list,
        requesting_service: form.requesting_service,
        requesting_clinician: form.requesting_clinician,
        estimate: form.estimate ? parseFloat(form.estimate) : null,
        notes: form.notes,
        already_transferred: form.already_transferred,
      });
    }
    toast.success("Transfer updated.");
    setSaving(false);
    onSaved?.();
  };

  return (
    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Edit Transfer</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient Name</label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35"
            value={form.patient_name} onChange={e => set("patient_name", e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient ID</label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35"
            value={form.patient_id} onChange={e => set("patient_id", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Age</label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35"
            value={form.age} onChange={e => set("age", e.target.value)} />
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
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Breed</label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35"
            value={form.breed} onChange={e => set("breed", e.target.value)} />
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
            placeholder="Add problem…"
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
                <button onClick={() => removeProblem(i)} className="text-white/30 hover:text-white/70 ml-0.5 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Transferring Service</label>
          <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.requesting_service} onChange={e => set("requesting_service", e.target.value)}>
            <option value="">Select…</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Clinician</label>
          <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35"
            value={form.requesting_clinician} onChange={e => set("requesting_clinician", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Financial Estimate</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50">$</span>
          <input type="number"
            className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35"
            value={form.estimate}
            onChange={e => set("estimate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Notes</label>
        <textarea rows={2}
          className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35 resize-none"
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => set("already_transferred", !form.already_transferred)}
          className={`w-10 h-5.5 rounded-full border transition-colors flex items-center px-0.5 ${form.already_transferred ? "bg-green-500/40 border-green-400/50" : "bg-white/8 border-white/20"}`}
        >
          <div className={`w-4 h-4 rounded-full transition-transform ${form.already_transferred ? "translate-x-4 bg-green-300" : "translate-x-0 bg-white/30"}`} />
        </div>
        <span className="text-xs text-white/55">Patient already transferred</span>
      </label>

      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs font-medium bg-white/6 border border-white/12 text-white/50 hover:text-white hover:bg-white/10 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-xs font-medium bg-white/14 hover:bg-white/20 border border-white/20 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Save Changes
        </button>
      </div>
    </div>
  );
}