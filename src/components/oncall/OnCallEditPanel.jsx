import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Upload, HelpCircle, AlertTriangle, Check, X } from "lucide-react";
import CsvUploadInstructions from "./CsvUploadInstructions";

const ON_CALL_SERVICES = [
"Emergency", "Critical Care", "HP TPE", "Internal Medicine", "Interventional Radiology",
"Endoscopy", "Cardiology", "Surgery", "Orthopedic Surgery", "Neurosurgery", "Neuromedicine",
"Oncology", "Ophthalmology", "Radiology", "Dermatology", "Anesthesia", "Pharmacy", "Clinical Pathology"];


// Map on-call service → staff department for filtering eligible doctors
const SERVICE_TO_DEPT = {
  "Surgery": ["Soft Tissue Surgery", "Primary Care and General Surgery"],
  "Orthopedic Surgery": ["Orthopedic Surgery"],
  "Neurosurgery": ["Neurology"],
  "Neuromedicine": ["Neurology"],
  "Internal Medicine": ["Internal Medicine"],
  "Interventional Radiology": ["Internal Medicine", "Interventional Radiology"],
  "Endoscopy": ["Internal Medicine"],
  "Emergency": ["Emergency and Critical Care"],
  "Critical Care": ["Emergency and Critical Care"],
  "HP TPE": ["Emergency and Critical Care"],
  "Cardiology": ["Cardiology"],
  "Oncology": ["Oncology"],
  "Ophthalmology": ["Ophthalmology"],
  "Radiology": ["Radiology"],
  "Dermatology": ["Dermatology"],
  "Anesthesia": ["Anesthesia"],
  "Clinical Pathology": ["Clinical Pathology"],
  "Pharmacy": ["Hospital"]
};

function parseCsvText(text) {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  // Strip header
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      date: cols[0] || "",
      service: cols[1] || "",
      primary_name: cols[2] || "",
      secondary_name: cols[3] || "",
      tertiary_name: cols[4] || ""
    };
  });
  return rows.filter((r) => r.date && r.service && r.primary_name);
}

