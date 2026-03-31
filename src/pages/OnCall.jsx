import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import OnCallServicePanel from "../components/oncall/OnCallServicePanel";
import OnCallEditPanel from "../components/oncall/OnCallEditPanel";
import StudentScheduleView from "../components/oncall/StudentScheduleView";
import { Phone, Edit3, Users } from "lucide-react";

const ON_CALL_SERVICES = [
  "Emergency","Critical Care","HP TPE","Internal Medicine","Interventional Radiology",
  "Endoscopy","Cardiology","Surgery","Orthopedic Surgery","Neurosurgery","Neuromedicine",
  "Oncology","Ophthalmology","Radiology","Dermatology","Anesthesia","Pharmacy","Clinical Pathology"
];

const SERVICE_DEFAULTS = { Anesthesia: 3, Surgery: 2, Neurosurgery: 2 };

function getActiveBlock(blocks, service) {
  const now = new Date();
  const relevant = blocks
    .filter((b) => b.service === service)
    .map((b) => ({ ...b, startMs: new Date(b.start_date + "T08:00:00").getTime() }))
    .filter((b) => b.startMs <= now.getTime())
    .sort((a, b) => b.startMs - a.startMs);
  if (relevant.length === 0) return null;
  const current = relevant[0];
  const allSorted = blocks
    .filter((b) => b.service === service)
    .map((b) => ({ ...b, startMs: new Date(b.start_date + "T08:00:00").getTime() }))
    .sort((a, b) => a.startMs - b.startMs);
  const currentIdx = allSorted.findIndex((b) => b.start_date === current.start_date);
  const nextBlock = allSorted[currentIdx + 1];
  const numWeeks = nextBlock
    ? Math.max(1, Math.round((nextBlock.startMs - current.startMs) / (1000 * 60 * 60 * 24 * 7)))
    : SERVICE_DEFAULTS[service];
  return { startDate: new Date(current.start_date + "T08:00:00"), numWeeks };
}

function StudentScheduleTab({ rotationBlocks, currentUser }) {
  const [studentService, setStudentService] = useState("Neurosurgery");
  const block = getActiveBlock(rotationBlocks, studentService);
  const blockStartDate = block?.startDate ?? startOfDay(new Date());
  const numWeeks = block?.numWeeks ?? SERVICE_DEFAULTS[studentService];
  return (
    <div>
      <div className="flex gap-3 mb-6">
        {["Neurosurgery", "Surgery", "Anesthesia"].map((svc) => (
          <button
            key={svc}
            onClick={() => setStudentService(svc)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              studentService === svc
                ? "bg-white text-slate-700 border border-slate-300 shadow-sm"
                : "bg-white/50 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700"
            }`}
          >
            {svc}
          </button>
        ))}
      </div>
      <StudentScheduleView
        service={studentService}
        blockStartDate={blockStartDate}
        numWeeks={numWeeks}
        currentUser={currentUser}
        canEdit={currentUser?.role === "Faculty" || currentUser?.role === "Resident" || currentUser?.role === "admin"}
      />
    </div>
  );
}

const TABS = [
  { id: "current", label: "On-Call", icon: Phone },
  { id: "edit", label: "Edit Schedule", icon: Edit3 },
  { id: "student", label: "Student Schedule", icon: Users },
];

export default function OnCall() {
  const [activeTab, setActiveTab] = useState("current");

  const { data: records = [] } = useQuery({
    queryKey: ["oncall-schedules"],
    queryFn: () => base44.entities.OnCallSchedule.list("-date", 2000),
  });

  const { data: rotationBlocks = [] } = useQuery({
    queryKey: ["rotation-blocks-all"],
    queryFn: () => base44.entities.RotationBlock.list(),
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
        title="On-Call"
        subtitle={format(new Date(), "EEEE, MMMM d, yyyy") + " · Shifts 8:00 AM → 8:00 AM"}
      />

      {/* Tabs — only show Edit tab if user has permission, Student tab if user is student/faculty/resident */}
      <div className="flex gap-1 p-1 bg-slate-200/50 backdrop-blur rounded-2xl mb-6 w-fit border border-slate-200">
        {TABS.filter(t => 
          t.id === "current" || 
          (t.id === "edit" && canEditSchedule) ||
          (t.id === "student" && (currentUser?.role === "Student" || currentUser?.role === "Faculty" || currentUser?.role === "Resident" || currentUser?.role === "admin"))
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-slate-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
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

      {/* Student Schedule View */}
      {activeTab === "student" && (currentUser?.role === "Student" || currentUser?.role === "Faculty" || currentUser?.role === "Resident" || currentUser?.role === "admin") && (
        <StudentScheduleTab rotationBlocks={rotationBlocks} currentUser={currentUser} />
      )}
    </PageContainer>
  );
}