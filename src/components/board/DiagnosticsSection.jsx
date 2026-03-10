import React from "react";
import { Beaker } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function DiagnosticsSection({ diagnostics }) {
  // Separate histopathology from other diagnostics
  const histopath = diagnostics.filter(d => d.diagnostic_type === "Histopathology");
  const others = diagnostics.filter(d => d.diagnostic_type !== "Histopathology");

  const renderDiagnosticTable = (items, title) => (
    <div className="mb-4">
      {title && <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-white/75">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-2 py-1 text-white/60 font-semibold">Patient ID</th>
              <th className="text-left px-2 py-1 text-white/60 font-semibold">Type</th>
              <th className="text-left px-2 py-1 text-white/60 font-semibold">Sample</th>
              {title === "Histopathology" && <th className="text-left px-2 py-1 text-white/60 font-semibold">Location</th>}
              <th className="text-left px-2 py-1 text-white/60 font-semibold">Clinician</th>
              <th className="text-left px-2 py-1 text-white/60 font-semibold">Collected</th>
              <th className="text-left px-2 py-1 text-white/60 font-semibold">Complete</th>
            </tr>
          </thead>
          <tbody>
            {items.map(d => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Beaker className="w-5 h-5 text-white/70" />
        <h2 className="text-sm font-semibold text-white">
          Pending Diagnostics <span className="text-white/50 font-normal">({diagnostics.length})</span>
        </h2>
      </div>

      {histopath.length > 0 && renderDiagnosticTable(histopath, "Histopathology")}
      {others.length > 0 && renderDiagnosticTable(others, "Other Diagnostics")}
    </div>
  );
}