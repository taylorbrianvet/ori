import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronDown } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import InpatientSection from "../components/board/InpatientSection";
import WoundPatientsSection from "../components/board/WoundPatientsSection";
import PendingTransfersSection from "../components/board/PendingTransfersSection";
import DiagnosticsSection from "../components/board/DiagnosticsSection";
import ClinicTeamSection from "../components/board/ClinicTeamSection";

const CLINICAL_SERVICES = [
  "Cardiology",
  "Dermatology",
  "Emergency",
  "Critical Care",
  "Internal Medicine",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedic Surgery",
  "Primary Care",
  "Soft Tissue Surgery"
];

export default function ServiceBoard() {
  const [selectedService, setSelectedService] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = localStorage.getItem("lastServiceBoard");
    return params.get("service") || saved || CLINICAL_SERVICES[0];
  });
  const [showServiceMenu, setShowServiceMenu] = useState(false);

  const handleServiceChange = (service) => {
    setSelectedService(service);
    localStorage.setItem("lastServiceBoard", service);
    window.history.replaceState({}, "", `${createPageUrl("ServiceBoard")}?service=${service}`);
    setShowServiceMenu(false);
  };

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list(),
  });

  const { data: woundCases = [] } = useQuery({
    queryKey: ["wound-cases"],
    queryFn: () => base44.entities.WoundCase.list(),
  });

  const { data: diagnostics = [] } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: () => base44.entities.Diagnostic.list(),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["interservice-transfers"],
    queryFn: () => base44.entities.InterserviceTransfer.list(),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["clinic-schedules"],
    queryFn: () => base44.entities.ClinicSchedule.list(),
  });

  // Filter data for selected service
  const inpatients = patients.filter(
    p => p.service === selectedService && p.patient_type === "Inpatient"
  );

  const woundPatients = woundCases.filter(w => w.service === selectedService);

  const pendingTransfers = transfers.filter(
    t => !t.already_transferred && t.receiving_service === selectedService
  );

  const pendingDiagnostics = diagnostics.filter(
    d => d.requesting_service === selectedService && !d.diagnostic_complete
  );

  const todaySchedules = schedules.filter(s => {
    const today = new Date().toISOString().split("T")[0];
    return s.service === selectedService && s.date === today;
  });

  return (
    <PageContainer>
      {/* Header with Service Switcher */}
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{selectedService}</h1>
        <p className="text-sm text-white/50">Board</p>
      </div>
      <div className="mb-4 flex items-start justify-end">
        <div>
        <div className="relative">
          <button
            onClick={() => setShowServiceMenu(!showServiceMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 hover:bg-white/12 text-white/70 hover:text-white text-xs font-medium transition-colors"
            title="Switch service"
          >
            Switch
            <ChevronDown className="w-3 h-3" />
          </button>

          {showServiceMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur border border-white/20 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {CLINICAL_SERVICES.map(service => (
                <button
                  key={service}
                  onClick={() => handleServiceChange(service)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedService === service
                      ? "bg-white/20 text-white border-l-2 border-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clinic Team Section */}
      <ClinicTeamSection schedules={todaySchedules} />

      {/* Three Column Layout */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Left: Inpatients */}
        <div>
          <InpatientSection patients={inpatients} compact />
        </div>

        {/* Center: Diagnostics */}
        <div>
          <DiagnosticsSection diagnostics={pendingDiagnostics} compact />
        </div>

        {/* Right: Wound Patients */}
        <div>
          <WoundPatientsSection woundCases={woundPatients} compact />
        </div>
      </div>

      {/* Bottom: Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <PendingTransfersSection transfers={pendingTransfers} />
      )}
    </PageContainer>
  );
}