export default function OnCallEditPanel({ staff, currentUser }) {
  const [selectedService, setSelectedService] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDay, setEditingDay] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [conflictModal, setConflictModal] = useState(null); // {incoming, conflicts, toCreate}
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  const isAdmin = currentUser?.role === "admin";
  const staffRecord = staff?.find((s) => s.email === currentUser?.email);
  const canEdit = isAdmin || staffRecord?.is_service_admin;

  const { data: records = [] } = useQuery({
    queryKey: ["oncall-schedules"],
    queryFn: () => base44.entities.OnCallSchedule.list("-date", 2000)
  });

  const { data: studentSchedules = [] } = useQuery({
    queryKey: ["student-on-call-schedules"],
    queryFn: () => base44.entities.StudentOnCallSchedule.list()
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ record, existingId }) => {
      if (existingId) return base44.entities.OnCallSchedule.update(existingId, record);
      return base44.entities.OnCallSchedule.create(record);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oncall-schedules"] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OnCallSchedule.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oncall-schedules"] })
  });

  // Eligible doctors for a service
  const eligibleDepts = selectedService ? SERVICE_TO_DEPT[selectedService] || [] : [];
  const eligibleDoctors = staff.filter((s) =>
  eligibleDepts.includes(s.department) && ["Faculty", "Resident", "Intern"].includes(s.role)
  );

  const recordMap = {};
  records.forEach((r) => {
    if (r.service === selectedService) recordMap[r.date] = r;
  });

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  const editingRecord = editingDay ? recordMap[editingDay] : null;
  const [editForm, setEditForm] = useState({ primary: "", secondary: "", tertiary: "" });

  const openEdit = (dayKey) => {
    const rec = recordMap[dayKey];
    setEditForm({
      primary: rec?.primary_name || "",
      secondary: rec?.secondary_name || "",
      tertiary: rec?.tertiary_name || ""
    });
    setEditingDay(dayKey);
  };

  const saveEdit = async () => {
    if (!editForm.primary) return;
    const primaryStaff = staff.find((s) => `${s.first_name} ${s.last_name}` === editForm.primary);
    const secondaryStaff = staff.find((s) => `${s.first_name} ${s.last_name}` === editForm.secondary);
    const tertiaryStaff = staff.find((s) => `${s.first_name} ${s.last_name}` === editForm.tertiary);

    const record = {
      date: editingDay,
      service: selectedService,
      primary_name: editForm.primary,
      primary_role: primaryStaff ? `${primaryStaff.role} - ${primaryStaff.service || primaryStaff.department}` : "",
      primary_phone: primaryStaff?.phone || "",
      primary_email: primaryStaff?.email || "",
      secondary_name: editForm.secondary || "",
      secondary_role: secondaryStaff ? `${secondaryStaff.role} - ${secondaryStaff.service || secondaryStaff.department}` : "",
      secondary_phone: secondaryStaff?.phone || "",
      secondary_email: secondaryStaff?.email || "",
      tertiary_name: editForm.tertiary || "",
      tertiary_role: tertiaryStaff ? `${tertiaryStaff.role} - ${tertiaryStaff.service || tertiaryStaff.department}` : "",
      tertiary_phone: tertiaryStaff?.phone || "",
      tertiary_email: tertiaryStaff?.email || ""
    };

    await upsertMutation.mutateAsync({ record, existingId: editingRecord?.id });
    setEditingDay(null);
  };

  const handleCsvFile = async (file) => {
    setUploading(true);
    const text = await file.text();
    const incoming = parseCsvText(text);
    if (incoming.length === 0) {setUploading(false);return;}

    // Enrich with staff info
    const enriched = incoming.map((row) => {
      const p = staff.find((s) => `${s.first_name} ${s.last_name}` === row.primary_name);
      const sec = staff.find((s) => `${s.first_name} ${s.last_name}` === row.secondary_name);
      const ter = staff.find((s) => `${s.first_name} ${s.last_name}` === row.tertiary_name);
      return {
        date: row.date, service: row.service,
        primary_name: row.primary_name,
        primary_role: p ? `${p.role} - ${p.service || p.department}` : "",
        primary_phone: p?.phone || "", primary_email: p?.email || "",
        secondary_name: row.secondary_name || "",
        secondary_role: sec ? `${sec.role} - ${sec.service || sec.department}` : "",
        secondary_phone: sec?.phone || "", secondary_email: sec?.email || "",
        tertiary_name: row.tertiary_name || "",
        tertiary_role: ter ? `${ter.role} - ${ter.service || ter.department}` : "",
        tertiary_phone: ter?.phone || "", tertiary_email: ter?.email || ""
      };
    });

    // Check conflicts (same date+service already exists)
    const conflicts = enriched.filter((r) => {
      return records.some((ex) => ex.date === r.date && ex.service === r.service);
    });

    setUploading(false);
    if (conflicts.length > 0) {
      setConflictModal({ incoming: enriched, conflicts });
    } else {
      await doUpload(enriched, false);
    }
  };

  const doUpload = async (rows, override) => {
    for (const row of rows) {
      const existing = records.find((ex) => ex.date === row.date && ex.service === row.service);
      if (existing && override) {
        await base44.entities.OnCallSchedule.update(existing.id, row);
      } else if (!existing) {
        await base44.entities.OnCallSchedule.create(row);
      }
    }
    qc.invalidateQueries({ queryKey: ["oncall-schedules"] });
    setConflictModal(null);
  };

  if (!canEdit) return null;

  const doctorOptions = ["", ...eligibleDoctors.map((s) => `${s.first_name} ${s.last_name}`)];

  return (
    <div>
      {/* Service selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {ON_CALL_SERVICES.map((svc) =>
        <button
          key={svc}
          onClick={() => {setSelectedService(svc === selectedService ? null : svc);setEditingDay(null);}}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedService === svc ? "bg-white/20 text-white" : "bg-white/7 text-white/45 hover:bg-white/12 hover:text-white/70"}`}>

            {svc}
          </button>
        )}
      </div>

      {selectedService &&
      <div className="glass-card p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{selectedService} Schedule</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowInstructions(true)} className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white/70 bg-white/6 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors">
                <HelpCircle className="w-3.5 h-3.5" />
                Instructions
              </button>
              <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-white bg-white/15 hover:bg-white/22 px-3 py-1.5 rounded-xl transition-colors">

                <Upload className="w-3.5 h-3.5" />
                {uploading ? "Uploading…" : "Upload CSV"}
              </button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => {if (e.target.files[0]) handleCsvFile(e.target.files[0]);e.target.value = "";}} />
            </div>
          </div>

          {/* Calendar */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-white/80">{format(currentMonth, "MMMM yyyy")}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) =>
          <div key={d} className="text-center text-[10px] font-semibold text-white/35 py-1.5">{d}</div>
          )}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, currentMonth);
            const rec = recordMap[key];
            const isEditing = editingDay === key;
            const today = isToday(day);
            const dayStudents = studentSchedules.filter(s => s.date === key && s.service === selectedService);
            return (
              <button
                key={key}
                onClick={() => inMonth && (isEditing ? setEditingDay(null) : openEdit(key))}
                className={`rounded-xl p-1 min-h-[54px] text-left transition-all duration-150 ${!inMonth ? "opacity-20 pointer-events-none" : ""} ${isEditing ? "bg-white/18 ring-2 ring-white/30" : today ? "bg-white/12 ring-1 ring-white/20" : "hover:bg-white/8"}`}>

                  <span className={`text-[11px] font-medium block text-center mb-0.5 ${today ? "text-white" : "text-white/60"}`}>{format(day, "d")}</span>
                  {rec?.primary_name && inMonth &&
                <div className="text-[8px] px-1 py-0.5 rounded-md bg-green-500/15 text-green-300 truncate leading-tight">{rec.primary_name.split(" ").slice(-1)[0]}</div>
                }
                  {rec?.secondary_name && inMonth &&
                <div className="text-[8px] px-1 py-0.5 rounded-md bg-blue-500/15 text-blue-300 truncate leading-tight mt-0.5">{rec.secondary_name.split(" ").slice(-1)[0]}</div>
                }
                  {dayStudents.length > 0 && inMonth &&
                <div className="text-[7px] px-1 py-0.5 rounded-md bg-purple-500/15 text-purple-300 truncate leading-tight mt-0.5">
                  {dayStudents.map(s => s.student_name.split(" ").slice(-1)[0]).join(", ")}
                </div>
                }
                </button>);

          })}
          </div>

          {/* Edit form */}
          {editingDay &&
        <div className="mt-4 pt-4 border-t border-white/8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-white/80">{format(new Date(editingDay + "T12:00:00"), "EEEE, MMMM d")}</p>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex items-center gap-1 text-xs text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 rounded-xl transition-colors">
                    <Check className="w-3 h-3" /> Save
                  </button>
                  {editingRecord &&
              <button onClick={async () => {await deleteMutation.mutateAsync(editingRecord.id);setEditingDay(null);}} className="flex items-center gap-1 text-xs text-red-300 bg-red-500/15 hover:bg-red-500/25 px-3 py-1.5 rounded-xl transition-colors">
                      <X className="w-3 h-3" /> Clear
                    </button>
              }
                </div>
              </div>
              {["primary", "secondary", "tertiary"].map((slot) =>
          <div key={slot} className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-white/40 w-16 capitalize shrink-0">{slot}</span>
                  <select
              value={editForm[slot]}
              onChange={(e) => setEditForm((f) => ({ ...f, [slot]: e.target.value }))} className="bg-white/8 text-white/85 px-3 py-1.5 text-xs opacity-100 rounded-xl flex-1 border border-white/12 focus:outline-none focus:border-white/25">


                    {doctorOptions.map((opt) =>
              <option key={opt} value={opt} className="bg-gray-900 text-white">{opt || "— None —"}</option>
              )}
                  </select>
                </div>
          )}
            </div>
        }
        </div>
      }

      <CsvUploadInstructions open={showInstructions} onClose={() => setShowInstructions(false)} />

      {/* Conflict modal */}
      {conflictModal &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConflictModal(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
              <h3 className="text-base font-semibold text-white">Conflicting Dates Found</h3>
            </div>
            <p className="text-sm text-white/60 mb-3">The following date/service combinations already exist:</p>
            <div className="max-h-36 overflow-y-auto space-y-1 mb-4">
              {conflictModal.conflicts.map((c, i) =>
            <div key={i} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-200">
                  <span className="font-mono">{c.date}</span>
                  <span className="text-amber-300/50">·</span>
                  <span>{c.service}</span>
                </div>
            )}
            </div>
            <p className="text-xs text-white/45 mb-4">Would you like to override these {conflictModal.conflicts.length} existing record{conflictModal.conflicts.length !== 1 ? "s" : ""}?</p>
            <div className="flex gap-2">
              <button onClick={() => doUpload(conflictModal.incoming, true)} className="flex-1 py-2 rounded-xl bg-white/15 hover:bg-white/22 text-sm font-medium text-white transition-colors">Override & Upload All</button>
              <button onClick={() => setConflictModal(null)} className="flex-1 py-2 rounded-xl bg-white/7 hover:bg-white/12 text-sm text-white/60 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      }
    </div>);

}