import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Calendar as CalendarIcon, Clock, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const APPOINTMENT_TYPES = ["Surgery", "Recheck", "Consult", "Tech Appointment", "General Appointment", "Other"];
const SPECIES = ["Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];

export default function NewAppointmentModal({ selectedService, defaultDate, onSaved, onClose }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null); // null = none, "new" = create new
  const [saving, setSaving] = useState(false);
  const [clinicians, setClinicians] = useState([]);
  const searchRef = useRef(null);

  const defaultDateStr = defaultDate ? `${format(defaultDate, "yyyy-MM-dd")}T08:00` : "";

  const [form, setForm] = useState({
    name: "",
    species: "Canine",
    breed: "",
    sex: "Female Spayed",
    age_years: "",
    weight_kg: "",
    appointment_datetime: defaultDateStr,
    appointment_reason: "General Appointment",
    appointment_clinician: "",
    reason_for_visit: "",
  });
  const [selectedDate, setSelectedDate] = useState(defaultDate || new Date());
  const [selectedTime, setSelectedTime] = useState("08:00");

  // Derived state
  const foundPatient = selectedPatient && selectedPatient !== "new" ? selectedPatient : null;
  const showFullForm = selectedPatient === "new";
  const patientId = foundPatient?.patient_id || (selectedPatient === "new" ? query : "");

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleDateTimeChange = (date, time) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const datetimeStr = `${dateStr}T${time}`;
    set("appointment_datetime", datetimeStr);
    setSelectedDate(date);
    setSelectedTime(time);
  };

  // Fetch clinicians on mount
  useEffect(() => {
    const fetchClinicians = async () => {
      try {
        const staff = await base44.entities.Staff.list();
        const filtered = staff.filter(s => ["Faculty", "Resident", "Intern"].includes(s.role));
        const names = filtered.map(s => `${s.first_name} ${s.last_name}`).sort();
        setClinicians([...new Set(names)]);
      } catch (err) {
        console.error("Failed to fetch clinicians:", err);
      }
    };
    fetchClinicians();
  }, []);

  // Live search as user types
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const doSearch = async () => {
      setSearching(true);
      try {
        const all = await base44.entities.GlobalPatient.list();
        const q = query.trim().toLowerCase();
        const matches = all.filter(p =>
          (p.patient_id || "").toLowerCase().includes(q) ||
          (p.name || "").toLowerCase().includes(q)
        ).slice(0, 8);
        setSearchResults(matches);
        setShowDropdown(true);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(doSearch, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectExistingPatient = (gp) => {
    setSelectedPatient(gp);
    setQuery(`${gp.patient_id} — ${gp.name}`);
    setShowDropdown(false);
    set("name", gp.name || "");
    set("species", gp.species || "Canine");
    set("breed", gp.breed || "");
    set("sex", gp.sex || "Female Spayed");
  };

  const selectNewPatient = () => {
    setSelectedPatient("new");
    setShowDropdown(false);
    set("name", "");
  };

  const clearSelection = () => {
    setSelectedPatient(null);
    setQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    set("name", "");
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.appointment_datetime) return;
    setSaving(true);

    try {
      let globalPatientId = foundPatient?.id;

      if (!globalPatientId && patientId.trim()) {
        const existing = await base44.entities.GlobalPatient.filter({ 
          patient_id: patientId.trim() 
        });

        if (existing?.length > 0) {
          globalPatientId = existing[0].id;
        } else {
          const gp = await base44.entities.GlobalPatient.create({
            name: form.name.trim(),
            patient_id: patientId.trim(),
            species: form.species,
            breed: form.breed.trim() || undefined,
            sex: form.sex || undefined,
          });
          globalPatientId = gp.id;
        }
      }

      await base44.entities.PatientVisit.create({
        name: form.name.trim(),
        patient_id: patientId.trim() || undefined,
        global_patient_id: globalPatientId || undefined,
        species: form.species,
        breed: form.breed.trim() || undefined,
        sex: form.sex || undefined,
        age_years: form.age_years ? parseFloat(form.age_years) : undefined,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
        patient_type: "Appointment",
        discharge_status: "active",
        involved_services: [selectedService],
        appointment_datetime: new Date(form.appointment_datetime).toISOString(),
        appointment_reason: form.appointment_reason,
        appointment_clinician: form.appointment_clinician.trim() || undefined,
        appointment_notes: form.reason_for_visit.trim() || undefined,
      });

      setSaving(false);
      onSaved();
    } catch (err) {
      setSaving(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-panel rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass-panel rounded-t-2xl px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Appointment</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Patient ID input — always shown */}
          <div>
            <label className="block text-xs text-white/50 mb-2">Patient ID *</label>
            <div className="relative">
              <input
                type="text"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
                className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-sm"
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Found patient confirmation */}
          {foundPatient && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/20 space-y-1">
              <p className="text-xs text-green-200">
                Found: <span className="font-semibold">{foundPatient.name}</span>
              </p>
              <div className="text-xs text-green-200/80 space-y-0.5">
                {foundPatient.species && <p>Species: {foundPatient.species}</p>}
                {foundPatient.breed && <p>Breed: {foundPatient.breed}</p>}
                {foundPatient.age_years && <p>Age: {foundPatient.age_years} years</p>}
                {foundPatient.sex && <p>Sex: {foundPatient.sex}</p>}
              </div>
            </div>
          )}

          {/* Full form — shown only if no match or user chooses to create new */}
          {showFullForm && (
            <>
              {/* Patient name + Species */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="Patient name"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Species</label>
                  <select
                    value={form.species}
                    onChange={e => set("species", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  >
                    {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Breed + Sex */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Breed</label>
                  <input
                    value={form.breed}
                    onChange={e => set("breed", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Sex</label>
                  <select
                    value={form.sex}
                    onChange={e => set("sex", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  >
                    {["Female Spayed", "Female Intact", "Male Neutered", "Male Intact"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Age + Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Age (years)</label>
                  <input
                    type="number"
                    value={form.age_years}
                    onChange={e => set("age_years", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight_kg}
                    onChange={e => set("weight_kg", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* Appointment details — shown if patient found or full form visible */}
          {(foundPatient || showFullForm) && (
            <>
              {/* Date/Time + Appointment Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Date & Time *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs text-left flex items-center gap-2 hover:bg-black/40 transition-colors">
                        <CalendarIcon className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                        <span>{format(selectedDate, "MMM d, yyyy")} at {selectedTime}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-4 space-y-3 bg-slate-950 rounded-lg border border-white/15">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) handleDateTimeChange(date, selectedTime);
                          }}
                          className="text-white"
                        />
                        <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                          <Clock className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                          <input
                            type="time"
                            value={selectedTime}
                            onChange={e => handleDateTimeChange(selectedDate, e.target.value)}
                            className="flex-1 px-2 py-1 rounded bg-black/30 border border-white/15 text-white text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Appointment Type</label>
                  <select
                    value={form.appointment_reason}
                    onChange={e => set("appointment_reason", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                  >
                    {APPOINTMENT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Clinician */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Clinician</label>
                <select
                  value={form.appointment_clinician}
                  onChange={e => set("appointment_clinician", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white focus:outline-none text-xs"
                >
                  <option value="">Select clinician...</option>
                  {clinicians.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Reason for Visit</label>
                <textarea
                  value={form.reason_for_visit}
                  onChange={e => set("reason_for_visit", e.target.value)}
                  placeholder="Optional"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-white placeholder:text-white/30 focus:outline-none text-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.appointment_datetime}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500/25 hover:bg-orange-500/35 border border-orange-400/30 text-orange-200 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "Creating…" : "Create Appointment"}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg bg-white/8 text-white/50 hover:bg-white/12 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}