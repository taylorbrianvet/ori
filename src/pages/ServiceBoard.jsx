import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft } from "lucide-react";
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
    return params.get("service") || CLINICAL_SERVICES[0];
  });

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
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{selectedService}</h1>
        <p className="text-sm text-white/50">Board</p>
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