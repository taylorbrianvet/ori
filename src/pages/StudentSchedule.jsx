import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageContainer from "@/components/shared/PageContainer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfDay, addDays, startOfWeek, isWithinInterval } from "date-fns";
import StudentScheduleView from "@/components/oncall/StudentScheduleView";

export default function StudentSchedule() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isStudent, setIsStudent] = useState(false);
  const [selectedService, setSelectedService] = useState("Neurosurgery");
  const [blockStartDate, setBlockStartDate] = useState(null);
  const [anesthesiaStartDate, setAnesthesiaStartDate] = useState(null);

  useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
      setIsStudent(user?.role === "student");
      
      // For 2-week services (Neurosurgery, Surgery): yesterday
      const today = startOfDay(new Date());
      const yesterday = addDays(today, -1);
      setBlockStartDate(yesterday);

      // For 3-week service (Anesthesia): fetch from admin config or use yesterday
      if (user?.anesthesia_block_start_date) {
        setAnesthesiaStartDate(new Date(user.anesthesia_block_start_date));
      } else {
        setAnesthesiaStartDate(yesterday);
      }
    }).catch(() => {});
  }, []);

  if (!isStudent) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-white/70">Only students can access the student schedule.</p>
        </div>
      </PageContainer>
    );
  }

  if (!blockStartDate) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-white/70">Loading...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Student On-Call Schedule</h1>
        
        {/* Service Selector */}
        <div className="flex gap-3 mb-6">
          {["Neurosurgery", "Surgery", "Anesthesia"].map((service) => (
            <button
              key={service}
              onClick={() => setSelectedService(service)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedService === service
                  ? "bg-white/20 text-white border border-white/40"
                  : "bg-white/8 text-white/70 border border-white/12 hover:bg-white/12 hover:text-white"
              }`}
            >
              {service}
            </button>
          ))}
        </div>

        {/* Schedule View */}
        <StudentScheduleView
          service={selectedService}
          blockStartDate={selectedService === "Anesthesia" ? anesthesiaStartDate : blockStartDate}
          blockType={selectedService === "Anesthesia" ? "3-week" : "2-week"}
          currentUser={currentUser}
        />
      </div>
    </PageContainer>
  );
}