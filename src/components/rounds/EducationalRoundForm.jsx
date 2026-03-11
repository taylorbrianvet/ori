import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["Surgery", "Internal Medicine", "Emergency & Critical Care", "Neurology", "Oncology", "Dermatology", "Cardiology", "Ophthalmology", "Radiology", "Anesthesia"];
const EVENT_TYPES = ["Journal Club", "Textbook Review", "Morbidity & Mortality", "Formal Case Presentation", "Seminar", "Other"];

export default function EducationalRoundForm({ round, onClose, onSaved, staffList = [] }) {
  const [formData, setFormData] = useState({
    date: "",
    departments: [],
    event_type: "",
    topic: "",
    start_time: "",
    end_time: "",
    clinician: "",
    presenters_everyone: false,
    presenters: [],
    attendance_everyone: false,
    attendance: [],
    faculty_present: [],
    journal_assignments: [],
    approval_status: "scheduled",
    ...round
  });
  const [saving, setSaving] = useState(false);
  const [deptDropdown, setDeptDropdown] = useState(false);

  // Get residents for selected departments
  const selectedDeptResidents = staffList
    .filter(s => (formData.departments || []).includes(s.department) && s.role === "Resident")
    .map(s => s.first_name + " " + s.last_name)
    .sort();

  // Get faculty for selected departments
  const selectedDeptFaculty = staffList
    .filter(s => (formData.departments || []).includes(s.department) && s.role === "Faculty")
    .map(s => s.first_name + " " + s.last_name)
    .sort();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDepartment = (dept) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }));
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

  const selectAllAttendees = (isPresenter = false) => {
    const field = isPresenter ? "presenters" : "attendance";
    setFormData(prev => ({
      ...prev,
      [field]: selectedDeptResidents
    }));
  };

  const clearAllAttendees = (isPresenter = false) => {
    const field = isPresenter ? "presenters" : "attendance";
    setFormData(prev => ({
      ...prev,
      [field]: []
    }));
  };

  const toggleFacultyPresent = (name) => {
    setFormData(prev => ({
      ...prev,
      faculty_present: prev.faculty_present.includes(name)
        ? prev.faculty_present.filter(n => n !== name)
        : [...prev.faculty_present, name]
    }));
  };

  const addOtherFaculty = () => {
    const name = prompt("Enter faculty name:");
    if (name && name.trim()) {
      setFormData(prev => ({
        ...prev,
        faculty_present: [...prev.faculty_present, name.trim()]
      }));
    }
  };

  const removeOtherFaculty = (name) => {
    setFormData(prev => ({
      ...prev,
      faculty_present: prev.faculty_present.filter(n => n !== name)
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

  const canApproveForLogging = formData.faculty_present && formData.faculty_present.length > 0;

  const handleSave = async () => {
    if (!formData.date || !formData.event_type || formData.departments.length === 0) {
      toast.error("Date, event type, and at least one department are required");
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

  const handleCompleteOrApprove = async (action) => {
    setSaving(true);
    try {
      await base44.entities.EducationalRound.update(round.id, { approval_status: action });
      toast.success(action === "approved" ? "Round approved for logging" : "Round completed");
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error("Failed to update round");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{round?.id ? "Edit Round" : "Add New Round"}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/50 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-white/70">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          />
        </div>

        {/* Departments Multi-Select */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-white/70">Departments * (select one or more)</label>
          <div className="relative">
            <button
              onClick={() => setDeptDropdown(!deptDropdown)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm text-left flex items-center justify-between hover:bg-white/15 transition-colors"
            >
              <span>{formData.departments.length > 0 ? formData.departments.join(", ") : "Select departments..."}</span>
              <ChevronDown className={`w-4 h-4 text-white/50 transition-transform flex-shrink-0 ${deptDropdown ? "rotate-180" : ""}`} />
            </button>
            {deptDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm z-50 max-h-48 overflow-y-auto">
                {DEPARTMENTS.map(d => (
                  <label key={d} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 cursor-pointer text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={formData.departments.includes(d)}
                      onChange={() => toggleDepartment(d)}
                      className="w-4 h-4"
                    />
                    {d}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Type & Topic */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <label className="block text-xs font-medium text-white/70">Topic</label>
            <input
              type="text"
              value={formData.topic || ""}
              onChange={(e) => handleChange("topic", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              placeholder="Topic"
            />
          </div>
        </div>

        {/* Times & Clinician */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-white/70">Start</label>
            <input type="time" value={formData.start_time || ""} onChange={(e) => handleChange("start_time", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-white/70">End</label>
            <input type="time" value={formData.end_time || ""} onChange={(e) => handleChange("end_time", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-white/70">Clinician</label>
            <input type="text" value={formData.clinician || ""} onChange={(e) => handleChange("clinician", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
          </div>
        </div>

        {/* Presenters */}
        {formData.departments.length > 0 && selectedDeptResidents.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white">Presenters</h3>
              <div className="flex gap-2">
                <button onClick={() => selectAllAttendees(true)} className="text-[10px] text-blue-400 hover:text-blue-300">
                  Select All
                </button>
                <button onClick={() => clearAllAttendees(true)} className="text-[10px] text-white/40 hover:text-white/60">
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-1 bg-white/5 p-3 rounded-lg max-h-32 overflow-y-auto">
              {selectedDeptResidents.map(name => (
                <label key={name} className="flex items-center gap-2 cursor-pointer hover:bg-white/10 -mx-3 px-3 py-1.5 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.presenters.includes(name)}
                    onChange={() => toggleAttendee(name, true)}
                    className="w-3 h-3 flex-shrink-0"
                  />
                  <span className="text-xs text-white/70">{name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Expected Attendance */}
        {formData.departments.length > 0 && selectedDeptResidents.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white">Expected Attendance</h3>
              <div className="flex gap-2">
                <button onClick={() => selectAllAttendees(false)} className="text-[10px] text-blue-400 hover:text-blue-300">
                  Select All
                </button>
                <button onClick={() => clearAllAttendees(false)} className="text-[10px] text-white/40 hover:text-white/60">
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-1 bg-white/5 p-3 rounded-lg max-h-32 overflow-y-auto">
              {selectedDeptResidents.map(name => (
                <label key={name} className="flex items-center gap-2 cursor-pointer hover:bg-white/10 -mx-3 px-3 py-1.5 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.attendance.includes(name)}
                    onChange={() => toggleAttendee(name, false)}
                    className="w-3 h-3 flex-shrink-0"
                  />
                  <span className="text-xs text-white/70">{name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Faculty Present */}
        {formData.departments.length > 0 && selectedDeptFaculty.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-xs font-semibold text-white mb-2">Faculty Present</h3>
            <div className="space-y-1 bg-white/5 p-3 rounded-lg mb-2 max-h-32 overflow-y-auto">
              {selectedDeptFaculty.map(name => (
                <label key={name} className="flex items-center gap-2 cursor-pointer hover:bg-white/10 -mx-3 px-3 py-1.5 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.faculty_present.includes(name)}
                    onChange={() => toggleFacultyPresent(name)}
                    className="w-3 h-3 flex-shrink-0"
                  />
                  <span className="text-xs text-white/70">{name}</span>
                </label>
              ))}
            </div>
            <button
              onClick={addOtherFaculty}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Other Faculty
            </button>
            {formData.faculty_present.some(f => !selectedDeptFaculty.includes(f)) && (
              <div className="space-y-1 mt-2 bg-white/5 p-3 rounded-lg">
                {formData.faculty_present.filter(f => !selectedDeptFaculty.includes(f)).map(name => (
                  <div key={name} className="flex items-center justify-between text-xs text-white/70 bg-white/10 px-2 py-1.5 rounded">
                    <span>{name}</span>
                    <button onClick={() => removeOtherFaculty(name)} className="text-white/40 hover:text-white/70">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Journal Assignments */}
        {formData.event_type === "Journal Club" && formData.departments.length > 0 && selectedDeptResidents.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white">Journal Assignments</h3>
              <button onClick={addJournalAssignment} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
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
                    {selectedDeptResidents.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    type="text"
                    value={ja.citation}
                    onChange={(e) => updateJournalAssignment(idx, "citation", e.target.value)}
                    placeholder="Citation"
                    className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/30"
                  />
                  <button onClick={() => removeJournalAssignment(idx)} className="text-white/40 hover:text-white/70 flex-shrink-0">
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
          {round?.id && round.approval_status === "scheduled" && (
            <button
              onClick={() => handleCompleteOrApprove("completed")}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Complete
            </button>
          )}
          {round?.id && round.approval_status === "scheduled" && canApproveForLogging && (
            <button
              onClick={() => handleCompleteOrApprove("approved")}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {!round?.id && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}