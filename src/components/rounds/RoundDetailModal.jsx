import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format, parseISO, isToday, isFuture } from "date-fns";

const EVENT_TYPES = ["Journal Club", "Textbook Review", "Morbidity & Mortality", "Formal Case Presentation", "Other"];
const ALL_DEPARTMENTS = ["Surgery", "Internal Medicine", "Emergency & Critical Care", "Neurology", "Oncology", "Dermatology", "Cardiology", "Ophthalmology", "Radiology", "Anesthesia"];

// Map rounds departments to Staff department values for permission checks
const DEPT_MAP = {
  "Surgery": ["Orthopedic Surgery", "Primary Care and General Surgery", "Soft Tissue Surgery"],
  "Internal Medicine": ["Internal Medicine"],
  "Emergency & Critical Care": ["Emergency and Critical Care"],
  "Neurology": ["Neurology"],
  "Oncology": ["Oncology"],
  "Dermatology": ["Dermatology"],
  "Cardiology": ["Cardiology"],
  "Ophthalmology": ["Ophthalmology"],
  "Radiology": ["Radiology", "Interventional Radiology"],
  "Anesthesia": ["Anesthesia"],
};

function PersonSelect({ value, onChange, people, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const filtered = people.filter(s => s.toLowerCase().includes((value || "").toLowerCase()) && s !== value);

  return (
    <div className="relative">
      <input
        className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/35 disabled:opacity-40"
        value={value || ""}
        placeholder={placeholder || "Select person…"}
        disabled={disabled}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl overflow-hidden max-h-44 overflow-y-auto"
          style={{ background: "rgba(30, 10, 18, 0.97)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
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

function JournalAssignmentRow({ assignment, index, residents, onUpdate, onRemove, onUploadPDF }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") return toast.error("PDF files only");
    setUploading(true);
    await onUploadPDF(index, file, assignment.resident);
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/8 last:border-0">
      <select
        className="flex-1 bg-black/30 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
        value={assignment.resident}
        onChange={e => onUpdate(index, "resident", e.target.value)}
      >
        <option value="">Select resident…</option>
        {residents.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <input
        placeholder="Citation / topic"
        className="flex-1 bg-black/30 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none"
        value={assignment.citation || ""}
        onChange={e => onUpdate(index, "citation", e.target.value)}
      />
      <label className={`flex-shrink-0 cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${assignment.journal_id ? "bg-green-500/20 border-green-400/30 text-green-300" : "bg-white/6 border-white/15 text-white/40 hover:bg-white/12"}`}>
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : assignment.journal_id ? <CheckCircle className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
        <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} disabled={uploading} />
      </label>
      <button onClick={() => onRemove(index)} className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/6 border border-white/15 hover:bg-red-500/20 text-white/30 hover:text-red-300 flex items-center justify-center transition-colors">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function RoundDetailModal({ round, onClose, onSaved, staffList = [] }) {
  const [form, setForm] = useState({
    ...round,
    departments: round.departments?.length > 0 ? round.departments : (round.department ? [round.department] : []),
  });
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pendingPDFUploads, setPendingPDFUploads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const date = parseISO(round.date);
  const canApprove = isToday(date);
  const isFutureRound = isFuture(date) && !isToday(date);
  const isSeminar = round.is_seminar || round.event_type === "Seminar";

  // Only faculty, residents, interns from staffList
  const eligibleStaff = staffList.filter(s => ["Faculty", "Resident", "Intern"].includes(s.role));
  const allEligibleNames = eligibleStaff.map(s => `${s.first_name} ${s.last_name}`);
  const residentInternNames = eligibleStaff.filter(s => ["Resident", "Intern"].includes(s.role)).map(s => `${s.first_name} ${s.last_name}`);

  // Determine if current user can edit
  const staffRecord = eligibleStaff.find(s => s.email === currentUser?.email);
  const isAdmin = currentUser?.role === "admin";

  let canEdit = isAdmin;
  if (!canEdit && staffRecord) {
    if (isSeminar) {
      // Anyone who is faculty/resident/intern can edit seminars
      canEdit = true;
    } else {
      // For regular rounds: user's department must match one of the round's departments
      const roundDepts = form.departments?.length > 0 ? form.departments : (form.department ? [form.department] : []);
      canEdit = roundDepts.some(rd => {
        const mappedDepts = DEPT_MAP[rd] || [rd];
        return mappedDepts.includes(staffRecord.department) || staffRecord.department === rd;
      });
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Journal assignments
  const assignments = form.journal_assignments || [];
  const addAssignment = () => set("journal_assignments", [...assignments, { resident: "", citation: "", journal_id: "" }]);
  const updateAssignment = (i, k, v) => set("journal_assignments", assignments.map((a, idx) => idx === i ? { ...a, [k]: v } : a));
  const removeAssignment = (i) => set("journal_assignments", assignments.filter((_, idx) => idx !== i));

  const handlePDFUpload = async (index, file, resident) => {
    setPendingPDFUploads(prev => [...prev.filter(p => p.index !== index), { index, file, resident }]);
    updateAssignment(index, "citation", form.journal_assignments[index]?.citation || file.name.replace(".pdf", ""));
    toast.success("PDF queued — will be uploaded to Journal Club on save.");
  };

  const handleSave = async (newStatus) => {
    setSaving(true);
    let updatedAssignments = [...(form.journal_assignments || [])];
    for (const pending of pendingPDFUploads) {
      try {
        const user = await base44.auth.me();
        const { file_url } = await base44.integrations.Core.UploadFile({ file: pending.file });
        const journal = await base44.entities.Journal.create({
          title: updatedAssignments[pending.index]?.citation || pending.file.name.replace(".pdf", ""),
          uploaded_by: user.email,
          uploaded_by_name: user.full_name,
          pdf_url: file_url,
          favorited_by: [],
          ai_processed: false,
        });
        updatedAssignments[pending.index] = { ...updatedAssignments[pending.index], journal_id: journal.id };
      } catch (err) {
        toast.error("PDF upload failed: " + err.message);
      }
    }
    await base44.entities.EducationalRound.update(round.id, {
      ...form,
      journal_assignments: updatedAssignments,
      status: newStatus || form.status,
    });
    toast.success(newStatus === "approved" ? "Rounds approved!" : newStatus === "cancelled" ? "Rounds cancelled." : "Saved.");
    setSaving(false);
    onSaved?.();
    onClose();
  };

  const isJournalClub = form.event_type === "Journal Club";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="relative glass-panel w-full sm:rounded-2xl sm:max-w-xl rounded-t-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 glass-panel z-10">
          <div>
            <h2 className="text-sm font-semibold text-white">{format(date, "EEEE, MMMM d, yyyy")}</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {isSeminar ? "Seminar" : (form.departments || []).join(", ")} · {form.start_time || "07:00"} – {form.end_time || "08:00"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSeminar && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">Seminar</span>}
            {form.status === "approved" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-400/30">Approved</span>}
            {form.status === "cancelled" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-400/30">Cancelled</span>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* Departments — hidden for seminars */}
          {!isSeminar && (
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">Department(s)</label>
              <div className="flex flex-wrap gap-2">
                {ALL_DEPARTMENTS.map(d => {
                  const selected = (form.departments || []).includes(d);
                  return (
                    <button key={d} disabled={!canEdit} onClick={() => {
                      const curr = form.departments || [];
                      set("departments", selected ? curr.filter(x => x !== d) : [...curr, d]);
                    }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${selected ? "bg-white/18 border-white/30 text-white" : "bg-white/4 border-white/12 text-white/45 hover:bg-white/10"}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Event type — hidden for seminars */}
          {!isSeminar && (
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">Event Type</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(t => (
                  <button key={t} disabled={!canEdit} onClick={() => set("event_type", t)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${form.event_type === t ? "bg-white/18 border-white/30 text-white" : "bg-white/4 border-white/12 text-white/45 hover:bg-white/10"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topic */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">Topic</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/35 disabled:opacity-40"
              placeholder={isJournalClub ? 'e.g. "Journal club on liver tumors"' : "Topic…"}
              value={form.topic || ""}
              disabled={!canEdit}
              onChange={e => set("topic", e.target.value)}
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">Start Time</label>
              <input type="time" disabled={!canEdit}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35 disabled:opacity-40"
                value={form.start_time || "07:00"} onChange={e => set("start_time", e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">End Time</label>
              <input type="time" disabled={!canEdit}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white focus:outline-none focus:border-white/35 disabled:opacity-40"
                value={form.end_time || "08:00"} onChange={e => set("end_time", e.target.value)} />
            </div>
          </div>

          {/* Clinician Leading — any eligible staff for seminars, same for rounds */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">Clinician Leading</label>
            <PersonSelect
              value={form.clinician}
              onChange={v => set("clinician", v)}
              people={allEligibleNames}
              placeholder="Search faculty, resident, or intern…"
              disabled={!canEdit}
            />
          </div>

          {/* Presenters — only for non-seminars */}
          {!isSeminar && (
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">Presenters</label>
              <button disabled={!canEdit} onClick={() => set("presenters", [])}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors mb-2 mr-2 disabled:opacity-40 ${(!form.presenters || form.presenters.length === 0) ? "bg-white/18 border-white/30 text-white" : "bg-white/4 border-white/12 text-white/45 hover:bg-white/10"}`}>
                Everyone
              </button>
              <div className="flex flex-wrap gap-1.5">
                {allEligibleNames.map(r => (
                  <button key={r} disabled={!canEdit} onClick={() => {
                    const arr = form.presenters || [];
                    set("presenters", arr.includes(r) ? arr.filter(x => x !== r) : [...arr, r]);
                  }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 ${(form.presenters || []).includes(r) ? "bg-white/18 border-white/30 text-white" : "bg-white/4 border-white/12 text-white/45 hover:bg-white/10"}`}>
                    {r.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Journal Assignments (only for Journal Club) */}
          {isJournalClub && !isSeminar && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Article Assignments</label>
                {canEdit && (
                  <button onClick={addAssignment} className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white transition-colors">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                {assignments.length === 0 ? (
                  <p className="text-xs text-white/25 text-center py-2">No assignments yet. Click "Add" to assign articles.</p>
                ) : (
                  assignments.map((a, i) => (
                    <JournalAssignmentRow key={i} assignment={a} index={i}
                      residents={residentInternNames}
                      onUpdate={updateAssignment}
                      onRemove={removeAssignment}
                      onUploadPDF={handlePDFUpload}
                    />
                  ))
                )}
              </div>
              <p className="text-[10px] text-white/25 mt-1.5">Upload PDFs to automatically add them to Journal Club on save.</p>
            </div>
          )}

          {/* Copyable log string */}
          {form.status === "approved" && (
            <div className="rounded-xl bg-black/25 border border-white/10 p-3">
              <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-1.5">Educational Log Entry</p>
              <p className="text-xs text-white/70 font-mono leading-relaxed select-all">
                {format(date, "MM/dd/yyyy")} · {form.event_type}{form.topic ? ` · ${form.topic}` : ""}
                {(form.presenters || []).length > 0 ? `\nPresenters: ${form.presenters.join(", ")}` : ""}
              </p>
            </div>
          )}

          {!canEdit && (
            <p className="text-center text-xs text-white/25 py-1">
              {isSeminar
                ? "View only — you must be faculty, resident, or intern to edit."
                : "View only — editing is restricted to members of the listed department(s)."}
            </p>
          )}

          {/* Action buttons */}
          {canEdit && form.status !== "cancelled" && (
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmCancel(true)}
                className="px-4 py-2.5 rounded-xl text-xs text-red-300/70 hover:text-red-300 hover:bg-red-500/10 border border-red-400/20 transition-colors">
                Cancel Rounds
              </button>
              <button onClick={() => handleSave()} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-xs text-white/70 hover:text-white bg-white/8 hover:bg-white/14 border border-white/12 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
              {canApprove && form.status !== "approved" && (
                <button onClick={() => handleSave("approved")} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
              )}
              {isFutureRound && (
                <p className="flex-1 text-center text-[10px] text-white/25 self-center">Approval available on {format(date, "MMM d")}</p>
              )}
            </div>
          )}
          {canEdit && form.status === "cancelled" && (
            <button onClick={() => handleSave("scheduled")} className="w-full py-2.5 rounded-xl text-xs text-white/50 hover:text-white bg-white/6 hover:bg-white/12 border border-white/12 transition-colors">
              Restore Rounds
            </button>
          )}
        </div>
      </motion.div>

      {/* Confirm cancel dialog */}
      <AnimatePresence>
        {confirmCancel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmCancel(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative glass-panel rounded-2xl p-6 max-w-sm w-full text-center">
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">Cancel Rounds?</h3>
              <p className="text-xs text-white/45 mb-4">This will mark the rounds as cancelled for {format(date, "MMMM d")}.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmCancel(false)} className="flex-1 py-2.5 rounded-xl text-xs text-white/50 hover:bg-white/10 transition-colors">Keep</button>
                <button onClick={() => { setConfirmCancel(false); handleSave("cancelled"); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 transition-colors">
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}