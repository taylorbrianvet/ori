import React from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, CheckCircle2, Clock, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TransferCard({ transfer, onUpdated }) {
  const isPending = !transfer.already_transferred;

  const signalment = [
    transfer.age,
    transfer.sex,
    transfer.species,
    transfer.breed,
  ].filter(Boolean).join(" · ");

  const handleToggle = async () => {
    await base44.entities.InterserviceTransfer.update(transfer.id, {
      already_transferred: !transfer.already_transferred,
    });
    toast.success(transfer.already_transferred ? "Marked as pending." : "Marked as transferred.");
    onUpdated?.();
  };

  return (
    <div className={`glass-card p-4 transition-all ${isPending ? "border-white/15" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{transfer.patient_name}</span>
            {transfer.patient_id && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/45 font-mono">{transfer.patient_id}</span>
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

      {/* Service arrow */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/12 text-white/65 font-medium">{transfer.requesting_service}</span>
        <ArrowRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        <span className="px-2.5 py-1 rounded-lg bg-white/12 border border-white/18 text-white/85 font-medium">{transfer.receiving_service}</span>
      </div>

      {/* Problem list */}
      {(transfer.problem_list || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {transfer.problem_list.map((p, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-white/6 border border-white/10 text-white/55">{p}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-white/30">
        <div className="flex items-center gap-3">
          {transfer.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {transfer.location}
            </span>
          )}
          {transfer.requesting_clinician && (
            <span>{transfer.requesting_clinician}</span>
          )}
        </div>
        {transfer.created_date && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(parseISO(transfer.created_date), "MMM d, h:mm a")}
          </span>
        )}
      </div>

      {transfer.notes && (
        <p className="mt-2 text-xs text-white/40 italic border-t border-white/8 pt-2">{transfer.notes}</p>
      )}
    </div>
  );
}