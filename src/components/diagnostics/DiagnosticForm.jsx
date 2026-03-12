import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

const CLINICAL_SERVICES = [
  "Cardiology", "Dermatology", "Emergency", "Critical Care", "Internal Medicine",
  "Neurology", "Oncology", "Ophthalmology", "Orthopedic Surgery", "Primary Care", "Soft Tissue Surgery"
];

const PATHOLOGY_TYPES = [
  "CBC", "Chemistry", "Mini Chemistry Panel", "PT/PTT", "TCM",
  "Urinalysis", "Urine Culture", "Aerobic Culture", "Fungal Culture",
  "Histopathology", "Cytology", "Culture (General)", "NOVA", "Other Pathology"
];

const IMAGING_TYPES = [
  "Radiograph", "Abdominal Ultrasound", "CT", "MRI", "Fluoroscopy", "Other Imaging"
];

const SAMPLE_TYPES = ["Blood", "Urine", "Tissue", "Fluid", "Swab", "Aspirate", "Other"];

// Sample types that require a location field
const LOCATION_SAMPLE_TYPES = ["Tissue", "Fluid", "Swab", "Aspirate"];

export default function DiagnosticForm({ staffList = [], prefillService = "", prefillPatient = null, onSaved, onCancel }) {
  const [form, setForm] = useState({
    patient_id: prefillPatient?.patient_id || "",
    patient_name: prefillPatient?.patient_name || "",
    request_category: "",
    diagnostic_type: "",
    sample_type: "",
    location: "",
    requesting_clinician: "",
    requesting_service: prefillService || "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const isPathology = form.request_category === "Pathology";
  const isImaging = form.request_category === "Imaging";
  const needsLocation = isImaging || (isPathology && LOCATION_SAMPLE_TYPES.includes(form.sample_type));
  const diagnosticTypes = isPathology ? PATHOLOGY_TYPES : isImaging ? IMAGING_TYPES : [];

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Reset downstream fields on category change
      if (field === "request_category") {
        next.diagnostic_type = "";
        next.sample_type = "";
        next.location = "";
      }
      if (field === "sample_type" && !LOCATION_SAMPLE_TYPES.includes(value)) {
        next.location = "";
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.patient_id || !form.patient_name || !form.request_category || !form.diagnostic_type || !form.requesting_clinician || !form.requesting_service) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (isPathology && !form.sample_type) {
      toast.error("Please select a sample type");
      return;
    }
    setSaving(true);
    await base44.entities.Diagnostic.create({
      ...form,
      status: "submitted",
      owner_communicated: false,
      submission_time: new Date().toISOString(),
    });
    toast.success("Diagnostic request submitted");
    onSaved();
    setSaving(false);
  };

  const clinicians = staffList
    .filter(s => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map(s => `${s.first_name} ${s.last_name}`);

  const inputCls = "w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/40";
  const selectCls = "w-full px-3 py-2 rounded-xl bg-black/70 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40";
  const labelCls = "block text-[10px] text-white/45 uppercase tracking-wider font-semibold mb-1.5";

  return (
    <div className="glass-card p-5 mb-4 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-white">New Diagnostic Request</h2>
        <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Patient ID <span className="text-red-400">*</span></label>
          <input
            className={`${inputCls} ${prefillPatient ? "opacity-60 cursor-not-allowed" : ""}`}
            placeholder="e.g. 123456"
            value={form.patient_id}
            onChange={e => !prefillPatient && handleChange("patient_id", e.target.value)}
            readOnly={!!prefillPatient}
          />
        </div>
        <div>
          <label className={labelCls}>Patient Name <span className="text-red-400">*</span></label>
          <input
            className={`${inputCls} ${prefillPatient ? "opacity-60 cursor-not-allowed" : ""}`}
            placeholder="e.g. Buddy"
            value={form.patient_name}
            onChange={e => !prefillPatient && handleChange("patient_name", e.target.value)}
            readOnly={!!prefillPatient}
          />
        </div>
      </div>

      {/* Request Category */}
      <div>
        <label className={labelCls}>Request Type <span className="text-red-400">*</span></label>
        <div className="flex gap-3">
          {["Pathology", "Imaging"].map(cat => (
            <button
              key={cat}
              onClick={() => handleChange("request_category", cat)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                form.request_category === cat
                  ? "bg-white/20 border-white/40 text-white"
                  : "bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostic Type (shown once category selected) */}
      {form.request_category && (
        <div>
          <label className={labelCls}>Diagnostic Type <span className="text-red-400">*</span></label>
          <select className={selectCls} value={form.diagnostic_type} onChange={e => handleChange("diagnostic_type", e.target.value)}>
            <option value="">Select</option>
            {diagnosticTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* Sample Type (Pathology only) */}
      {isPathology && (
        <div>
          <label className={labelCls}>Sample Type <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TYPES.map(st => (
              <button
                key={st}
                onClick={() => handleChange("sample_type", st)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  form.sample_type === st
                    ? "bg-white/20 border-white/40 text-white"
                    : "bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {needsLocation && (
        <div>
          <label className={labelCls}>
            {isImaging ? "Body Region / Location" : "Sample Location"}
          </label>
          <input
            className={inputCls}
            placeholder={isImaging ? "e.g. Thorax, Left elbow, Abdomen" : "e.g. Left forelimb distal, Right stifle"}
            value={form.location}
            onChange={e => handleChange("location", e.target.value)}
          />
        </div>
      )}

      {/* Clinician + Service */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Requesting Clinician <span className="text-red-400">*</span></label>
          <input
            list="diag-clinician-list"
            className={inputCls}
            placeholder="Search or type"
            value={form.requesting_clinician}
            onChange={e => handleChange("requesting_clinician", e.target.value)}
          />
          <datalist id="diag-clinician-list">
            {clinicians.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Service <span className="text-red-400">*</span></label>
          <select className={selectCls} value={form.requesting_service} onChange={e => handleChange("requesting_service", e.target.value)}>
            <option value="">Select</option>
            {CLINICAL_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          className={`${inputCls} resize-none h-16`}
          placeholder="Additional notes..."
          value={form.notes}
          onChange={e => handleChange("notes", e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2 rounded-xl bg-white/12 hover:bg-white/18 border border-white/20 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Request
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/12 text-white/60 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}