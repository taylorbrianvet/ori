import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

const CLINICAL_SERVICES = [
  "Cardiology", "Dermatology", "Emergency", "Critical Care", "Internal Medicine",
  "Neurology", "Oncology", "Ophthalmology", "Orthopedic Surgery", "Primary Care", "Soft Tissue Surgery"
];

export default function PharmacyEditModal({ request, staffList, onSaved, onClose }) {
  const [form, setForm] = useState({
    clinician_name: request.clinician_name || "",
    clinician_role: request.clinician_role || "",
    patient_id: request.patient_id || "",
    patient_name: request.patient_name || "",
    medication: request.medication || "",
    instructions: request.instructions || "",
    quantity: request.quantity ?? "",
    service: request.service || "",
    last_prescribed_date: request.last_prescribed_date || "",
  });
  const [saving, setSaving] = useState(false);

  const clinicians = (staffList || []).filter(s =>
    ["Faculty", "Resident", "Intern"].includes(s.role)
  ).sort((a, b) => `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`));

  const handleSubmit = async () => {
    if (!form.clinician_name || !form.patient_id || !form.patient_name || !form.medication || !form.instructions || !form.quantity || !form.service) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    await base44.entities.PharmacyRefillRequest.update(request.id, form);
    toast.success("Request updated");
    onSaved();
    setSaving(false);
  };

  const handleClinicianChange = (e) => {
    const name = e.target.value;
    const matched = clinicians.find(s => `${s.first_name} ${s.last_name}` === name);
    setForm({ ...form, clinician_name: name, clinician_role: matched?.role || form.clinician_role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-white">Edit Refill Request</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clinician dropdown */}
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Clinician <span className="text-red-400">*</span></label>
          <select
            className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
            value={form.clinician_name}
            onChange={handleClinicianChange}
          >
            <option value="">Select clinician</option>
            {clinicians.map(s => {
              const name = `${s.first_name} ${s.last_name}`;
              return <option key={s.id} value={name}>{name} ({s.role})</option>;
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient ID <span className="text-red-400">*</span></label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
              value={form.patient_id}
              onChange={e => setForm({ ...form, patient_id: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient Name <span className="text-red-400">*</span></label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
              value={form.patient_name}
              onChange={e => setForm({ ...form, patient_name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Medication <span className="text-red-400">*</span></label>
          <input
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            value={form.medication}
            onChange={e => setForm({ ...form, medication: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Instructions <span className="text-red-400">*</span></label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35 resize-none"
            value={form.instructions}
            onChange={e => setForm({ ...form, instructions: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Quantity <span className="text-red-400">*</span></label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Service <span className="text-red-400">*</span></label>
            <select
              className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
              value={form.service}
              onChange={e => setForm({ ...form, service: e.target.value })}
            >
              <option value="">Select</option>
              {CLINICAL_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Last Prescribed Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35"
            value={form.last_prescribed_date}
            onChange={e => setForm({ ...form, last_prescribed_date: e.target.value })}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 rounded-xl bg-white/12 hover:bg-white/18 border border-white/20 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/12 text-white/70 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}