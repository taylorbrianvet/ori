import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, CheckCircle2, Calendar, User, Pencil, Check } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

function fmt(d) {
  if (!d) return "—";
  try { const [y, m, day] = d.split("-").map(Number); return format(new Date(y, m - 1, day), "MMM d, yyyy"); } catch { return d; }
}

function FullscreenImage({ src, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black flex items-center justify-center"
      onClick={onClose}>
      <img src={src} alt="" className="max-w-full max-h-full object-contain" />
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

function EditableRow({ label, field, value, changeId, onSaved, multiline = false, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const display = value || <span className="text-white/20 italic">—</span>;

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.BandageChange.update(changeId, { [field]: draft || null });
      onSaved(field, draft || null);
      setEditing(false);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setDraft(value || ""); setEditing(false); };

  return (
    <div className="py-2.5 border-b border-white/6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">{label}</span>
        {!editing && (
          <button onClick={() => { setDraft(value || ""); setEditing(true); }}
            className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/8 transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-1">
            <button onClick={cancel} className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60">
              <X className="w-3 h-3" />
            </button>
            <button onClick={save} disabled={saving}
              className="w-5 h-5 rounded flex items-center justify-center text-green-400 hover:text-green-300">
              <Check className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            className="w-full px-2.5 py-2 rounded-lg text-xs text-white resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
            style={{ background: "rgba(0,0,0,0.45)" }}
            rows={3}
            value={draft}
            onChange={e => setDraft(e.target.value)}
          />
        ) : (
          <input
            autoFocus
            type={type}
            className="w-full px-2.5 py-2 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            style={{ background: "rgba(0,0,0,0.45)", colorScheme: "dark" }}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          />
        )
      ) : (
        <p className="text-xs text-white/75 leading-relaxed">{display}</p>
      )}
    </div>
  );
}

export default function BandageChangeDetailModal({ change: initialChange, onClose }) {
  const [change, setChange] = useState(initialChange);
  const [fullscreenImg, setFullscreenImg] = useState(null);

  const handleSaved = (field, value) => {
    setChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {/* Full-screen overlay at maximum z-index */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col"
        style={{ background: "#1a070f" }}
      >
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-white/55 hover:text-white transition-colors text-xs">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{change.wound_location}</p>
            <p className="text-[11px] text-white/40 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> {fmt(change.change_date)}
              {change.clinician && <><span className="text-white/20">·</span><User className="w-3 h-3" />{change.clinician}</>}
            </p>
          </div>
          {change.wound_healed && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/15 px-2 py-1 rounded-full flex-shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Healed
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Images — full width at top */}
          {(change.image_pre_url || change.image_post_url) && (
            <div className="flex gap-0.5">
              {change.image_pre_url && (
                <div className="flex-1 relative cursor-pointer" onClick={() => setFullscreenImg(change.image_pre_url)}>
                  <img src={change.image_pre_url} alt="Pre"
                    className="w-full object-cover hover:opacity-90 transition-opacity"
                    style={{ maxHeight: "260px" }} />
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                    <p className="text-[10px] text-white/70 uppercase tracking-wider font-medium">Before</p>
                  </div>
                </div>
              )}
              {change.image_post_url && (
                <div className="flex-1 relative cursor-pointer" onClick={() => setFullscreenImg(change.image_post_url)}>
                  <img src={change.image_post_url} alt="Post"
                    className="w-full object-cover hover:opacity-90 transition-opacity"
                    style={{ maxHeight: "260px" }} />
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                    <p className="text-[10px] text-white/70 uppercase tracking-wider font-medium">After</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clinical data — editable */}
          <div className="px-5 pb-8 pt-4">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Tap the pencil icon to edit any field</p>

            <EditableRow label="Wound Type" field="wound_type" value={change.wound_type} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Exudate Type" field="exudate_type" value={change.exudate_type} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Exudate Amount" field="exudate_amount" value={change.exudate_amount} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Pocketing Description" field="pocketing_description" value={change.pocketing_description} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Granulation" field="granulation_description" value={change.granulation_description} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Debridement" field="debridement_type" value={change.debridement_type} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Suture Type" field="suture_type" value={change.suture_type} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Topical Therapy" field="topical_therapy" value={change.topical_therapy} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Primary Dressing" field="primary_dressing" value={change.primary_dressing} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Secondary Dressing" field="secondary_dressing" value={change.secondary_dressing} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Bandage Type" field="bandage_type" value={change.bandage_type} changeId={change.id} onSaved={handleSaved} />
            <EditableRow label="Next Change Date" field="next_change_date" value={change.next_change_date} changeId={change.id} onSaved={handleSaved} type="date" />
            <EditableRow label="Additional Notes" field="additional_notes" value={change.additional_notes} changeId={change.id} onSaved={handleSaved} multiline />

            {change.transcript && (
              <div className="mt-4 pt-4 border-t border-white/8">
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Voice Transcript</p>
                <p className="text-xs text-white/40 leading-relaxed italic">{change.transcript}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Fullscreen image viewer */}
      <AnimatePresence>
        {fullscreenImg && (
          <FullscreenImage src={fullscreenImg} onClose={() => setFullscreenImg(null)} />
        )}
      </AnimatePresence>
    </>
  );
}