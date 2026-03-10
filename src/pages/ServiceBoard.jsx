import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import ServiceSelector from "../components/board/ServiceSelector";
import InpatientSection from "../components/board/InpatientSection";
import WoundPatientsSection from "../components/board/WoundPatientsSection";
import OncologySection from "../components/board/OncologySection";
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
  const [selectedService, setSelectedService] = useState(CLINICAL_SERVICES[0] || "");
  const queryClient = useQueryClient();

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

  const oncologyPatients = selectedService === "Oncology" || selectedService === "Medical Oncology"
    ? patients.filter(
        p => (p.service === "Medical Oncology" || p.service === "Radiation Oncology") && p.patient_type === "Outpatient"
      )
    : [];

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
      <div className="mb-5">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-4">Service Board</h1>
        <ServiceSelector
          services={CLINICAL_SERVICES}
          selectedService={selectedService}
          onSelectService={setSelectedService}
        />
      </div>

      {/* Clinic Team Section */}
      {selectedService && (
        <ClinicTeamSection schedules={todaySchedules} />
      )}

      {/* Inpatients Section */}
      {inpatients.length > 0 && (
        <InpatientSection patients={inpatients} />
      )}

      {/* Oncology Patients Section */}
      {oncologyPatients.length > 0 && (
        <OncologySection patients={oncologyPatients} />
      )}

      {/* Wound Patients Section */}
      {woundPatients.length > 0 && (
        <WoundPatientsSection woundCases={woundPatients} />
      )}

      {/* Pending Transfers Section */}
      {pendingTransfers.length > 0 && (
        <PendingTransfersSection transfers={pendingTransfers} />
      )}

      {/* Diagnostics Section */}
      {pendingDiagnostics.length > 0 && (
        <DiagnosticsSection diagnostics={pendingDiagnostics} />
      )}

      {/* Empty state */}
      {inpatients.length === 0 && woundPatients.length === 0 && pendingTransfers.length === 0 && pendingDiagnostics.length === 0 && (
        <div className="text-center py-12 text-white/25">
          <p>No active patients or diagnostics for {selectedService}</p>
        </div>
      )}
    </PageContainer>
  );
}