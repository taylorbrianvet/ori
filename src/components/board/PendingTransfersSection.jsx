import React, { useState } from "react";
import { ArrowLeftRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function PendingTransfersSection({ transfers }) {
  const [markingId, setMarkingId] = useState(null);
  const queryClient = useQueryClient();

  const handleMarkTransferred = async (transfer) => {
    setMarkingId(transfer.id);
    try {
      await base44.entities.InterserviceTransfer.update(transfer.id, { already_transferred: true });
      toast.success(`${transfer.patient_name} marked as transferred`);
      queryClient.invalidateQueries({ queryKey: ["interservice-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    } catch (err) {
      toast.error("Failed to update transfer status");
    }
    setMarkingId(null);
  };

  const receivingLabel = (t) => {
    if (t.receiving_services?.length > 0) return t.receiving_services.join(" + ");
    return t.receiving_service || "?";
  };

  const isDouble = (t) => (t.receiving_services?.length > 1);

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeftRight className="w-5 h-5 text-white/70" />
        <h2 className="text-sm font-semibold text-white">
          Pending Transfers <span className="text-white/50 font-normal">({transfers.length})</span>
        </h2>
      </div>

      <div className="space-y-2">
        {transfers.map(t => (
          <div key={t.id} className={`p-3 rounded-lg border ${isDouble(t) ? "bg-red-500/8 border-red-400/25" : "bg-white/6 border-white/12"}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-white text-sm">{t.patient_name}</div>
                {isDouble(t) && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-200">
                    <AlertCircle className="w-3 h-3" /> Double
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200">
                  Pending
                </span>
                <button
                  onClick={() => handleMarkTransferred(t)}
                  disabled={markingId === t.id}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-200 hover:bg-green-500/35 transition-colors disabled:opacity-50"
                >
                  {markingId === t.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CheckCircle2 className="w-3 h-3" />}
                  Mark Transferred
                </button>
              </div>
            </div>
            <p className="text-xs text-white/50 mb-1">{t.age || "?"} • {t.sex || "?"} • {t.species} • {t.breed}</p>
            <p className="text-xs text-white/70 mb-1">{t.requesting_service} → {receivingLabel(t)}</p>
            {t.problem_list?.length > 0 && (
              <p className="text-[11px] text-white/60 mb-1">
                {t.problem_list.slice(0, 2).join(", ")}
                {t.problem_list.length > 2 && ` +${t.problem_list.length - 2}`}
              </p>
            )}
            {t.estimate && <p className="text-xs text-white/60 mt-1">Est: ${t.estimate.toLocaleString()}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}