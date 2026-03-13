import React, { useState } from "react";
import { Beaker, Plus, CheckCircle2, Loader2, FlaskConical, Scan } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DiagnosticForm from "./DiagnosticForm";
import DiagnosticDetailModal from "./DiagnosticDetailModal";

const STATUS_CONFIG = {
  submitted: { label: "Submitted", color: "bg-blue-500/20 text-blue-300 border-blue-400/30" },
  processing: { label: "Processing", color: "bg-amber-500/20 text-amber-300 border-amber-400/30" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-300 border-green-400/30" },
  cleared: { label: "Cleared", color: "bg-white/10 text-white/40 border-white/15" },
};

function ClearConfirmModal({ diagnostic, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Clear Diagnostic Result</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Have you reviewed the results for <span className="text-white font-medium">{diagnostic.patient_name}</span> ({diagnostic.diagnostic_type}) and discussed with the owner if necessary?
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Yes, Clear It
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/12 text-white/60 text-sm font-medium transition-colors"
          >
            Not Yet
          </button>
        </div>
      </div>
    </div>
  );
}

function DiagnosticCard({ diagnostic, onClick }) {
  const status = diagnostic.status || (diagnostic.diagnostic_complete ? "completed" : diagnostic.sample_collected ? "processing" : "submitted");
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  const isImaging = diagnostic.request_category === "Imaging";

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-2 cursor-pointer hover:brightness-110 transition-all ${
        status === "completed" ? "border-green-400/20 bg-green-500/8" : "border-white/12 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isImaging
            ? <Scan className="w-3 h-3 text-purple-300 flex-shrink-0" />
            : <FlaskConical className="w-3 h-3 text-blue-300 flex-shrink-0" />
          }
          <span className="text-[11px] font-semibold text-white truncate">{diagnostic.patient_name}</span>
          {diagnostic.patient_id && <span className="text-[9px] text-white/35 font-mono flex-shrink-0">#{diagnostic.patient_id}</span>}
        </div>
        <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
      <div className="text-[10px] text-white/55 mt-0.5 truncate">
        {diagnostic.diagnostic_type}
        {diagnostic.requesting_clinician && <span className="text-white/35"> · {diagnostic.requesting_clinician}</span>}
      </div>
    </div>
  );
}

export default function DiagnosticsBoard({ diagnostics = [], staffList = [], selectedService = "", compact = false }) {
  const [showForm, setShowForm] = useState(false);
  const [clearTarget, setClearTarget] = useState(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState(null);
  const queryClient = useQueryClient();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["diagnostics"] });

  const handleStatusChange = async (id, newStatus, extra = {}) => {
    await base44.entities.Diagnostic.update(id, { status: newStatus, ...extra });
    refresh();
  };

  const handleClearConfirm = async () => {
    if (!clearTarget) return;
    setClearLoading(true);
    await base44.entities.Diagnostic.update(clearTarget.id, {
      status: "cleared",
      owner_communicated: true,
    });
    toast.success("Diagnostic cleared from board");
    setClearTarget(null);
    setClearLoading(false);
    refresh();
  };

  // Active = not cleared
  const active = diagnostics.filter(d => d.status !== "cleared");
  const pathology = active.filter(d => d.request_category === "Pathology" || (!d.request_category && d.diagnostic_type !== "Radiograph" && d.diagnostic_type !== "CT" && d.diagnostic_type !== "MRI" && d.diagnostic_type !== "Abdominal Ultrasound" && d.diagnostic_type !== "Fluoroscopy"));
  const imaging = active.filter(d => d.request_category === "Imaging" || ["Radiograph", "CT", "MRI", "Abdominal Ultrasound", "Fluoroscopy", "Other Imaging"].includes(d.diagnostic_type));

  if (compact) {
    return (
      <>
        <div className="glass-card p-3 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-white/70" />
              <h3 className="text-xs font-semibold text-white">Diagnostics ({active.length})</h3>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white/70 hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>

          {active.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11px] text-white/30 text-center">No pending diagnostics</p>
            </div>
          ) : (
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {active.map(d => (
                <DiagnosticCard
                  key={d.id}
                  diagnostic={d}
                  onClick={() => setSelectedDiagnostic(d)}
                />
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <DiagnosticForm
                staffList={staffList}
                prefillService={selectedService}
                onSaved={() => { setShowForm(false); refresh(); }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        {selectedDiagnostic && (
          <DiagnosticDetailModal
            diagnostic={selectedDiagnostic}
            onClose={() => setSelectedDiagnostic(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-white/70" />
          <h2 className="text-sm font-semibold text-white">
            Diagnostics <span className="text-white/45 font-normal">({active.length})</span>
          </h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/70 hover:text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Request
        </button>
      </div>

      {showForm && (
        <DiagnosticForm
          staffList={staffList}
          prefillService={selectedService}
          onSaved={() => { setShowForm(false); refresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {active.length === 0 && !showForm && (
        <p className="text-xs text-white/35 text-center py-6">No pending diagnostics — click "New Request" to add one.</p>
      )}

      {pathology.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <FlaskConical className="w-3.5 h-3.5 text-blue-300" />
            <h4 className="text-[11px] font-semibold text-white/55 uppercase tracking-wider">Pathology ({pathology.length})</h4>
          </div>
          <div className="space-y-2">
            {pathology.map(d => (
              <DiagnosticCard key={d.id} diagnostic={d} onClick={() => setSelectedDiagnostic(d)} />
            ))}
          </div>
        </div>
      )}

      {imaging.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Scan className="w-3.5 h-3.5 text-purple-300" />
            <h4 className="text-[11px] font-semibold text-white/55 uppercase tracking-wider">Imaging ({imaging.length})</h4>
          </div>
          <div className="space-y-2">
            {imaging.map(d => (
              <DiagnosticCard key={d.id} diagnostic={d} onClick={() => setSelectedDiagnostic(d)} />
            ))}
          </div>
        </div>
      )}

      {selectedDiagnostic && (
        <DiagnosticDetailModal
          diagnostic={selectedDiagnostic}
          onClose={() => setSelectedDiagnostic(null)}
        />
      )}
    </div>
  );
}