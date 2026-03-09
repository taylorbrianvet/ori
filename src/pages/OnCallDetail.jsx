import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageContainer from "../components/shared/PageContainer";
import SectionHeader from "../components/shared/SectionHeader";
import TeamRosterMiniBlock from "../components/oncall/TeamRosterMiniBlock";
import OnCallCalendar from "../components/oncall/OnCallCalendar";
import UpcomingShiftList from "../components/oncall/UpcomingShiftList";
import { ArrowLeft, Users, CalendarDays, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function groupByTeam(entries) {
  const teams = {};
  for (const e of entries) {
    const key = e.team_name || "Team";
    if (!teams[key]) teams[key] = { faculty: [], residents: [], interns: [] };
    const sub = (e.subtype || "").toLowerCase();
    if (sub === "faculty") teams[key].faculty.push(e);
    else if (sub === "intern") teams[key].interns.push(e);
    else teams[key].residents.push(e);
  }
  return teams;
}

export default function OnCallDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get("serviceId");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["services-all"],
    queryFn: () => base44.entities.Service.list(),
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

  const service = services.find((s) => s.id === serviceId);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const serviceSchedules = schedules.filter((s) => s.service_id === serviceId);
  const todayOnCall = serviceSchedules.filter((s) => s.date === today && s.on_call);
  const todayClinic = serviceSchedules.filter((s) => s.date === today && s.on_clinic);

  const onCallTeams = groupByTeam(todayOnCall);
  const clinicTeams = groupByTeam(todayClinic);
  const teamKeys = Object.keys(onCallTeams);
  const multiTeam = teamKeys.length > 1;
  const clinicTeamKeys = Object.keys(clinicTeams);

  if (loadingServices) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back */}
      <Link
        to={createPageUrl("OnCall")}
        className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white/80 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        On Call
      </Link>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
          {service?.service_name || "Service"}
        </h1>
        <p className="text-sm text-white/45 mt-1">On-Call Overview · {format(new Date(), "EEEE, MMMM d")}</p>
      </div>

      {/* On Call Now */}
      <div className="mb-8">
        <SectionHeader title="On Call Today" icon={Users} subtitle={`${todayOnCall.length} assignment${todayOnCall.length !== 1 ? "s" : ""}`} />
        <div className="glass-card p-5">
          {todayOnCall.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-4">No on-call assignments today.</p>
          ) : (
            teamKeys.map((key) => (
              <TeamRosterMiniBlock
                key={key}
                teamLabel={multiTeam ? key : null}
                faculty={onCallTeams[key].faculty}
                residents={onCallTeams[key].residents}
                interns={onCallTeams[key].interns}
                userMap={userMap}
              />
            ))
          )}
        </div>
      </div>

      {/* Clinic Today */}
      {todayClinic.length > 0 && (
        <div className="mb-8">
          <SectionHeader title="On Clinic Today" icon={Users} subtitle={`${todayClinic.length} assignment${todayClinic.length !== 1 ? "s" : ""}`} />
          <div className="glass-card p-5">
            {clinicTeamKeys.map((key) => (
              <TeamRosterMiniBlock
                key={key}
                teamLabel={clinicTeamKeys.length > 1 ? key : null}
                faculty={clinicTeams[key].faculty}
                residents={clinicTeams[key].residents}
                interns={clinicTeams[key].interns}
                userMap={userMap}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="mb-8">
        <SectionHeader title="Upcoming Shifts" icon={Clock} />
        <div className="glass-card p-4">
          <UpcomingShiftList
            schedules={serviceSchedules}
            services={services}
            userMap={userMap}
          />
        </div>
      </div>

      {/* Calendar */}
      <div className="mb-8">
        <SectionHeader title="Schedule Calendar" icon={CalendarDays} />
        <OnCallCalendar schedules={serviceSchedules} services={services} />
      </div>
    </PageContainer>
  );
}