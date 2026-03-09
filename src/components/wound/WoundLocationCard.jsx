import React, { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Calendar, User, ImageIcon } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import BandageChangeDetailModal from "./BandageChangeDetailModal";

function fmt(d) {
  if (!d) return "—";
  try { const [y,m,day] = d.split("-").map(Number); return format(new Date(y,m-1,day), "MMM d, yyyy"); } catch { return d; }
}
function fmtShort(d) {
  if (!d) return "—";
  try { const [y,m,day] = d.split("-").map(Number); return format(new Date(y,m-1,day), "MMM d"); } catch { return d; }
}

function BandageChangeThumb({ change, onClick }) {
  const hasImage = change.image_pre_url || change.image_post_url;
  const thumb = change.image_pre_url || change.image_post_url;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-48 rounded-xl overflow-hidden border border-white/12 bg-white/6 hover:bg-white/12 hover:border-white/22 transition-all text-left active:scale-[0.97]"
    >
      {/* Image area */}
      <div className="w-full aspect-video bg-black/30 relative overflow-hidden">
        {hasImage ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white/15" />
          </div>
        )}
        {/* Date badge */}
        <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <span className="text-[10px] text-white/80 font-medium">{fmtShort(change.change_date)}</span>
        </div>
        {change.wound_healed && (
          <div className="absolute top-1.5 right-1.5 bg-green-500/80 rounded-full p-0.5">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-1.5">
        {change.clinician && (
          <p className="text-[10px] text-white/55 flex items-center gap-1 truncate">
            <User className="w-2.5 h-2.5 flex-shrink-0" />
            {change.clinician}
          </p>
        )}
        {change.topical_therapy && (
          <div>
            <p className="text-[9px] text-white/28 uppercase tracking-wider">Topical</p>
            <p className="text-[10px] text-white/65 truncate">{change.topical_therapy}</p>
          </div>
        )}
        {change.primary_dressing && (
          <div>
            <p className="text-[9px] text-white/28 uppercase tracking-wider">Primary</p>
            <p className="text-[10px] text-white/65 truncate">{change.primary_dressing}</p>
          </div>
        )}
        {change.secondary_dressing && (
          <div>
            <p className="text-[9px] text-white/28 uppercase tracking-wider">Secondary</p>
            <p className="text-[10px] text-white/65 truncate">{change.secondary_dressing}</p>
          </div>
        )}
      </div>
    </button>
  );
}

export default function WoundLocationCard({ wound, changes, woundStatus, onMarkHealed }) {
  const [selectedChange, setSelectedChange] = useState(null);

  // Most recent first (index 0 = newest)
  const sorted = [...changes].sort((a, b) => (a.change_date > b.change_date ? -1 : 1));

  // Next change date from the most recent entry
  const latestNextChange = sorted[0]?.next_change_date;

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
          ) : latestNextChange ? (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> Next change: {fmt(latestNextChange)}
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

      {/* Horizontal scroll strip */}
      {sorted.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-white/30">No bandage changes recorded yet</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {sorted.map((change) => (
            <BandageChangeThumb
              key={change.id}
              change={change}
              onClick={() => setSelectedChange(change)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedChange && (
          <BandageChangeDetailModal
            change={selectedChange}
            onClose={() => setSelectedChange(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}