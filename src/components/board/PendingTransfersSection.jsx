import React, { useState, useMemo } from "react";
import { ArrowLeftRight, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { calculateCurrentAge } from "../shared/ageCalculator";
import TransferDetailModal from "./TransferDetailModal";

export default function PendingTransfersSection({ transfers, onTransfersUpdated }) {
   const [selectedTransfer, setSelectedTransfer] = useState(null);

   // Fetch all global patients referenced by transfers to get birthdates
   const globalPatientIds = useMemo(() => 
     Array.from(new Set(transfers.map(t => t.global_patient_id).filter(Boolean))),
     [transfers]
   );

   const { data: globalPatientMap = {} } = useQuery({
     queryKey: ["global-patients-batch", globalPatientIds],
     queryFn: async () => {
       if (globalPatientIds.length === 0) return {};
       const patients = await base44.entities.GlobalPatient.filter({
         id: { $in: globalPatientIds }
       });
       return Object.fromEntries(patients.map(p => [p.id, p]));
     },
     enabled: globalPatientIds.length > 0,
   });



  const receivingLabel = (t) => {
    if (t.receiving_services?.length > 0) return t.receiving_services.join(" + ");
    return t.receiving_service || "?";
  };

  const isDouble = (t) => (t.receiving_services?.length > 1);

  const getAgeString = (transfer) => {
    // If from global patient, use calculated age from birthdate
    if (transfer.global_patient_id && globalPatientMap[transfer.global_patient_id]?.birthdate) {
      return calculateCurrentAge(globalPatientMap[transfer.global_patient_id].birthdate);
    }
    // Otherwise use form age data
    const parts = [];
    if (transfer.age_years) parts.push(`${transfer.age_years}y`);
    if (transfer.age_months) parts.push(`${transfer.age_months}m`);
    if (transfer.age_weeks) parts.push(`${transfer.age_weeks}w`);
    return parts.length > 0 ? parts.join(" ") : "?";
  };

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeftRight className="w-5 h-5 text-white/70" />
        <h2 className="text-sm font-semibold text-white">
          Upcoming Transfers <span className="text-white/50 font-normal">({transfers.length})</span>
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
                  Upcoming
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
            <p className="text-xs text-white/50 mb-1">{getAgeString(t)} • {t.sex || "?"} • {t.species} • {t.breed}</p>
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