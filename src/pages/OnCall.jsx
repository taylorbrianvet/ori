import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import GlassCard from "../components/shared/GlassCard";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnCall() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["oncall-today", today],
    queryFn: () => base44.entities.Schedule.filter({ date: today, on_call: true }),
    initialData: [],
  });

  const { data: services } = useQuery({
    queryKey: ["services-all"],
    queryFn: () => base44.entities.Service.list(),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return (
    <PageContainer>
      <PageHeader title="On Call" subtitle={`Today · ${format(new Date(), "EEEE, MMMM d, yyyy")}`} />

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground text-center py-8">No on-call assignments for today.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {schedules.map((sch) => {
            const service = serviceMap[sch.service_id];
            const user = userMap[sch.user_id];
            return (
              <GlassCard key={sch.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {(sch.user_name || user?.full_name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{sch.user_name || user?.full_name || "Unknown"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="text-[10px] bg-primary/10 text-primary">{service?.service_name || "Service"}</Badge>
                    {sch.start_time && sch.end_time && (
                      <span className="text-[11px] text-muted-foreground">{sch.start_time} – {sch.end_time}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {user?.phone && (
                    <a href={`tel:${user.phone}`} className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-green-600" />
                    </a>
                  )}
                  {user?.phone && (
                    <a href={`sms:${user.phone}`} className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    </a>
                  )}
                  {user?.email && (
                    <a href={`mailto:${user.email}`} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                    </a>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}