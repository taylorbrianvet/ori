import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { calculateCurrentAge, calculateAgeComponents } from "@/components/shared/ageCalculator";

const SERVICES = [
  "Emergency",
  "Cardiology", "Critical Care", "Dermatology", "Internal Medicine", "Interventional Radiology",
  "Neurology", "Oncology",
  "Ophthalmology", "Orthopedic Surgery", "Primary Care",
  "Soft Tissue Surgery"
];

const SPECIES = ["Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];
const SEX_OPTIONS = ["MI", "MC", "FI", "FS"];
const SEX_LABELS = { MI: "MI – Male Intact", MC: "MC – Male Castrated", FI: "FI – Female Intact", FS: "FS – Female Spayed" };
const LOCATIONS = ["ICU", "PCW", "ER", "Ward", "Recovery", "Imaging", "OR", "Other"];

const EMPTY = {
  global_patient_id: "",
  patient_name: "", patient_id: "", age_years: "", age_months: "", age_weeks: "",
  sex: "", species: "", breed: "",
  location: "", problem_list: [], requesting_service: "", receiving_services: [],
  requesting_clinician: "", estimate: "", notes: "", already_transferred: false,
};

export default function TransferForm({ staffList = [], onSaved, prefill = null }) {
  const [form, setForm] = useState(prefill ? { ...EMPTY, ...prefill } : EMPTY);
  const [problemInput, setProblemInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchPatientId, setSearchPatientId] = useState("");
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [searchResult, setSearchResult] = useState(null); // { id, name, patient_id, species, breed, sex, age_years, age_months, age_weeks }
  const [selectedPatient, setSelectedPatient] = useState(null); // locked-in patient after "Transfer Patient" click

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCheckPatientId = async (patientId) => {
    const idToCheck = patientId.trim();
    if (!idToCheck) return;

    setIsSearchingPatient(true);
    try {
      const globalPatients = await base44.entities.GlobalPatient.filter({ patient_id: idToCheck });
      if (globalPatients && globalPatients.length > 0) {
        const patient = globalPatients[0];
        const ageComponents = calculateAgeComponents(patient.birthdate);
        setSearchResult({
          id: patient.id,
          name: patient.name,
          patient_id: patient.patient_id,
          species: patient.species,
          breed: patient.breed || "",
          sex: patient.sex || "",
          age_years: ageComponents.years,
          age_months: ageComponents.months,
          age_weeks: ageComponents.weeks,
        });
        toast.success(`Patient ${patient.name} found. Use this patient or continue with manual entry.`);
      }
    } catch (error) {
      console.error("Error searching GlobalPatient:", error);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const handleSearchPatient = async () => {
    const idToSearch = searchPatientId.trim();
    if (!idToSearch) return;
    handleCheckPatientId(idToSearch);
  };

  const handleTransferPatient = () => {
    if (!searchResult) return;
    setSelectedPatient(searchResult);
    setSearchResult(null);
    setSearchPatientId("");
  };

  const handleCancelPatientSelection = () => {
    setSelectedPatient(null);
    setSearchResult(null);
    setSearchPatientId("");
  };

  const addProblem = () => {
    const p = problemInput.trim();
    if (!p) return;
    set("problem_list", [...(form.problem_list || []), p]);
    setProblemInput("");
  };

  const removeProblem = (i) => set("problem_list", form.problem_list.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    // If patient selected via search, those fields are auto-populated
    const patientFieldsRequired = !selectedPatient;
    if (patientFieldsRequired && (!form.patient_name || !form.patient_id || !form.breed)) {
      toast.error("Please fill in all required patient fields.");
      return;
    }
    if (!form.requesting_service || form.receiving_services.length === 0 || !form.requesting_clinician) {
      toast.error("Please fill in all required transfer fields and select at least one receiving service.");
      return;
    }
    setSaving(true);
    // Create one InterserviceTransfer record with all receiving services
    const transferData = {
      ...form,
      age_years: selectedPatient ? selectedPatient.age_years : (form.age_years ? parseFloat(form.age_years) : undefined),
      age_months: selectedPatient ? selectedPatient.age_months : (form.age_months ? parseFloat(form.age_months) : undefined),
      age_weeks: selectedPatient ? selectedPatient.age_weeks : (form.age_weeks ? parseFloat(form.age_weeks) : undefined),
      patient_name: selectedPatient ? selectedPatient.name : form.patient_name,
      patient_id: selectedPatient ? selectedPatient.patient_id : form.patient_id,
      species: selectedPatient ? selectedPatient.species : form.species,
      breed: selectedPatient ? selectedPatient.breed : form.breed,
      sex: selectedPatient ? selectedPatient.sex : form.sex,
      receiving_service: form.receiving_services[0] || "",
      receiving_services: form.receiving_services,
      global_patient_id: selectedPatient ? selectedPatient.id : (form.global_patient_id || undefined),
    };
    const created = await base44.entities.InterserviceTransfer.create(transferData);
    // Trigger backend sync to upsert GlobalPatient + PatientVisit
    await base44.functions.invoke("syncTransferToPatient", { data: { ...transferData, id: created.id } });
    toast.success("Transfer submitted.");
    setForm(EMPTY);
    setProblemInput("");
    setSaving(false);
    onSaved?.();
  };

  const toggleReceivingService = (service) => {
    const current = form.receiving_services;
    if (current.includes(service)) {
      set("receiving_services", current.filter(s => s !== service));
    } else if (current.length < 2) {
      set("receiving_services", [...current, service]);
    }
  };

  const eligibleClinicians = staffList
    .filter(s => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map(s => `${s.first_name} ${s.last_name}`);

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white mb-1">New Transfer</h2>

      {!selectedPatient ? (
        <>
          {/* Patient search */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Search Existing Patient by ID</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
                placeholder="Enter patient ID (e.g., 123456)"
                value={searchPatientId}
                onChange={e => setSearchPatientId(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchPatient(); }}
              />
              <button
                type="button"
                onClick={handleSearchPatient}
                disabled={!searchPatientId.trim() || isSearchingPatient}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white hover:bg-white/16 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {isSearchingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </div>
          </div>

          {/* Search result card */}
          {searchResult && (
            <div className="p-4 rounded-xl bg-white/8 border border-white/20">
              <p className="text-xs text-white/50 mb-2">Patient found:</p>
              <div className="space-y-1 mb-3">
                <p className="text-sm font-semibold text-white">{searchResult.name}</p>
                <p className="text-xs text-white/60">ID: {searchResult.patient_id} | {searchResult.species} {searchResult.breed} | {searchResult.sex}</p>
                <p className="text-xs text-white/60">Age: {searchResult.age_years}y {searchResult.age_months}mo {searchResult.age_weeks}w</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTransferPatient}
                  className="flex-1 px-3 py-2 rounded-xl bg-green-500/20 border border-green-400/50 text-sm text-green-300 hover:bg-green-500/30 transition-colors"
                >
                  Transfer This Patient
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchResult(null); setSearchPatientId(""); }}
                  className="px-3 py-2 rounded-xl bg-white/8 border border-white/20 text-sm text-white hover:bg-white/12 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Selected patient locked in */}
          <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-400/30">
            <p className="text-xs text-blue-300 mb-2">Patient selected:</p>
            <div className="space-y-1 mb-2">
              <p className="text-sm font-semibold text-white">{selectedPatient.name}</p>
              <p className="text-xs text-white/60">ID: {selectedPatient.patient_id} | {selectedPatient.species} {selectedPatient.breed} | {selectedPatient.sex}</p>
            </div>
            <button
              type="button"
              onClick={handleCancelPatientSelection}
              className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
            >
              Change Patient
            </button>
          </div>
        </>
      )}

      {/* Form only visible when patient is selected OR search not used */}
      {selectedPatient || (!searchResult && !selectedPatient) ? (
        <>
          {/* Patient info fields - only shown if NOT selected via search */}
          {!selectedPatient && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient Name <span className="text-red-400">*</span></label>
                  <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
                    placeholder="e.g. Buddy" value={form.patient_name} onChange={e => set("patient_name", e.target.value)} />
                </div>
                <div>
                   <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Patient ID <span className="text-red-400">*</span></label>
                   <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
                     placeholder="e.g. 123456" value={form.patient_id} 
                     onChange={e => set("patient_id", e.target.value)}
                     onBlur={() => handleCheckPatientId(form.patient_id)} />
                 </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Age (yrs)</label>
                  <input type="number" min="0" className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
                    placeholder="0" value={form.age_years} onChange={e => set("age_years", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Months</label>
                  <input type="number" min="0" max="11" className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
                    placeholder="0" value={form.age_months} onChange={e => set("age_months", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Weeks</label>
                  <input type="number" min="0" max="3" className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
                    placeholder="0" value={form.age_weeks} onChange={e => set("age_weeks", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Sex</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
                    value={form.sex} onChange={e => set("sex", e.target.value)}>
                    <option value="">—</option>
                    {SEX_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Species</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
                    value={form.species} onChange={e => set("species", e.target.value)}>
                    <option value="">—</option>
                    {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Breed <span className="text-red-400">*</span></label>
                  <input className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
                    placeholder="e.g. Golden Retriever" value={form.breed} onChange={e => set("breed", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Location</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
                    value={form.location} onChange={e => set("location", e.target.value)}>
                    <option value="">—</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Location field - shown only when patient is selected via search */}
          {selectedPatient && (
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Location</label>
              <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
                value={form.location} onChange={e => set("location", e.target.value)}>
                <option value="">—</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

      {/* Problem list */}
      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Problem List</label>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="Add problem / diagnosis…"
            value={problemInput}
            onChange={e => setProblemInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addProblem()}
          />
          <button onClick={addProblem} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/16 text-white/70 hover:text-white transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {(form.problem_list || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.problem_list.map((p, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/75">
                {p}
                <button onClick={() => removeProblem(i)} className="text-white/30 hover:text-white/70 transition-colors ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Services */}
       <div>
         <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Transferring Service <span className="text-red-400">*</span></label>
         <select className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-sm text-white focus:outline-none"
           value={form.requesting_service} onChange={e => set("requesting_service", e.target.value)}>
           <option value="">Select…</option>
           {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
         </select>
       </div>

      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Receiving Services <span className="text-red-400">*</span></label>
        <p className="text-xs text-white/40 mb-2">Select up to 2 services</p>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-black/30 border border-white/20">
          {SERVICES.map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.receiving_services.includes(s)}
                onChange={() => toggleReceivingService(s)}
                disabled={form.receiving_services.length >= 2 && !form.receiving_services.includes(s)}
                className="rounded w-4 h-4 accent-white/60 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-xs text-white/75">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clinician */}
      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Transferring Clinician <span className="text-red-400">*</span></label>
        <input
          list="clinician-list"
          className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
          placeholder="Search or type name…"
          value={form.requesting_clinician}
          onChange={e => set("requesting_clinician", e.target.value)}
        />
        <datalist id="clinician-list">
          {eligibleClinicians.map(n => <option key={n} value={n} />)}
        </datalist>
      </div>

      {/* Estimate */}
      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Financial Estimate</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50">$</span>
          <input
            type="number"
            className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
            placeholder="e.g. 4000"
            value={form.estimate}
            onChange={e => set("estimate", e.target.value ? parseFloat(e.target.value) : "")}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Notes</label>
        <textarea
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35 resize-none"
          placeholder="Additional notes…"
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
        />
      </div>

      {/* Already transferred */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => set("already_transferred", !form.already_transferred)}
          className={`w-10 h-5.5 rounded-full border transition-colors flex items-center px-0.5 ${form.already_transferred ? "bg-green-500/40 border-green-400/50" : "bg-white/8 border-white/20"}`}
        >
          <div className={`w-4 h-4 rounded-full transition-transform ${form.already_transferred ? "translate-x-4 bg-green-300" : "translate-x-0 bg-white/30"}`} />
        </div>
        <span className="text-xs text-white/55">Patient already transferred</span>
      </label>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/12 hover:bg-white/18 border border-white/20 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Submit Transfer
      </button>
        </>
      ) : null}
    </div>
  );
}