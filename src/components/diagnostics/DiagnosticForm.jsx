import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CLINICAL_SERVICES = [
  "Cardiology", "Dermatology", "Emergency", "Critical Care", "Internal Medicine",
  "Neurology", "Oncology", "Ophthalmology", "Orthopedic Surgery", "Primary Care", "Soft Tissue Surgery"
];

const DIAGNOSTIC_TYPES = ["CBC", "Chemistry", "NOVA", "Histopathology", "Cytology", "Urinalysis", "Radiology", "Ultrasound", "CT", "MRI", "X-Ray", "Other"];
const SAMPLE_TYPES = ["Blood", "Urine", "Tissue", "Bodily Fluid", "Other"];

export default function DiagnosticForm({ staffList, onSaved, onCancel }) {
  const [form, setForm] = useState({
    patient_id: "",
    patient_name: "",
    diagnostic_type: "",
    sample_type: "",
    location: "",
    requesting_clinician: "",
    requesting_service: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.patient_id || !form.patient_name || !form.diagnostic_type || !form.sample_type || !form.requesting_clinician || !form.requesting_service) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Diagnostic.create({
        ...form,
        submission_time: new Date().toISOString(),
        sample_collected: false,
        diagnostic_complete: false
      });
      toast.success("Diagnostic request submitted");
      onSaved();
    } catch (e) {
      toast.error("Failed to submit request");
    }
    setSaving(false);
  };

  const clinicians = staffList
    .filter(s => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map(s => `${s.first_name} ${s.last_name}`);

  return (
    <div className="glass-card p-5 mb-6 space-y-4">
      <h2 className="text-sm font-semibold text-white mb-1">New Diagnostic Request</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient ID <span className="text-red-400">*</span></label>
          <input
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="e.g. 123456"
            value={form.patient_id}
            onChange={e => setForm({ ...form, patient_id: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient Name <span className="text-red-400">*</span></label>
          <input
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="e.g. Buddy"
            value={form.patient_name}
            onChange={e => setForm({ ...form, patient_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Diagnostic Type <span className="text-red-400">*</span></label>
          <select
            className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.diagnostic_type}
            onChange={e => setForm({ ...form, diagnostic_type: e.target.value })}
          >
            <option value="">Select</option>
            {DIAGNOSTIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Sample Type <span className="text-red-400">*</span></label>
          <select
            className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.sample_type}
            onChange={e => setForm({ ...form, sample_type: e.target.value })}
          >
            <option value="">Select</option>
            {SAMPLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {(form.diagnostic_type === "Histopathology" || form.diagnostic_type === "Cytology" || ["Radiology", "Ultrasound", "CT", "MRI", "X-Ray"].includes(form.diagnostic_type)) && (
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Location</label>
          <input
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="e.g. Left forelimb, Abdomen"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Requesting Clinician <span className="text-red-400">*</span></label>
          <input
            list="clinician-list"
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="Search or type"
            value={form.requesting_clinician}
            onChange={e => setForm({ ...form, requesting_clinician: e.target.value })}
          />
          <datalist id="clinician-list">
            {clinicians.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Service <span className="text-red-400">*</span></label>
          <select
            className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.requesting_service}
            onChange={e => setForm({ ...form, requesting_service: e.target.value })}
          >
            <option value="">Select</option>
            {CLINICAL_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2 rounded-xl bg-white/12 hover:bg-white/18 border border-white/20 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/12 text-white/70 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}