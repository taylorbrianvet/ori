import React from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, CheckCircle2, Clock, MapPin, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TransferCard({ transfers, transfer, onUpdated }) {
  // Support both grouped transfers and single transfer for backwards compatibility
  const transferGroup = transfers || (transfer ? [transfer] : []);
  const primaryTransfer = transferGroup[0];
  const isDoubleTransfer = transferGroup.length > 1;
  const isPending = !primaryTransfer.already_transferred;

  const signalment = [
    primaryTransfer.age,
    primaryTransfer.sex,
    primaryTransfer.species,
    primaryTransfer.breed,
  ].filter(Boolean).join(" · ");

  const handleToggle = async () => {
    // Toggle all transfers in the group
    for (const t of transferGroup) {
      await base44.entities.InterserviceTransfer.update(t.id, {
        already_transferred: !primaryTransfer.already_transferred,
      });
    }
    toast.success(primaryTransfer.already_transferred ? "Marked as pending." : "Marked as transferred.");
    onUpdated?.();
  };

  return (
    <div className={`glass-card p-4 transition-all ${isPending ? "border-white/15" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
         <div>
           <div className="flex items-center gap-2 flex-wrap">
             <span className="text-sm font-semibold text-white">{primaryTransfer.patient_name}</span>
             {primaryTransfer.patient_id && (
               <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/45 font-mono">{primaryTransfer.patient_id}</span>
             )}
             {isDoubleTransfer && (
               <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 font-medium flex items-center gap-1">
                 <AlertCircle className="w-3 h-3" /> Double Transfer
               </span>
             )}
             {isPending ? (
               <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 font-medium">Pending</span>
             ) : (
               <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-200 font-medium">Complete</span>
             )}
           </div>
           {signalment && <p className="text-xs text-white/40 mt-0.5">{signalment}</p>}
         </div>
        <button
          onClick={handleToggle}
          title={isPending ? "Mark as transferred" : "Mark as pending"}
          className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
            isPending
              ? "bg-white/6 border-white/15 text-white/30 hover:bg-green-500/20 hover:border-green-400/30 hover:text-green-300"
              : "bg-green-500/20 border-green-400/30 text-green-300 hover:bg-white/10 hover:border-white/20 hover:text-white/40"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>

      {/* Service arrow(s) */}
      <div className="space-y-2 mb-3">
        {transferGroup.map((t, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/12 text-white/65 font-medium">{t.requesting_service}</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <span className="px-2.5 py-1 rounded-lg bg-white/12 border border-white/18 text-white/85 font-medium">{t.receiving_service}</span>
          </div>
        ))}
      </div>

      {/* Problem list */}
      {(primaryTransfer.problem_list || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {primaryTransfer.problem_list.map((p, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-white/6 border border-white/10 text-white/55">{p}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-white/30">
        <div className="flex items-center gap-3">
          {primaryTransfer.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {primaryTransfer.location}
            </span>
          )}
          {primaryTransfer.requesting_clinician && (
            <span>{primaryTransfer.requesting_clinician}</span>
          )}
        </div>
        {primaryTransfer.created_date && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(parseISO(primaryTransfer.created_date), "MMM d, h:mm a")}
          </span>
        )}
      </div>

      {primaryTransfer.notes && (
        <p className="mt-2 text-xs text-white/40 italic border-t border-white/8 pt-2">{primaryTransfer.notes}</p>
      )}
    </div>
  );
}