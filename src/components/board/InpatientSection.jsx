import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Users, AlertCircle, UserX, ArrowLeftRight } from "lucide-react";
import { calculateCurrentAge } from "@/components/shared/ageCalculator";
import PatientDetailModal from "./PatientDetailModal";

export default function InpatientSection({ patients, compact = false }) {
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch all GlobalPatients for the patients list
  const globalPatientIds = useMemo(() => [...new Set(patients.map(p => p.global_patient_id).filter(Boolean))], [patients]);
  const { data: globalPatients = [] } = useQuery({
    queryKey: ["global-patients-batch", globalPatientIds.join(",")],
    queryFn: () => globalPatientIds.length > 0 
      ? Promise.all(globalPatientIds.map(id => base44.entities.GlobalPatient.filter({ id }).then(r => r?.[0])))
      : [],
    enabled: globalPatientIds.length > 0,
  });

  const globalPatientMap = useMemo(() => 
    Object.fromEntries(globalPatients.map(gp => [gp?.id, gp])),
    [globalPatients]
  );

  const signalment = (p) => {
    const globalPatient = globalPatientMap[p.global_patient_id];
    const ageDisplay = globalPatient?.birthdate ? calculateCurrentAge(globalPatient.birthdate) : (p.age_years && `${p.age_years}y`);
    return [ageDisplay, p.sex, p.species]
      .filter(Boolean)
      .join(" • ");
  };

  const isOverdue = (p) => {
    if (p.discharge_status !== "scheduled" || !p.scheduled_discharge_time) return false;
    const s = /[Z+\-]\d*$/.test(p.scheduled_discharge_time) ? p.scheduled_discharge_time : p.scheduled_discharge_time + "Z";
    return new Date(s) < new Date(Date.now() - 60 * 60 * 1000);
  };

  const TransferBadge = ({ patient }) => {
    if (patient.transfer_type === "double" && !patient.primary_service_claimed) {
      return (
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-200">
          <AlertCircle className="w-2.5 h-2.5" /> Double Tx
        </span>
      );
    }
    if (patient.transfer_type === "single") {
      return (
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/25 text-sky-200">
          <ArrowLeftRight className="w-2.5 h-2.5" /> Transfer
        </span>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <>
        <div className="glass-card p-3 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-white/70" />
            <h3 className="text-xs font-semibold text-white">
              Inpatients ({patients.length})
            </h3>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-2.5 rounded-lg border hover:opacity-90 transition-colors text-[11px] ${
                  p.transfer_type === "double" && !p.primary_service_claimed
                    ? "bg-gradient-to-br from-red-500/15 to-red-500/8 border-red-400/25"
                    : "bg-gradient-to-br from-white/15 to-white/10 border-white/20 hover:from-white/20 hover:to-white/15"
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="font-semibold text-white">{p.name}</span>
                  <TransferBadge patient={p} />
                  {!p.primary_clinician && (
                    <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/35 text-amber-200">
                      <UserX className="w-2.5 h-2.5" /> No Clinician
                    </span>
                  )}
                  {p.discharge_status === "scheduled" && !isOverdue(p) && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-200">
                      DC Scheduled
                    </span>
                  )}
                  {isOverdue(p) && (
                    <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/25 border border-orange-400/35 text-orange-200 animate-pulse">
                      <AlertCircle className="w-2.5 h-2.5" /> DC Overdue
                    </span>
                  )}
                </div>
                <div className="text-white/70 text-[10px]">{signalment(p)}</div>
                {p.problem_list?.length > 0 && (
                  <div className="text-[9px] text-white/50 mt-0.5">
                    {p.problem_list.slice(0, 1).join(", ")}
                    {p.problem_list.length > 1 && ` +${p.problem_list.length - 1}`}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedPatient && (
          <PatientDetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-white/70" />
          <h2 className="text-sm font-semibold text-white">
            Inpatients <span className="text-white/50 font-normal">({patients.length})</span>
          </h2>
        </div>

        <div className="space-y-2">
          {patients.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className="w-full text-left p-3 rounded-lg bg-white/6 border border-white/12 hover:bg-white/10 transition-colors"
            >
              <div className="font-semibold text-white text-sm">{p.name}</div>
              <p className="text-xs text-white/50">{signalment(p)}</p>
              {p.primary_clinician && (
                <p className="text-xs text-white/50 mt-1">Clinician: {p.primary_clinician}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedPatient && (
        <PatientDetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </>
  );
}