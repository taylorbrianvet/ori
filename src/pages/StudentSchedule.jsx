import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageContainer from "@/components/shared/PageContainer";
import { startOfDay, addDays, addWeeks } from "date-fns";
import StudentScheduleView from "@/components/oncall/StudentScheduleView";

const SERVICE_DEFAULTS = {
  Anesthesia: 3,
  Surgery: 2,
  Neurosurgery: 2,
};

function getActiveBlock(blocks, service) {
  // Active block = most recent start_date where 8am has passed
  const now = new Date();
  const relevant = blocks
    .filter((b) => b.service === service)
    .map((b) => ({ ...b, startMs: new Date(b.start_date + "T08:00:00").getTime() }))
    .filter((b) => b.startMs <= now.getTime())
    .sort((a, b) => b.startMs - a.startMs);

  if (relevant.length === 0) return null;

  const current = relevant[0];

  // Find the next block start after the current one
  const allSorted = blocks
    .filter((b) => b.service === service)
    .map((b) => ({ ...b, startMs: new Date(b.start_date + "T08:00:00").getTime() }))
    .sort((a, b) => a.startMs - b.startMs);

  const currentIdx = allSorted.findIndex((b) => b.start_date === current.start_date);
  const nextBlock = allSorted[currentIdx + 1];

  let numWeeks;
  if (nextBlock) {
    const diffDays = Math.round((nextBlock.startMs - current.startMs) / (1000 * 60 * 60 * 24));
    numWeeks = Math.max(1, Math.round(diffDays / 7));
  } else {
    numWeeks = SERVICE_DEFAULTS[service];
  }

  return {
    startDate: new Date(current.start_date + "T08:00:00"),
    numWeeks,
  };
}

export default function StudentSchedule() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedService, setSelectedService] = useState("Neurosurgery");
  const [allBlocks, setAllBlocks] = useState(null);

  useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
    }).catch(() => {}).finally(() => setAuthChecked(true));

    base44.entities.RotationBlock.list().then(setAllBlocks).catch(() => setAllBlocks([]));
  }, []);

  if (!authChecked || allBlocks === null) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-white/70">Loading...</p>
        </div>
      </PageContainer>
    );
  }

  // Derive active block for selected service
  const activeBlock = getActiveBlock(allBlocks, selectedService);
  // Fallback: use today's date with default weeks if no blocks configured
  const blockStartDate = activeBlock?.startDate ?? startOfDay(new Date());
  const numWeeks = activeBlock?.numWeeks ?? SERVICE_DEFAULTS[selectedService];

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
          blockStartDate={blockStartDate}
          numWeeks={numWeeks}
          currentUser={currentUser}
        />
      </div>
    </PageContainer>
  );
}