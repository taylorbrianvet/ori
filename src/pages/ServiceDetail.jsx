import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageContainer from "../components/shared/PageContainer";
import SectionHeader from "../components/shared/SectionHeader";
import AnnouncementBanner from "../components/services/AnnouncementBanner";
import StaffList from "../components/service-detail/StaffList";
import ScheduleCalendar from "../components/service-detail/ScheduleCalendar";
import EquipmentList from "../components/service-detail/EquipmentList";
import EstimateList from "../components/service-detail/EstimateList";
import TodaysClinicTeam from "../components/clinic/TodaysClinicTeam";
import ConsultBoard from "../components/clinic/ConsultBoard";
import ConsultRequestForm from "../components/clinic/ConsultRequestForm";
import { AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Megaphone, Users, CalendarDays, Wrench, DollarSign,
  ClipboardPlus, MessageSquare,
} from "lucide-react";

// Map service entity name to ClinicSchedule service name
const SERVICE_NAME_MAP = {
  "Soft Tissue Surgery": "Soft Tissue Surgery",
  "Orthopedic Surgery": "Orthopedic Surgery",
  "Internal Medicine": "Internal Medicine",
  "Anesthesia": "Anesthesia",
  "Neurology": "Neurology",
  "Emergency": "Emergency",
  "Critical Care": "Critical Care",
  "Cardiology": "Cardiology",
  "Dermatology": "Dermatology",
  "Medical Oncology": "Medical Oncology",
  "Radiation Oncology": "Radiation Oncology",
  "Ophthalmology": "Ophthalmology",
  "Radiology": "Radiology",
};

export default function ServiceDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get("id");
  const [showConsultForm, setShowConsultForm] = useState(false);

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const results = await base44.entities.Service.filter({ id: serviceId });
      return results[0] || null;
    },
    enabled: !!serviceId,
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements-service", serviceId],
    queryFn: () => base44.entities.Announcement.filter({ service_id: serviceId, active: true }, "-created_date"),
    enabled: !!serviceId,
    initialData: [],
  });

  const { data: staff } = useQuery({
    queryKey: ["staff-service", serviceId],
    queryFn: () => base44.entities.User.filter({ primary_service: serviceId }),
    enabled: !!serviceId,
    initialData: [],
  });

  const { data: schedules } = useQuery({
    queryKey: ["schedules-service", serviceId],
    queryFn: () => base44.entities.Schedule.filter({ service_id: serviceId }),
    enabled: !!serviceId,
    initialData: [],
  });

  const { data: equipment } = useQuery({
    queryKey: ["equipment-service", serviceId],
    queryFn: () => base44.entities.Equipment.filter({ service_id: serviceId }),
    enabled: !!serviceId,
    initialData: [],
  });

  const { data: estimates } = useQuery({
    queryKey: ["estimates-service", serviceId],
    queryFn: () => base44.entities.Estimate.filter({ service_id: serviceId }),
    enabled: !!serviceId,
    initialData: [],
  });

  const { data: allStaff = [] } = useQuery({
    queryKey: ["staff-all-for-consult"],
    queryFn: () => base44.entities.Staff.list(),
  });

  // Clinic schedules for this service
  const serviceName = service ? (SERVICE_NAME_MAP[service.service_name] || service.service_name) : null;

  const { data: clinicSchedules = [] } = useQuery({
    queryKey: ["clinic-schedules", serviceName],
    queryFn: () => base44.entities.ClinicSchedule.filter({ service: serviceName }, "date"),
    enabled: !!serviceName,
  });

  // Find on_consults entry for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const consultEntry = clinicSchedules.find(e => e.date === todayStr && e.on_consults);
  const onConsultsServiceName = consultEntry ? serviceName : null;

  if (loadingService) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-8" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (!service) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Service not found.</p>
          <Link to={createPageUrl("Services")} className="text-primary font-medium text-sm hover:underline">
            ← Back to Services
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-8">
        <Link to={createPageUrl("Services")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </Link>
        <div className="flex items-center gap-4">
          {service.service_image_url ? (
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
              <img src={service.service_image_url} alt={service.service_name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">{service.service_name?.charAt(0)}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">{service.service_name}</h1>
            {service.service_subtext && (
              <p className="text-sm text-muted-foreground mt-0.5">{service.service_subtext}</p>
            )}
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="mb-8">
          <SectionHeader title="Announcements" icon={Megaphone} />
          <AnnouncementBanner announcements={announcements} />
        </div>
      )}

      {/* Who's On Clinic Today */}
      {serviceName && (
        <div className="mb-8">
          <SectionHeader title="Who's On Clinic Today" icon={Users} />
          <TodaysClinicTeam clinicSchedules={clinicSchedules} serviceName={serviceName} />
        </div>
      )}

      {/* Consult Board */}
      {serviceName && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Consult Board" icon={MessageSquare} />
            <button onClick={() => setShowConsultForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/18 border border-white/15 text-xs text-white/70 hover:text-white transition-colors">
              <ClipboardPlus className="w-3.5 h-3.5" />
              Request Consult
            </button>
          </div>
          <ConsultBoard serviceName={serviceName} />
        </div>
      )}

      {/* Schedule (on-call type) */}
      <div className="mb-8">
        <SectionHeader title="On-Call Schedule" icon={CalendarDays} />
        <ScheduleCalendar schedules={schedules} />
      </div>

      {/* Equipment */}
      <div className="mb-8">
        <SectionHeader title="Equipment Status" icon={Wrench} subtitle={`${equipment.length} items`} />
        <EquipmentList equipment={equipment} />
      </div>

      {/* Estimates */}
      <div className="mb-8">
        <SectionHeader title="Procedure Estimates" icon={DollarSign} subtitle={`${estimates.length} procedures`} />
        <EstimateList estimates={estimates} />
      </div>

      {/* Consult Request Form */}
      <AnimatePresence>
        {showConsultForm && (
          <ConsultRequestForm
            onClose={() => setShowConsultForm(false)}
            onSuccess={() => {}}
            consultingService={serviceName}
            staffList={allStaff}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}