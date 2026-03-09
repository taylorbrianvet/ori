import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, User, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

function fmt(d) {
  if (!d) return "—";
  try { const [y,m,day] = d.split("-").map(Number); return format(new Date(y,m-1,day), "MMM d, yyyy"); } catch { return d; }
}

function Row({ label, value }) {
  if (!value && value !== false) return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/6">
      <span className="text-[11px] text-white/38 uppercase tracking-wider font-medium flex-shrink-0">{label}</span>
      <span className="text-xs text-white/80 text-right">{display}</span>
    </div>
  );
}

function FullscreenImage({ src, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/92 flex items-center justify-center p-4"
      onClick={onClose}>
      <img src={src} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
      <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

export default function BandageChangeDetailModal({ change, onClose }) {
  const [fullscreenImg, setFullscreenImg] = useState(null);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
          className="relative glass-panel w-full sm:rounded-2xl sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-panel rounded-t-2xl px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{change.wound_location}</p>
              <p className="text-[11px] text-white/45 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> {fmt(change.change_date)}
                {change.clinician && <><span className="text-white/20 mx-0.5">·</span><User className="w-3 h-3" />{change.clinician}</>}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Images */}
            {(change.image_pre_url || change.image_post_url) && (
              <div className="flex gap-3">
                {change.image_pre_url && (
                  <div className="flex-1 cursor-pointer" onClick={() => setFullscreenImg(change.image_pre_url)}>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Before</p>
                    <img src={change.image_pre_url} alt="Pre" className="w-full rounded-xl object-cover aspect-video bg-black/30 hover:opacity-90 transition-opacity" />
                  </div>
                )}
                {change.image_post_url && (
                  <div className="flex-1 cursor-pointer" onClick={() => setFullscreenImg(change.image_post_url)}>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">After</p>
                    <img src={change.image_post_url} alt="Post" className="w-full rounded-xl object-cover aspect-video bg-black/30 hover:opacity-90 transition-opacity" />
                  </div>
                )}
              </div>
            )}

            {/* Clinical details */}
            <div>
              <Row label="Wound Type" value={change.wound_type} />
              <Row label="Exudate" value={[change.exudate_amount, change.exudate_type].filter(Boolean).join(" ") || null} />
              <Row label="Pocketing" value={change.pocketing_present ? (change.pocketing_description || "Present") : "None"} />
              <Row label="Granulation" value={change.granulation_tissue ? (change.granulation_description || "Present") : null} />
              <Row label="Debridement" value={change.debridement_performed ? (change.debridement_type || "Performed") : null} />
              <Row label="Wound Closed" value={change.wound_closed ? "Yes" : null} />
              <Row label="Suture" value={change.suture_type} />
              <Row label="Topical Therapy" value={change.topical_therapy} />
              <Row label="Primary Dressing" value={change.primary_dressing} />
              <Row label="Secondary Dressing" value={change.secondary_dressing} />
              <Row label="Bandage Type" value={change.bandage_type} />
              <Row label="Next Change" value={fmt(change.next_change_date)} />
            </div>

            {change.wound_healed && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/12 border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-300 font-medium">Wound marked healed at this visit</span>
              </div>
            )}

            {change.additional_notes && (
              <div className="pt-1">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-xs text-white/60 leading-relaxed">{change.additional_notes}</p>
              </div>
            )}

            {change.transcript && (
              <div className="pt-1">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Transcript</p>
                <p className="text-xs text-white/45 leading-relaxed italic">{change.transcript}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Fullscreen image viewer */}
      {fullscreenImg && (
        <FullscreenImage src={fullscreenImg} onClose={() => setFullscreenImg(null)} />
      )}
    </>
  );
}