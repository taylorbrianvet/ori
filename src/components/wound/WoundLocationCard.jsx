import React, { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Calendar, User, Layers, Droplets } from "lucide-react";

function formatDate(d) {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-").map(Number);
    return format(new Date(y, m - 1, day), "MMM d, yyyy");
  } catch { return d; }
}

function DataPill({ label, value }) {
  if (!value && value !== false) return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-white/30 uppercase tracking-wider font-medium">{label}</span>
      <span className="text-xs text-white/75">{display}</span>
    </div>
  );
}

export default function WoundLocationCard({ wound, changes, woundStatus, onMarkHealed }) {
  const [idx, setIdx] = useState(changes.length - 1); // default to latest

  const change = changes[idx] || null;
  const nextChangeDate = change?.next_change_date;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{wound}</p>
          {woundStatus === "healed" ? (
            <span className="text-[10px] text-green-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Healed
            </span>
          ) : nextChangeDate ? (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> Next change: {formatDate(nextChangeDate)}
            </span>
          ) : (
            <span className="text-[10px] text-white/35 mt-0.5">No changes recorded yet</span>
          )}
        </div>
        {woundStatus !== "healed" && onMarkHealed && (
          <button onClick={() => onMarkHealed(wound)}
            className="text-[10px] text-white/40 hover:text-green-400 transition-colors px-2 py-1 rounded-lg hover:bg-green-500/10 border border-transparent hover:border-green-500/20">
            Mark healed
          </button>
        )}
      </div>

      {changes.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-white/30">No bandage changes recorded yet</div>
      ) : (
        <>
          {/* Carousel nav */}
          {changes.length > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 bg-white/3">
              <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center disabled:opacity-30 hover:bg-white/15 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-white" />
              </button>
              <span className="text-[10px] text-white/40">
                {formatDate(change?.change_date)} · {idx + 1} / {changes.length}
              </span>
              <button onClick={() => setIdx(i => Math.min(changes.length - 1, i + 1))} disabled={idx === changes.length - 1}
                className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center disabled:opacity-30 hover:bg-white/15 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}

          {/* Images */}
          {(change?.image_pre_url || change?.image_post_url) && (
            <div className="flex gap-2 p-3 border-b border-white/8">
              {change.image_pre_url && (
                <div className="flex-1">
                  <p className="text-[9px] text-white/30 mb-1">PRE</p>
                  <img src={change.image_pre_url} alt="Pre" className="w-full rounded-lg object-cover aspect-video bg-black/20" />
                </div>
              )}
              {change.image_post_url && (
                <div className="flex-1">
                  <p className="text-[9px] text-white/30 mb-1">POST</p>
                  <img src={change.image_post_url} alt="Post" className="w-full rounded-lg object-cover aspect-video bg-black/20" />
                </div>
              )}
            </div>
          )}

          {/* Change data */}
          <div className="p-3">
            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-[11px]">
              {change?.clinician && (
                <span className="flex items-center gap-1 text-white/55">
                  <User className="w-3 h-3" /> {change.clinician}
                </span>
              )}
              {change?.change_date && (
                <span className="flex items-center gap-1 text-white/40">
                  <Clock className="w-3 h-3" /> {formatDate(change.change_date)}
                </span>
              )}
            </div>

            {/* Data grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <DataPill label="Wound Type" value={change?.wound_type} />
              <DataPill label="Exudate" value={change?.exudate_amount && change?.exudate_type ? `${change.exudate_amount} ${change.exudate_type}` : change?.exudate_type || change?.exudate_amount} />
              <DataPill label="Pocketing" value={change?.pocketing_present ? (change.pocketing_description || "Present") : "None"} />
              <DataPill label="Granulation" value={change?.granulation_tissue ? (change.granulation_description || "Present") : null} />
              <DataPill label="Debridement" value={change?.debridement_performed ? (change.debridement_type || "Yes") : null} />
              <DataPill label="Wound Closed" value={change?.wound_closed} />
              <DataPill label="Suture" value={change?.suture_type} />
              <DataPill label="Topical Therapy" value={change?.topical_therapy} />
              <DataPill label="Primary Dressing" value={change?.primary_dressing} />
              <DataPill label="Secondary Dressing" value={change?.secondary_dressing} />
              <DataPill label="Bandage Type" value={change?.bandage_type} />
            </div>

            {change?.additional_notes && (
              <div className="mt-2.5 pt-2.5 border-t border-white/8">
                <p className="text-[10px] text-white/30 mb-0.5">Notes</p>
                <p className="text-xs text-white/60">{change.additional_notes}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}