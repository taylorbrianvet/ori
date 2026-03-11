import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Clock } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

function formatCreated(dateStr) {
  if (!dateStr) return "";
  try {
    const raw = /[Z+\-]\d*$/.test(dateStr) ? dateStr : dateStr + "Z";
    return formatDistanceToNow(new Date(raw), { addSuffix: true });
  } catch { return ""; }
}

// Returns true if a completed refill should still show (within 2 hours)
function isWithinTwoHours(dateStr) {
  if (!dateStr) return false;
  try {
    const raw = /[Z+\-]\d*$/.test(dateStr) ? dateStr : dateStr + "Z";
    return Date.now() - new Date(raw).getTime() < 2 * 60 * 60 * 1000;
  } catch { return false; }
}

export default function WorkspaceRefillsPanel({ refills, onRefetch }) {
  // Show pending + recently-completed (within 2 hrs)
  const visible = useMemo(() => {
    return refills.filter(r => {
      if (r.status === "pending") return true;
      if (r.status === "approved") return isWithinTwoHours(r.updated_date || r.created_date);
      return false;
    });
  }, [refills]);

  if (visible.length === 0) return null;

  const handleFill = async (r) => {
    await base44.entities.PharmacyRefillRequest.update(r.id, { status: "approved", quantity: 0 });
    toast.success("Marked as filled — will clear from your view in 2 hours");
    onRefetch();
  };

  const handleUnfill = async (r) => {
    await base44.entities.PharmacyRefillRequest.update(r.id, { status: "pending" });
    toast.success("Moved back to pending");
    onRefetch();
  };

  const pendingCount = visible.filter(r => r.status === "pending").length;
  const filledCount = visible.filter(r => r.status === "approved").length;

  return (
    <div className="glass-card p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-white">
          Pending Refills
          <span className="ml-2 text-[10px] font-normal text-white/40">
            {pendingCount} pending{filledCount > 0 ? ` · ${filledCount} filled` : ""}
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {visible.map(r => {
          const isFilled = r.status === "approved";
          return (
            <div
              key={r.id}
              className={`p-3 rounded-xl border text-[11px] transition-all ${
                isFilled
                  ? "bg-green-500/8 border-green-400/20"
                  : "bg-white/6 border-white/12"
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{r.patient_name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/50">{r.patient_id}</span>
                    {isFilled && (
                      <span className="flex items-center gap-1 text-[10px] text-green-300 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Filled
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 font-medium mt-0.5">{r.medication}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!isFilled ? (
                    <button
                      onClick={() => handleFill(r)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/20 border border-green-400/30 hover:bg-green-500/30 text-green-300 text-[11px] font-medium transition-colors whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Mark Filled
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnfill(r)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/8 border border-white/15 hover:bg-white/14 text-white/50 text-[10px] font-medium transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" /> Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1 text-white/55">
                <p><span className="text-white/30">Instructions:</span> {r.instructions}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px]">
                  <span><span className="text-white/30">Qty:</span> {r.quantity}</span>
                  <span><span className="text-white/30">Service:</span> {r.service}</span>
                  <span><span className="text-white/30">Clinician:</span> {r.clinician_name}</span>
                  {r.last_prescribed_date && (
                    <span><span className="text-white/30">Last prescribed:</span> {formatDate(r.last_prescribed_date)}</span>
                  )}
                  <span><span className="text-white/30">Requested:</span> {formatCreated(r.created_date)}</span>
                </div>
              </div>

              {/* 2-hour notice for filled */}
              {isFilled && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-green-300/60">
                  <Clock className="w-3 h-3" />
                  This notification will clear within 2 hours.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}