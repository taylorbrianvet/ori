import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Plus, Trash2, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

// Slot labels for display
const HO_FIELDS = ["house_officer_1","house_officer_2","house_officer_3","house_officer_4","house_officer_5","house_officer_6"];
const FAC_FIELDS = ["faculty_1","faculty_2"];

function PersonInput({ label, value, onChange, suggestions, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter(s => s.toLowerCase().includes((value||"").toLowerCase()) && s !== value);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/35 disabled:opacity-40"
          value={value || ""}
          placeholder={placeholder || label}
          disabled={disabled}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && filtered.length > 0 && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 glass-panel rounded-xl overflow-hidden max-h-40 overflow-y-auto">
          {filtered.map(s => (
            <button key={s} onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClinicDayDetailModal({ entries, date, serviceName, allStaff = [], currentUser, onClose, onSaved }) {
  const [forms, setForms] = useState(entries.map(e => ({ ...e })));
  const [saving, setSaving] = useState(false);

  const userRole = currentUser?.role; // app role (admin/user)
  // Determine if user is faculty or house officer based on Staff record
  const staffRecord = allStaff.find(s => s.email === currentUser?.email);
  const isFaculty = staffRecord?.role === "Faculty";
  const isHouseOfficer = ["Resident", "Intern"].includes(staffRecord?.role);
  const isAdmin = userRole === "admin";
  const canEditFaculty = isFaculty || isAdmin;
  const canEditHouseOfficer = isHouseOfficer || isFaculty || isAdmin;

  const facultySuggestions = allStaff.filter(s => s.role === "Faculty").map(s => `${s.first_name} ${s.last_name}`);
  const hoSuggestions = allStaff.filter(s => ["Resident","Intern"].includes(s.role)).map(s => `${s.first_name} ${s.last_name}`);

  const setField = (entryIdx, field, value) => {
    setForms(prev => prev.map((f, i) => i === entryIdx ? { ...f, [field]: value } : f));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const f of forms) {
      await base44.entities.ClinicSchedule.update(f.id, f);
    }
    toast.success("Schedule updated.");
    setSaving(false);
    onSaved?.();
  };

  const parsedDate = typeof date === "string" ? parseISO(date) : date;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="relative glass-panel w-full sm:rounded-2xl sm:max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto">

        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 glass-panel z-10">
          <div>
            <h2 className="text-sm font-semibold text-white">{serviceName}</h2>
            <p className="text-xs text-white/40 mt-0.5">{format(parsedDate, "EEEE, MMMM d, yyyy")}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {forms.map((entry, idx) => (
            <div key={entry.id || idx} className="rounded-xl bg-white/5 border border-white/10 p-4">
              {entry.team_split && (
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-3">{entry.team_split}</p>
              )}

              {/* Faculty */}
              <div className="mb-3">
                <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2">Faculty</p>
                <div className="space-y-2">
                  {FAC_FIELDS.map(field => (
                    <PersonInput key={field}
                      label={field === "faculty_1" ? "Primary Faculty" : "Secondary Faculty"}
                      value={entry[field]}
                      onChange={v => setField(idx, field, v)}
                      suggestions={facultySuggestions}
                      placeholder={field === "faculty_1" ? "Primary faculty…" : "Secondary faculty…"}
                      disabled={!canEditFaculty}
                    />
                  ))}
                </div>
              </div>

              {/* House Officers */}
              <div>
                <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2">House Officers</p>
                <div className="space-y-2">
                  {HO_FIELDS.map((field, fi) => {
                    if (!entry[field] && fi > 0 && !entry[HO_FIELDS[fi - 1]]) return null;
                    return (
                      <div key={field} className="flex items-center gap-2">
                        <PersonInput
                          label={`HO ${fi + 1}`}
                          value={entry[field]}
                          onChange={v => setField(idx, field, v)}
                          suggestions={hoSuggestions}
                          placeholder={`House officer ${fi + 1}…`}
                          disabled={!canEditHouseOfficer}
                        />
                        {entry[field] && canEditHouseOfficer && (
                          <button onClick={() => setField(idx, field, "")}
                            className="w-6 h-6 rounded flex items-center justify-center text-white/25 hover:text-red-300 transition-colors flex-shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-3">
                <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-1.5">Notes</p>
                <textarea
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs text-white placeholder:text-white/25 focus:outline-none resize-none"
                  placeholder="Optional notes…"
                  value={entry.notes || ""}
                  onChange={e => setField(idx, "notes", e.target.value)}
                  disabled={!canEditHouseOfficer}
                />
              </div>
            </div>
          ))}

          {(canEditFaculty || canEditHouseOfficer) && (
            <button onClick={handleSave} disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/12 hover:bg-white/18 border border-white/15 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          )}

          {!canEditFaculty && !canEditHouseOfficer && (
            <p className="text-center text-xs text-white/25 py-2">View only — editing requires Faculty, Resident, or Intern role in the directory.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}