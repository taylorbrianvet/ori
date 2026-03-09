import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import SectionHeader from "../components/shared/SectionHeader";
import AnnouncementBanner from "../components/services/AnnouncementBanner";
import ServiceCard from "../components/services/ServiceCard";
import { Megaphone, Stethoscope } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Services() {
  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.list("display_order"),
    initialData: [],
  });

  const { data: announcements, isLoading: loadingAnn } = useQuery({
    queryKey: ["announcements-hospital"],
    queryFn: () => base44.entities.Announcement.filter({ active: true }, "-created_date"),
    initialData: [],
  });

  const hospitalAnnouncements = announcements.filter((a) => !a.service_id);
  const activeServices = services.filter((s) => s.active !== false);

  return (
    <PageContainer>
      <PageHeader title="Services" subtitle="Browse all hospital departments and services." />

      {loadingAnn ? (
        <div className="space-y-3 mb-6">
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {hospitalAnnouncements.length > 0 && (
            <div className="mb-8">
              <SectionHeader title="Announcements" icon={Megaphone} subtitle="Hospital-wide updates" />
              <AnnouncementBanner announcements={hospitalAnnouncements} />
            </div>
          )}
        </>
      )}

      <SectionHeader title="Departments" icon={Stethoscope} subtitle={`${activeServices.length} active services`} />

      {loadingServices ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeServices.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}