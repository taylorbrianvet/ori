import React from "react";
import { ArrowLeftRight } from "lucide-react";

export default function PendingTransfersSection({ transfers }) {
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
          <div key={t.id} className="p-3 rounded-lg bg-white/6 border border-white/12">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-semibold text-white text-sm">{t.patient_name}</div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200">
                Pending
              </span>
            </div>
            <p className="text-xs text-white/50 mb-1">{t.age || "?"} • {t.sex || "?"} • {t.species} • {t.breed}</p>
            <p className="text-xs text-white/70 mb-1">{t.requesting_service} → {t.receiving_service}</p>
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