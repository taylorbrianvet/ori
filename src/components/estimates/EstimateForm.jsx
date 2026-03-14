import React, { useState } from "react";
import { Search, X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const SPECIES_OPTIONS = ["Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];

export default function EstimateForm({ estimate, allEstimates, serviceName, onSaved, onCancel }) {
  // If editing, use existing data; if creating, default service to the user's service
  const isNew = !estimate;
  const [form, setForm] = useState({
    procedure_name: estimate?.procedure_name || "",
    service_name: estimate?.service_name || serviceName || "",
    estimate_low: estimate?.estimate_low ?? "",
    estimate_high: estimate?.estimate_high ?? "",
    includes_anesthesia: estimate?.includes_anesthesia ?? false,
    notes: estimate?.notes || "",
    species: estimate?.species || "",
    linked_estimate_ids: estimate?.linked_estimate_ids || [],
  });
  const [linkSearch, setLinkSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleLink = (id) => {
    set(
      "linked_estimate_ids",
      form.linked_estimate_ids.includes(id)
        ? form.linked_estimate_ids.filter((x) => x !== id)
        : [...form.linked_estimate_ids, id]
    );
  };

  const linkResults = linkSearch.trim()
    ? allEstimates.filter(
        (e) =>
          e.id !== estimate?.id &&
          (e.procedure_name.toLowerCase().includes(linkSearch.toLowerCase()) ||
            e.service_name.toLowerCase().includes(linkSearch.toLowerCase()))
      )
    : [];

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      estimate_low: form.estimate_low !== "" ? Number(form.estimate_low) : null,
      estimate_high: form.estimate_high !== "" ? Number(form.estimate_high) : null,
      species: form.species || null,
    };
    if (isNew) {
      await base44.entities.Estimate.create(payload);
    } else {
      await base44.entities.Estimate.update(estimate.id, payload);
    }
    queryClient.invalidateQueries({ queryKey: ["estimates"] });
    setSaving(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">{isNew ? "New Estimate" : "Edit Estimate"}</h3>
        <button type="button" onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Service label (read-only display for new; editable input for edit) */}
      {!isNew && (
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Service</label>
          <input
            value={form.service_name}
            onChange={(e) => set("service_name", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm text-white bg-white/10 border-white/15 focus:outline-none focus:border-white/30 backdrop-blur"
          />
        </div>
      )}
      {isNew && form.service_name && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/12">
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Service:</span>
          <span className="text-sm text-white/80 font-medium">{form.service_name}</span>
        </div>
      )}

      {/* Procedure name */}
      <div>
        <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Procedure Name *</label>
        <input
          required
          value={form.procedure_name}
          onChange={(e) => set("procedure_name", e.target.value)}
          placeholder="e.g. Splenectomy"
          className="w-full px-3 py-2 rounded-lg border text-sm text-white bg-white/8 border-white/15 focus:outline-none focus:border-white/30 placeholder:text-white/25"
        />
      </div>

      {/* Low / High */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Low Estimate ($)</label>
          <input
            type="number"
            min="0"
            value={form.estimate_low}
            onChange={(e) => set("estimate_low", e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border text-sm text-white bg-white/8 border-white/15 focus:outline-none focus:border-white/30 placeholder:text-white/25"
          />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">High Estimate ($)</label>
          <input
            type="number"
            min="0"
            value={form.estimate_high}
            onChange={(e) => set("estimate_high", e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border text-sm text-white bg-white/8 border-white/15 focus:outline-none focus:border-white/30 placeholder:text-white/25"
          />
        </div>
      </div>

      {/* Anesthesia */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <div
          onClick={() => set("includes_anesthesia", !form.includes_anesthesia)}
          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${form.includes_anesthesia ? "bg-green-500 border-green-400" : "bg-white/8 border-white/20"}`}
        >
          {form.includes_anesthesia && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <span className="text-sm text-white/70">Includes anesthesia</span>
      </label>

      {/* Species (optional) */}
      <div>
        <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Species (optional)</label>
        <select
          value={form.species}
          onChange={(e) => set("species", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm text-white bg-white/8 border-white/15 focus:outline-none focus:border-white/30"
        >
          <option value="" className="bg-slate-800">— Any species —</option>
          {SPECIES_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-slate-800">{s}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Additional notes…"
          className="w-full px-3 py-2 rounded-lg border text-sm text-white bg-white/8 border-white/15 focus:outline-none focus:border-white/30 placeholder:text-white/25 resize-none"
        />
      </div>

      {/* Link to other estimates */}
      <div>
        <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Link Associated Estimates</label>
        {form.linked_estimate_ids.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.linked_estimate_ids.map((id) => {
              const linked = allEstimates.find((e) => e.id === id);
              return linked ? (
                <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/70">
                  {linked.procedure_name}
                  <button type="button" onClick={() => toggleLink(id)} className="hover:text-red-300 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={linkSearch}
            onChange={(e) => setLinkSearch(e.target.value)}
            placeholder="Search estimates to link…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border text-xs text-white bg-white/8 border-white/15 focus:outline-none focus:border-white/30 placeholder:text-white/25"
          />
        </div>
        {linkResults.length > 0 && (
          <div className="mt-1 rounded-lg border border-white/15 bg-slate-900/80 backdrop-blur max-h-36 overflow-y-auto">
            {linkResults.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => { toggleLink(e.id); setLinkSearch(""); }}
                className="w-full text-left px-3 py-2 hover:bg-white/8 transition-colors flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs text-white">{e.procedure_name}</p>
                  <p className="text-[10px] text-white/40">{e.service_name}</p>
                </div>
                {form.linked_estimate_ids.includes(e.id) && (
                  <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-white/15 text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2 rounded-lg bg-orange-500/80 hover:bg-orange-500 border border-orange-400/30 text-sm text-white font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : isNew ? "Add Estimate" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}