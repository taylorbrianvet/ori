import React from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { CheckCircle2, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function PharmacyRequestList({ requests, title, status, onRefetch }) {
  const handleComplete = async (id) => {
    try {
      await base44.entities.PharmacyRefillRequest.update(id, { status: "completed" });
      toast.success("Request marked as completed");
      onRefetch();
    } catch (e) {
      toast.error("Failed to update request");
    }
  };

  const handleApprove = async (id) => {
    try {
      await base44.entities.PharmacyRefillRequest.update(id, { status: "approved" });
      toast.success("Request approved");
      onRefetch();
    } catch (e) {
      toast.error("Failed to approve request");
    }
  };

  return (
    <div className="glass-card p-4 mb-6">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>

      <div className="space-y-2">
        {requests.map(req => (
          <div key={req.id} className="p-3 rounded-lg bg-white/6 border border-white/12">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">{req.patient_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 font-mono">{req.patient_id}</span>
                </div>
                <p className="text-xs text-white/70">{req.medication}</p>
                <p className="text-[11px] text-white/50 mt-1">{req.clinician_name} ({req.clinician_role}) • {req.service}</p>
              </div>
              <div className="flex items-center gap-1">
                {status === "pending" && (
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 hover:bg-blue-500/30 text-blue-300 text-[11px] font-medium transition-colors"
                  >
                    Approve
                  </button>
                )}
                {status === "approved" && (
                  <button
                    onClick={() => handleComplete(req.id)}
                    className="px-2 py-1 rounded-lg bg-green-500/20 border border-green-400/30 hover:bg-green-500/30 text-green-300 text-[11px] font-medium transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Complete
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-white/60">{req.instructions}</p>
            <p className="text-[10px] text-white/40 mt-1">Quantity: {req.quantity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}