import React from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { CheckCircle2, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function DiagnosticList({ diagnostics, title, isCompleted = false, onRefetch }) {
  const handleCollectSample = async (id) => {
    try {
      await base44.entities.Diagnostic.update(id, { sample_collected: true });
      toast.success("Sample marked as collected");
      onRefetch();
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const handleComplete = async (id) => {
    try {
      await base44.entities.Diagnostic.update(id, { 
        diagnostic_complete: true,
        completion_time: new Date().toISOString()
      });
      toast.success("Diagnostic marked as complete");
      onRefetch();
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const handleClear = async (id) => {
    try {
      await base44.entities.Diagnostic.delete(id);
      toast.success("Diagnostic cleared");
      onRefetch();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="glass-card p-4 mb-4">
      <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">{title}</h4>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-white/75">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-2 py-1.5 text-white/60 font-semibold">Patient ID</th>
              <th className="text-left px-2 py-1.5 text-white/60 font-semibold">Type</th>
              <th className="text-left px-2 py-1.5 text-white/60 font-semibold">Sample</th>
              {title === "Histopathology" && <th className="text-left px-2 py-1.5 text-white/60 font-semibold">Location</th>}
              <th className="text-left px-2 py-1.5 text-white/60 font-semibold">Clinician</th>
              <th className="text-left px-2 py-1.5 text-white/60 font-semibold">Collected</th>
              <th className="text-left px-2 py-1.5 text-white/60 font-semibold">Complete</th>
              <th className="text-center px-2 py-1.5 text-white/60 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {diagnostics.map(d => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-2 py-1.5">{d.patient_id}</td>
                <td className="px-2 py-1.5">{d.diagnostic_type}</td>
                <td className="px-2 py-1.5">{d.sample_type}</td>
                {title === "Histopathology" && <td className="px-2 py-1.5">{d.location || "—"}</td>}
                <td className="px-2 py-1.5">{d.requesting_clinician}</td>
                <td className="px-2 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    d.sample_collected 
                      ? "bg-green-500/20 text-green-300" 
                      : "bg-red-500/20 text-red-300"
                  }`}>
                    {d.sample_collected ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    d.diagnostic_complete 
                      ? "bg-green-500/20 text-green-300" 
                      : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {d.diagnostic_complete ? "Yes" : "Pending"}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  {!isCompleted && (
                    <div className="flex items-center justify-center gap-1">
                      {!d.sample_collected && (
                        <button
                          onClick={() => handleCollectSample(d.id)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-colors"
                        >
                          Collect
                        </button>
                      )}
                      {!d.diagnostic_complete && (
                        <button
                          onClick={() => handleComplete(d.id)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30 transition-colors"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  )}
                  {isCompleted && (
                    <button
                      onClick={() => handleClear(d.id)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 border border-white/12 text-white/60 hover:bg-white/12 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}