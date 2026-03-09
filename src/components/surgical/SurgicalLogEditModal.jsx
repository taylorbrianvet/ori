import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const SERVICES = [
  "Orthopedic Surgery",
  "Soft Tissue Surgery",
  "Interventional Radiology",
  "Ophthalmology",
  "Neurology",
  "Dentistry",
];
const SPECIES = ["Canine", "Feline", "Porcine", "Equine", "Caprine", "Bovine", "Other"];
const LATERALITY = ["N/A", "Left", "Right", "Bilateral"];

function SearchableSelect({ label, options, value, onChange, required, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <label className="block text-xs text-white/60 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div
        className="px-3 py-2.5 rounded-xl border border-white/15 bg-white/8 cursor-pointer text-sm text-white flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-white" : "text-white/35 text-xs"}>{value || placeholder}</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full rounded-xl border border-white/15 bg-[#2a0e18] backdrop-blur-xl shadow-xl max-h-56 overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#2a0e18] p-2 border-b border-white/10">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/10">
                <Search className="w-3.5 h-3.5 text-white/40" />
                <input
                  autoFocus
                  className="bg-transparent text-xs text-white placeholder:text-white/35 outline-none flex-1"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {filtered.map((opt) => (
              <div
                key={opt}
                onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); setSearch(""); }}
                className={`px-4 py-2.5 text-xs cursor-pointer transition-colors ${
                  value === opt ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {opt}
              </div>
            ))}
            {filtered.length === 0 && <div className="px-4 py-3 text-xs text-white/40">No results</div>}
          </motion.div>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };

  return (
    <div className="relative">
      <label className="block text-xs text-white/60 mb-1.5">{label}</label>
      <div
        className="min-h-[40px] px-3 py-2 rounded-xl border border-white/15 bg-white/8 cursor-pointer text-sm text-white flex flex-wrap gap-1.5"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 && <span className="text-white/35 text-xs self-center">Select…</span>}
        {selected.map((s) => (
          <span key={s} className="bg-white/15 rounded-lg px-2 py-0.5 text-xs text-white flex items-center gap-1">
            {s}
            <button type="button" className="hover:text-red-300" onClick={(e) => { e.stopPropagation(); toggle(s); }}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full rounded-xl border border-white/15 bg-[#2a0e18] backdrop-blur-xl shadow-xl max-h-56 overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#2a0e18] p-2 border-b border-white/10">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/10">
                <Search className="w-3.5 h-3.5 text-white/40" />
                <input
                  autoFocus
                  className="bg-transparent text-xs text-white placeholder:text-white/35 outline-none flex-1"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {filtered.map((opt) => (
              <div
                key={opt}
                onClick={(e) => { e.stopPropagation(); toggle(opt); }}
                className={`px-4 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  selected.includes(opt) ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{opt}</span>
                {selected.includes(opt) && <span className="text-green-400 text-[10px]">✓</span>}
              </div>
            ))}
            {filtered.length === 0 && <div className="px-4 py-3 text-xs text-white/40">No results</div>}
          </motion.div>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function SurgicalLogEditModal({ entry, onClose, staffList = [] }) {
  const queryClient = useQueryClient();

  const { data: procedureRecords = [] } = useQuery({
    queryKey: ["surgical-procedures"],
    queryFn: () => base44.entities.SurgicalProcedure.filter({ active: true }, "category", 500),
  });

  const procedureOptions = procedureRecords.map((p) => p.procedure_name);
  const residentOptions = staffList
    .filter((s) => ["Resident", "Intern"].includes(s.role))
    .map((s) => `${s.first_name} ${s.last_name}`);
  const facultyOptions = staffList
    .filter((s) => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map((s) => `${s.first_name} ${s.last_name}`);
  const surgeonOptions = staffList
    .filter((s) => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map((s) => `${s.first_name} ${s.last_name}`);

  const [form, setForm] = useState({
    case_number: entry.case_number || "",
    surgery_date: entry.surgery_date || "",
    service: entry.service || "",
    species: entry.species || "",
    laterality: entry.laterality || "",
    procedure: entry.procedure || "",
    diagnosis: entry.diagnosis || "",
    primary_surgeon: entry.primary_surgeon || "",
    emergency: entry.emergency || false,
    residents_scrubbed_in: entry.residents_scrubbed_in || [],
    faculty_present: entry.faculty_present || "",
    notes: entry.notes || "",
  });

  const [saving, setSaving] = useState(false);
  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.SurgicalLogEntry.update(entry.id, {
        ...form,
        residents_count: form.residents_scrubbed_in.length,
      });
      queryClient.invalidateQueries({ queryKey: ["surgical-logs"] });
      toast.success("Surgical log updated.");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2.5 rounded-xl border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/30 transition-colors [color-scheme:dark]";
  const labelClass = "block text-xs text-white/60 mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative glass-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 glass-panel rounded-t-2xl px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Edit Surgical Log</h2>
            <p className="text-xs text-white/50 mt-0.5">Case #{entry.case_number}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Case Number <span className="text-red-400">*</span></label>
              <input className={fieldClass} value={form.case_number} onChange={(e) => set("case_number", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Surgery Date <span className="text-red-400">*</span></label>
              <input type="date" className={fieldClass} value={form.surgery_date} onChange={(e) => set("surgery_date", e.target.value)} />
            </div>
          </div>

          <SearchableSelect label="Service" options={SERVICES} value={form.service} onChange={(v) => set("service", v)} placeholder="Select service…" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Species <span className="text-red-400">*</span></label>
              <select className={fieldClass} value={form.species} onChange={(e) => set("species", e.target.value)}>
                <option value="">Select…</option>
                {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Laterality <span className="text-red-400">*</span></label>
              <select className={fieldClass} value={form.laterality} onChange={(e) => set("laterality", e.target.value)}>
                <option value="">Select…</option>
                {LATERALITY.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <SearchableSelect label="Procedure" options={procedureOptions} value={form.procedure} onChange={(v) => set("procedure", v)} required placeholder="Search or select procedure…" />

          <div>
            <label className={labelClass}>Diagnosis</label>
            <input className={fieldClass} placeholder="e.g. Medial patellar luxation…" value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} />
          </div>

          <SearchableSelect label="Primary Surgeon" options={surgeonOptions} value={form.primary_surgeon} onChange={(v) => set("primary_surgeon", v)} placeholder="Search surgeon…" />

          <div className="flex items-center gap-3 py-1">
            <button
              type="button"
              onClick={() => set("emergency", !form.emergency)}
              className={`relative flex items-center rounded-full transition-colors ${form.emergency ? "bg-red-500" : "bg-white/15"}`}
              style={{ height: "22px", width: "40px" }}
            >
              <span className={`absolute w-4 h-4 rounded-full bg-white shadow transition-all ${form.emergency ? "left-5" : "left-0.5"}`} />
            </button>
            <span className="text-sm text-white/80">Emergency Surgery</span>
            {form.emergency && <span className="text-xs text-red-400 font-medium">EMERGENCY</span>}
          </div>

          <MultiSelectDropdown
            label="Residents Scrubbed In"
            options={residentOptions.length > 0 ? residentOptions : ["No residents found"]}
            selected={form.residents_scrubbed_in}
            onChange={(v) => set("residents_scrubbed_in", v)}
          />

          <SearchableSelect label="Faculty Present" options={facultyOptions} value={form.faculty_present} onChange={(v) => set("faculty_present", v)} placeholder="Search faculty…" />

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              className={`${fieldClass} resize-none`}
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white/15 hover:bg-white/22 text-white transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}