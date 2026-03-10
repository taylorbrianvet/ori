import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, parseISO } from "date-fns";
import { CheckCircle, Clock, Activity, Loader2 } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  in_progress: { label: "In Progress", icon: Activity, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  complete: { label: "Complete", icon: CheckCircle, color: "text-green-400 bg-green-400/10 border-green-400/20" },
};

export default function ConsultBoard({ serviceName }) {
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { data: consults = [], isLoading } = useQuery({
    queryKey: ["consults", serviceName, todayStr],
    queryFn: () => base44.entities.ConsultRequest.filter(
      { consulting_service: serviceName, consult_date: todayStr },
      "-created_date"
    ),
    refetchInterval: 30000,
  });

  const updateStatus = async (id, status) => {
    setUpdating(id);
    await base44.entities.ConsultRequest.update(id, { status });
    queryClient.invalidateQueries({ queryKey: ["consults", serviceName, todayStr] });
    setUpdating(null);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-6 text-white/30 text-xs">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading consults…
    </div>
  );

  return (
    <div className="space-y-2">
      {consults.length === 0 ? (
        <p className="text-xs text-white/30 text-center py-6">No consult requests today.</p>
      ) : (
        consults.map(c => {
          const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          return (
            <div key={c.id} className={`rounded-xl border p-3 ${c.status === "complete" ? "opacity-50" : ""} bg-white/4 border-white/10`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white truncate">{c.patient_name}</span>
                    {c.patient_case_number && <span className="text-[10px] text-white/30">#{c.patient_case_number}</span>}
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed mb-1">{c.reason_for_consult}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-white/35">
                    {c.species && <span>{c.species}</span>}
                    {c.breed && <span>· {c.breed}</span>}
                    {c.age_years && <span>· {c.age_years}y</span>}
                    {c.sex && <span>· {c.sex}</span>}
                  </div>
                  <div className="mt-1.5 text-[10px] text-white/40">
                    From: <span className="text-white/60">{c.requesting_clinician}</span> ({c.requesting_service})
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                    <Icon className="w-2.5 h-2.5" /> {cfg.label}
                  </span>
                  {c.status !== "complete" && (
                    <div className="flex gap-1">
                      {c.status === "pending" && (
                        <button onClick={() => updateStatus(c.id, "in_progress")} disabled={updating === c.id}
                          className="text-[10px] px-2 py-1 rounded-lg bg-blue-400/10 border border-blue-400/20 text-blue-300 hover:bg-blue-400/20 transition-colors">
                          Start
                        </button>
                      )}
                      <button onClick={() => updateStatus(c.id, "complete")} disabled={updating === c.id}
                        className="text-[10px] px-2 py-1 rounded-lg bg-green-400/10 border border-green-400/20 text-green-300 hover:bg-green-400/20 transition-colors">
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}