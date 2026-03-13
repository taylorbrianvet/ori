import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ChevronDown } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import InpatientSection from "../components/board/InpatientSection";
import WoundPatientsSection from "../components/board/WoundPatientsSection";
import PendingTransfersSection from "../components/board/PendingTransfersSection";
import DiagnosticsBoard from "../components/diagnostics/DiagnosticsBoard";
import ClinicTeamSection from "../components/board/ClinicTeamSection";
import DischargedTodaySection from "../components/board/DischargedTodaySection";
import AppointmentsSection from "../components/board/AppointmentsSection";

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
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = base44.entities.PatientVisit.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["patient-visits"] });
    });
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  const handleServiceChange = (service) => {
    setSelectedService(service);
    localStorage.setItem("lastServiceBoard", service);
    window.history.replaceState({}, "", `${createPageUrl("ServiceBoard")}?service=${service}`);
    setShowServiceMenu(false);
  };

  const { data: patientVisits = [] } = useQuery({
    queryKey: ["patient-visits"],
    queryFn: () => base44.entities.PatientVisit.list(),
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

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list(),
  });

  // Filter data for selected service
  const inpatients = patientVisits.filter(
    p => p.involved_services?.includes(selectedService) &&
    p.patient_type === "Inpatient" &&
    p.discharge_status !== "discharged"
  );

  const appointments = patientVisits.filter(
    p => p.involved_services?.includes(selectedService) &&
    p.patient_type === "Appointment"
  );

  const today = new Date().toISOString().split("T")[0];
  const dischargedToday = patientVisits.filter(p => {
    if (!p.involved_services?.includes(selectedService) || p.discharge_status !== "discharged") return false;
    if (!p.scheduled_discharge_time) return false;
    const dcDate = new Date(p.scheduled_discharge_time).toISOString().split("T")[0];
    return dcDate === today;
  });

  const woundPatients = woundCases.filter(w => w.service === selectedService);

  // Upcoming transfers: only show transfers submitted within the current 6AM→6AM window
  // and whose patient has not yet been promoted to "transferred_in".
  const now = new Date();
  // Calculate today's 6AM in America/Chicago by using local offset logic
  const sixAmToday = new Date(now);
  sixAmToday.setHours(6, 0, 0, 0);
  // If it's before 6AM today, the window started at 6AM yesterday
  if (now < sixAmToday) sixAmToday.setDate(sixAmToday.getDate() - 1);
  const sixAmTomorrow = new Date(sixAmToday);
  sixAmTomorrow.setDate(sixAmTomorrow.getDate() + 1);

  const promotedPatientIds = new Set(
    patientVisits
      .filter(p => p.patient_type === "Inpatient" && p.discharge_status !== "discharged" && p.transfer_status === "transferred_in")
      .map(p => p.global_patient_id)
      .filter(Boolean)
  );

  const pendingTransfers = transfers.filter(t => {
    if (!t.created_date) return false;
    const created = new Date(t.created_date);
    // Must be within current 6AM→6AM window
    if (created < sixAmToday || created >= sixAmTomorrow) return false;
    // Hide if the patient has already been promoted to transferred_in
    if (t.global_patient_id && promotedPatientIds.has(t.global_patient_id)) return false;
    if (t.receiving_services?.length > 0) return t.receiving_services.includes(selectedService);
    return t.receiving_service === selectedService;
  });

  const pendingDiagnostics = diagnostics.filter(
    d => d.requesting_service === selectedService && d.status !== "cleared" && !d.diagnostic_complete
  );

  const todaySchedules = schedules.filter(s => {
    const todayStr = new Date().toISOString().split("T")[0];
    return s.service === selectedService && s.date === todayStr;
  });

  return (
    <PageContainer>
      {/* Header with Service Switcher */}
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{selectedService}</h1>
        <p className="text-sm text-white/50">Board</p>
      </div>
      <div className="mb-4 flex items-start justify-end">
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
          <DiagnosticsBoard
            diagnostics={pendingDiagnostics}
            staffList={staffList}
            selectedService={selectedService}
            compact
          />
        </div>

        {/* Right: Wound Patients */}
        <div>
          <WoundPatientsSection woundCases={woundPatients} compact />
        </div>
      </div>

      {/* Discharged Today */}
      <DischargedTodaySection patients={dischargedToday} />

      {/* Bottom: Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <PendingTransfersSection transfers={pendingTransfers} />
      )}
    </PageContainer>
  );
}