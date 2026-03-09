import React from "react";
import { Phone, MessageSquare } from "lucide-react";

const SLOT_LABELS = { primary: "Primary", secondary: "Secondary", tertiary: "Tertiary" };
const SLOT_COLORS = {
  primary: "bg-emerald-500/15 text-emerald-300",
  secondary: "bg-blue-500/15 text-blue-300",
  tertiary: "bg-purple-500/15 text-purple-300",
};

export default function OnCallPersonRow({ slot, name, role, phone, email }) {
  if (!name) return null;
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-white/12 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-white/75">{name.charAt(0)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">{name}</p>
          {role && <p className="text-[11px] text-white/45 truncate">{role}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${SLOT_COLORS[slot]}`}>
          {SLOT_LABELS[slot]}
        </span>
        {phone && (
          <a href={`tel:${phone}`} className="w-7 h-7 rounded-lg bg-green-500/10 hover:bg-green-500/25 flex items-center justify-center transition-colors" title="Call">
            <Phone className="w-3.5 h-3.5 text-green-400" />
          </a>
        )}
        {phone && (
          <a href={`sms:${phone}`} className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 flex items-center justify-center transition-colors" title="Text">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          </a>
        )}
      </div>
    </div>
  );
}