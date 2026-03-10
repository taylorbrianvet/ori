import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import OnCallServicePanel from "../components/oncall/OnCallServicePanel";
import OnCallEditPanel from "../components/oncall/OnCallEditPanel";
import StudentScheduleView from "../components/oncall/StudentScheduleView";
import { Phone, Edit3, Users } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const ON_CALL_SERVICES = [
  "Emergency","Critical Care","HP TPE","Internal Medicine","Interventional Radiology",
  "Endoscopy","Cardiology","Surgery","Orthopedic Surgery","Neurosurgery","Neuromedicine",
  "Oncology","Ophthalmology","Radiology","Dermatology","Anesthesia","Pharmacy","Clinical Pathology"
];

const TABS = [
  { id: "current", label: "On Call", icon: Phone },
  { id: "edit", label: "Edit Schedule", icon: Edit3 },
  { id: "student", label: "Student Schedule", icon: Users },
];

export default function OnCall() {
  const [activeTab, setActiveTab] = useState("current");

  const { data: records = [] } = useQuery({
    queryKey: ["oncall-schedules"],
    queryFn: () => base44.entities.OnCallSchedule.list("-date", 2000),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list("-created_date", 200),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === "admin";
  const staffRecord = staff?.find(s => s.email === currentUser?.email);
  const canEditSchedule = isAdmin || staffRecord?.is_service_admin;

  return (
    <PageContainer>
      <PageHeader
        title="On Call"
        subtitle={format(new Date(), "EEEE, MMMM d, yyyy") + " · Shifts 8:00 AM → 8:00 AM"}
      />

      {/* Tabs — only show Edit tab if user has permission, Student tab if user is student */}
      <div className="flex gap-1 p-1 bg-white/8 backdrop-blur rounded-2xl mb-6 w-fit border border-white/10">
        {TABS.filter(t => 
          t.id === "current" || 
          (t.id === "edit" && canEditSchedule) ||
          (t.id === "student" && currentUser?.role === "student")
        ).map((tab) => (
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

      {/* Current On-Call View */}
      {activeTab === "current" && (
        <div className="space-y-2.5">
          {ON_CALL_SERVICES.map((svc, i) => (
            <OnCallServicePanel
              key={svc}
              service={svc}
              allRecords={records}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Edit Schedule View */}
      {activeTab === "edit" && canEditSchedule && (
        <OnCallEditPanel staff={staff} currentUser={currentUser} />
      )}
    </PageContainer>
  );
}