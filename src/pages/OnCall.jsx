import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import SectionHeader from "../components/shared/SectionHeader";
import OnCallServiceCard from "../components/oncall/OnCallServiceCard";
import OnCallCalendar from "../components/oncall/OnCallCalendar";
import UpcomingShiftList from "../components/oncall/UpcomingShiftList";
import { Users, CalendarDays, Clock } from "lucide-react";

const TABS = [
  { id: "current", label: "Current", icon: Users },
  { id: "upcoming", label: "Upcoming", icon: Clock },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export default function OnCall() {
  const [activeTab, setActiveTab] = useState("current");
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: services } = useQuery({
    queryKey: ["services-all"],
    queryFn: () => base44.entities.Service.list("display_order"),
    initialData: [],
  });

  const { data: schedules } = useQuery({
    queryKey: ["schedules-all"],
    queryFn: () => base44.entities.Schedule.list("-date", 500),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  // Today's on-call entries grouped by service
  const todayOnCall = schedules.filter((s) => s.date === today && s.on_call);
  const activeServices = services.filter((s) => s.active !== false);

  // Only show services that have on-call entries today
  const servicesWithOnCall = activeServices.filter((svc) =>
    todayOnCall.some((e) => e.service_id === svc.id)
  );
  const servicesWithoutOnCall = activeServices.filter(
    (svc) => !todayOnCall.some((e) => e.service_id === svc.id)
  );

  const getEntriesForService = (serviceId) =>
    todayOnCall.filter((e) => e.service_id === serviceId);

  return (
    <PageContainer>
      <PageHeader
        title="On Call"
        subtitle={format(new Date(), "EEEE, MMMM d, yyyy")}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/8 backdrop-blur rounded-2xl mb-6 w-fit border border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white/20 text-white shadow-sm"
                : "text-white/45 hover:text-white/75"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Current Tab */}
      {activeTab === "current" && (
        <div>
          {servicesWithOnCall.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-white/50 text-sm">No on-call assignments recorded for today.</p>
            </div>
          ) : (
            <>
              <SectionHeader
                title="On Call Now"
                icon={Users}
                subtitle={`${servicesWithOnCall.length} active service${servicesWithOnCall.length !== 1 ? "s" : ""}`}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {servicesWithOnCall.map((svc, i) => (
                  <OnCallServiceCard
                    key={svc.id}
                    service={svc}
                    entries={getEntriesForService(svc.id)}
                    userMap={userMap}
                    index={i}
                    onClick={() => navigate(createPageUrl("OnCallDetail") + `?serviceId=${svc.id}`)}
                  />
                ))}
              </div>

              {servicesWithoutOnCall.length > 0 && (
                <div className="mt-8">
                  <SectionHeader title="No Assignment Today" subtitle="Services without on-call entries" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {servicesWithoutOnCall.map((svc) => (
                      <div
                        key={svc.id}
                        className="glass-card py-2.5 px-3 cursor-pointer hover:bg-white/12 transition-colors"
                        onClick={() => navigate(createPageUrl("OnCallDetail") + `?serviceId=${svc.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                          <p className="text-xs text-white/50 truncate">{svc.service_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Upcoming Tab */}
      {activeTab === "upcoming" && (
        <div>
          <SectionHeader title="Upcoming On-Call Shifts" icon={Clock} />
          <div className="glass-card p-4">
            <UpcomingShiftList schedules={schedules} services={services} userMap={userMap} />
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div>
          <SectionHeader title="Schedule Calendar" icon={CalendarDays} subtitle="Click a day to see details" />
          <OnCallCalendar schedules={schedules} services={services} />
        </div>
      )}
    </PageContainer>
  );
}