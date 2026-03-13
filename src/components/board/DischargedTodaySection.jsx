import React, { useState } from "react";
import { CheckCircle2, RotateCcw, Loader2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function DischargedTodaySection({ patients }) {
  const [loadingId, setLoadingId] = useState(null);
  const queryClient = useQueryClient();

  if (!patients || patients.length === 0) return null;

  const handleReadmit = async (patient) => {
    setLoadingId(patient.id);
    await base44.entities.PatientVisit.update(patient.id, {
      discharge_status: "active",
      scheduled_discharge_time: null,
    });
    toast.success(`${patient.name} re-admitted`);
    queryClient.invalidateQueries({ queryKey: ["patient-visits"] });
    setLoadingId(null);
  };

  const formatDischargeTime = (isoString) => {
    if (!isoString) return null;
    try {
      const s = /[Z+\-]\d*$/.test(isoString) ? isoString : isoString + "Z";
      return format(new Date(s), "h:mm a");
    } catch {
      return null;
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        <h3 className="text-xs font-semibold text-white/70">
          Discharged Today <span className="text-white/40 font-normal">({patients.length})</span>
        </h3>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {patients.map(p => (
          <div
            key={p.id}
            className="flex-shrink-0 w-44 rounded-xl border border-green-400/30 bg-green-500/10 p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-green-200 truncate">{p.name}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            </div>
            {p.scheduled_discharge_time && (
              <div className="flex items-center gap-1 text-[10px] text-green-300/80">
                <Clock className="w-2.5 h-2.5" />
                DC {formatDischargeTime(p.scheduled_discharge_time)}
              </div>
            )}
            <p className="text-[10px] text-white/45 truncate">
              {[p.species, p.breed].filter(Boolean).join(" · ")}
            </p>
            {p.primary_clinician && (
              <p className="text-[10px] text-white/40 truncate">{p.primary_clinician}</p>
            )}
            <button
              onClick={() => handleReadmit(p)}
              disabled={loadingId === p.id}
              className="w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-white/8 hover:bg-white/14 border border-white/12 text-[10px] text-white/60 hover:text-white transition-colors disabled:opacity-50"
            >
              {loadingId === p.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><RotateCcw className="w-3 h-3" /> Re-admit</>
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}