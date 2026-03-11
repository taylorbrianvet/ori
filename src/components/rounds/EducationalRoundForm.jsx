import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["Surgery", "Internal Medicine", "Emergency & Critical Care", "Neurology", "Oncology", "Dermatology", "Cardiology", "Ophthalmology", "Radiology", "Anesthesia"];
const EVENT_TYPES = ["Journal Club", "Textbook Review", "Morbidity & Mortality", "Formal Case Presentation", "Seminar", "Other"];

export default function EducationalRoundForm({ round, onClose, onSaved, staffList = [] }) {
  const [formData, setFormData] = useState(round || {
    date: "",
    department: "",
    event_type: "",
    topic: "",
    start_time: "",
    end_time: "",
    clinician: "",
    presenters_everyone: false,
    presenters: [],
    attendance_everyone: false,
    attendance: [],
    journal_assignments: [],
    approval_status: "scheduled"
  });
  const [saving, setSaving] = useState(false);

  // Get residents for current department
  const deptResidents = staffList.filter(s => s.department === formData.department && s.role === "Resident").map(s => s.first_name + " " + s.last_name);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAttendee = (name, isPresenter = false) => {
    const field = isPresenter ? "presenters" : "attendance";
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(name)
        ? prev[field].filter(n => n !== name)
        : [...prev[field], name]
    }));
  };

  const addJournalAssignment = () => {
    setFormData(prev => ({
      ...prev,
      journal_assignments: [...(prev.journal_assignments || []), { resident: "", journal_id: "", citation: "" }]
    }));
  };

  const removeJournalAssignment = (idx) => {
    setFormData(prev => ({
      ...prev,
      journal_assignments: prev.journal_assignments.filter((_, i) => i !== idx)
    }));
  };

  const updateJournalAssignment = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      journal_assignments: prev.journal_assignments.map((ja, i) => i === idx ? { ...ja, [field]: value } : ja)
    }));
  };

  const handleSave = async () => {
    if (!formData.date || !formData.event_type || !formData.department) {
      toast.error("Date, event type, and department are required");
      return;
    }

    setSaving(true);
    try {
      if (round?.id) {
        await base44.entities.EducationalRound.update(round.id, formData);
        toast.success("Round updated");
      } else {
        await base44.entities.EducationalRound.create(formData);
        toast.success("Round created");
      }
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error("Failed to save round");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{round?.id ? "Edit Round" : "Add New Round"}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-white/70">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">Department *</label>
            <select
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">Event Type *</label>
            <select
              value={formData.event_type}
              onChange={(e) => handleChange("event_type", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
            >
              <option value="">Select type</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-white/70">Topic</label>
          <input
            type="text"
            value={formData.topic || ""}
            onChange={(e) => handleChange("topic", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
            placeholder="Topic or description"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">Start Time</label>
            <input type="time" value={formData.start_time || ""} onChange={(e) => handleChange("start_time", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">End Time</label>
            <input type="time" value={formData.end_time || ""} onChange={(e) => handleChange("end_time", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">Clinician</label>
            <input type="text" value={formData.clinician || ""} onChange={(e) => handleChange("clinician", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
          </div>
        </div>

        {/* Presenters Section */}
        <div className="border-t border-white/10 pt-4">
          <h3 className="text-xs font-semibold text-white mb-3">Presenters</h3>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={formData.presenters_everyone}
              onChange={(e) => {
                handleChange("presenters_everyone", e.target.checked);
                if (e.target.checked) handleChange("presenters", []);
              }}
              className="w-4 h-4"
            />
            <span className="text-sm text-white/70">Everyone in {formData.department || "department"}</span>
          </label>
          {!formData.presenters_everyone && deptResidents.length > 0 && (
            <div className="space-y-2 bg-white/5 p-3 rounded-lg max-h-32 overflow-y-auto">
              {deptResidents.map(name => (
                <label key={name} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.presenters.includes(name)}
                    onChange={() => toggleAttendee(name, true)}
                    className="w-3 h-3"
                  />
                  <span className="text-xs text-white/70">{name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Section */}
        <div className="border-t border-white/10 pt-4">
          <h3 className="text-xs font-semibold text-white mb-3">Expected Attendance</h3>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={formData.attendance_everyone}
              onChange={(e) => {
                handleChange("attendance_everyone", e.target.checked);
                if (e.target.checked) handleChange("attendance", []);
              }}
              className="w-4 h-4"
            />
            <span className="text-sm text-white/70">Everyone in {formData.department || "department"}</span>
          </label>
          {!formData.attendance_everyone && deptResidents.length > 0 && (
            <div className="space-y-2 bg-white/5 p-3 rounded-lg max-h-32 overflow-y-auto">
              {deptResidents.map(name => (
                <label key={name} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.attendance.includes(name)}
                    onChange={() => toggleAttendee(name, false)}
                    className="w-3 h-3"
                  />
                  <span className="text-xs text-white/70">{name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Journal Club Section */}
        {formData.event_type === "Journal Club" && (
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white">Journal Assignments</h3>
              <button onClick={addJournalAssignment} className="text-xs text-white/50 hover:text-white/70 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(formData.journal_assignments || []).map((ja, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-white/5 p-2 rounded">
                  <select
                    value={ja.resident}
                    onChange={(e) => updateJournalAssignment(idx, "resident", e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs"
                  >
                    <option value="">Select resident</option>
                    {deptResidents.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    type="text"
                    value={ja.citation}
                    onChange={(e) => updateJournalAssignment(idx, "citation", e.target.value)}
                    placeholder="Citation"
                    className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/30"
                  />
                  <button onClick={() => removeJournalAssignment(idx)} className="text-white/40 hover:text-white/70">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}