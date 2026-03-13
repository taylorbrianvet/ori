import React, { useState } from "react";
import { X, FlaskConical, Scan, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_CONFIG = {
  submitted: { label: "Submitted", color: "bg-blue-500/20 text-blue-300 border-blue-400/30" },
  processing: { label: "Processing", color: "bg-amber-500/20 text-amber-300 border-amber-400/30" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-300 border-green-400/30" },
  cleared: { label: "Cleared", color: "bg-white/10 text-white/40 border-white/15" },
};

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[11px] text-white/40 w-28 flex-shrink-0">{label}</span>
      <span className="text-[11px] text-white/80">{value}</span>
    </div>
  );
}

export default function DiagnosticDetailModal({ diagnostic, onClose }) {
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const queryClient = useQueryClient();

  const status = diagnostic.status || (diagnostic.diagnostic_complete ? "completed" : diagnostic.sample_collected ? "processing" : "submitted");
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  const isImaging = diagnostic.request_category === "Imaging";

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["diagnostics"] });

  const handleStatus = async (newStatus, extra = {}) => {
    setLoading(true);
    await base44.entities.Diagnostic.update(diagnostic.id, { status: newStatus, ...extra });
    toast.success(`Marked as ${STATUS_CONFIG[newStatus]?.label}`);
    refresh();
    setLoading(false);
    onClose();
  };

  const handleClear = async () => {
    setLoading(true);
    await base44.entities.Diagnostic.update(diagnostic.id, { status: "cleared", owner_communicated: true });
    toast.success("Diagnostic cleared from board");
    refresh();
    setLoading(false);
    onClose();
  };

  const submittedDate = diagnostic.created_date
    ? format(new Date(diagnostic.created_date), "MMM d, yyyy h:mm a")
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {isImaging
              ? <Scan className="w-4 h-4 text-purple-300 flex-shrink-0" />
              : <FlaskConical className="w-4 h-4 text-blue-300 flex-shrink-0" />
            }
            <div>
              <h2 className="text-sm font-semibold text-white">{diagnostic.patient_name}</h2>
              {diagnostic.patient_id && (
                <p className="text-[10px] text-white/40 font-mono">#{diagnostic.patient_id}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
              {cfg.label}
            </span>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 bg-white/5 rounded-xl p-3">
          <Row label="Type" value={diagnostic.diagnostic_type} />
          <Row label="Category" value={diagnostic.request_category} />
          <Row label="Sample Type" value={diagnostic.sample_type} />
          <Row label="Location" value={diagnostic.location} />
          <Row label="Clinician" value={diagnostic.requesting_clinician} />
          <Row label="Service" value={diagnostic.requesting_service} />
          <Row label="Submitted" value={submittedDate} />
          {diagnostic.notes && (
            <div className="pt-1 border-t border-white/10 mt-1">
              <p className="text-[11px] text-white/40 mb-0.5">Notes</p>
              <p className="text-[11px] text-white/70">{diagnostic.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!showClearConfirm && (
          <div className="flex gap-2 flex-wrap">
            {status === "submitted" && (
              <button
                onClick={() => handleStatus("processing")}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/25 text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Mark Processing
              </button>
            )}
            {status === "processing" && (
              <button
                onClick={() => handleStatus("completed", { completion_time: new Date().toISOString() })}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-400/25 text-green-300 hover:bg-green-500/25 transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Mark Completed
              </button>
            )}
            {status === "completed" && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs px-3 py-1.5 rounded-xl bg-white/8 border border-white/15 text-white/55 hover:bg-white/14 hover:text-white transition-colors"
              >
                Clear from Board
              </button>
            )}
          </div>
        )}

        {showClearConfirm && (
          <div className="bg-white/5 rounded-xl p-3 space-y-2">
            <p className="text-xs text-white/70">
              Have you reviewed results and discussed with the owner if necessary?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Yes, Clear It
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-1.5 rounded-xl bg-white/6 border border-white/12 text-white/60 text-xs font-medium transition-colors hover:bg-white/10"
              >
                Not Yet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}