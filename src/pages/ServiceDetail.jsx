import React from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Megaphone,
  Users,
  CalendarDays,
  Wrench,
  DollarSign,
} from "lucide-react";

export default function ServiceDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get("id");

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
        <Link
          to={createPageUrl("Services")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
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

      {/* Staff */}
      <div className="mb-8">
        <SectionHeader title="Who's On Clinic" icon={Users} subtitle={`${staff.length} staff members`} />
        <StaffList staff={staff} />
      </div>

      {/* Schedule */}
      <div className="mb-8">
        <SectionHeader title="Schedule" icon={CalendarDays} />
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
    </PageContainer>
  );
}