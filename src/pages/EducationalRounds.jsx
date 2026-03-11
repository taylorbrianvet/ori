import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import SectionHeader from "../components/shared/SectionHeader";
import EducationalRoundForm from "../components/rounds/EducationalRoundForm";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { startOfWeek, addDays, format, isSameDay } from "date-fns";

const DEPARTMENTS = ["Surgery", "Internal Medicine", "Emergency & Critical Care", "Neurology", "Oncology", "Dermatology", "Cardiology", "Ophthalmology", "Radiology", "Anesthesia"];

export default function EducationalRoundsPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);

  const { data: allRounds = [] } = useQuery({
    queryKey: ["educational-rounds-all"],
    queryFn: () => base44.entities.EducationalRound.list("-created_date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === "admin";

  // Calculate week range
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter rounds: only approved ones for the current week
  const weekRounds = useMemo(() => {
    return allRounds.filter(r => {
      if (r.approval_status !== "approved") return false;
      const roundDate = r.date ? new Date(r.date) : null;
      return weekDays.some(d => isSameDay(d, roundDate));
    });
  }, [allRounds, weekDays]);

  // Group rounds by date
  const roundsByDate = useMemo(() => {
    const grouped = {};
    weekDays.forEach(d => {
      grouped[format(d, "yyyy-MM-dd")] = [];
    });
    weekRounds.forEach(r => {
      const key = r.date;
      if (key && grouped[key]) {
        grouped[key].push(r);
      }
    });
    return grouped;
  }, [weekRounds, weekDays]);

  // Filter by department (if selected) - seminars always show
  const getVisibleRounds = (dateRounds) => {
    return dateRounds.filter(r => {
      if (r.event_type === "Seminar") return true;
      if (!selectedDepartment) return true;
      return r.departments?.includes(selectedDepartment);
    });
  };

  const handleEditRound = (round) => {
    setSelectedRound(round);
    setShowForm(true);
  };

  const handleAddEvent = () => {
    setSelectedRound(null);
    setShowForm(true);
  };

  const handleRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ["educational-rounds-all"] });
  };

  const navigateWeek = (direction) => {
    setCurrentDate(prev => addDays(prev, direction * 7));
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
              title="Educational Events"
              subtitle={`Week of ${format(weekStart, "MMMM d, yyyy")}`}
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleAddEvent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          )}
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-white/60">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/50 font-medium">Filter:</span>
          <button
            onClick={() => setSelectedDepartment(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedDepartment === null
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            All Departments
          </button>
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDepartment === dept
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Weekly Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dateRounds = roundsByDate[dateKey] || [];
            const visibleRounds = getVisibleRounds(dateRounds);
            const isWeekend = idx === 5 || idx === 6;

            return (
              <div
                key={dateKey}
                className={`rounded-xl border p-3 min-h-[200px] ${
                  isWeekend
                    ? "bg-white/3 border-white/8"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="font-semibold text-white text-sm mb-3">
                  {format(day, "EEE")}
                  <div className="text-xs text-white/50 font-normal">
                    {format(day, "M/d")}
                  </div>
                </div>

                <div className="space-y-2">
                  {visibleRounds.length === 0 ? (
                    <p className="text-[10px] text-white/25">No events</p>
                  ) : (
                    visibleRounds.map(round => (
                      <button
                        key={round.id}
                        onClick={() => isAdmin && handleEditRound(round)}
                        disabled={!isAdmin}
                        className={`w-full text-left p-2 rounded-lg text-[10px] transition-all ${
                          round.event_type === "Seminar"
                            ? "bg-purple-500/20 border border-purple-400/30 hover:bg-purple-500/30 text-purple-200"
                            : "bg-blue-500/20 border border-blue-400/30 hover:bg-blue-500/30 text-blue-200"
                        } ${!isAdmin && "cursor-default"}`}
                      >
                        <div className="font-semibold line-clamp-1">
                          {round.event_type}
                        </div>
                        {round.topic && (
                          <div className="text-[9px] text-white/60 line-clamp-1">
                            {round.topic}
                          </div>
                        )}
                        {round.event_type !== "Seminar" && round.departments && (
                          <div className="text-[9px] text-white/40 line-clamp-1">
                            {round.departments.join(", ")}
                          </div>
                        )}
                        {round.event_type === "Seminar" && (
                          <div className="text-[9px] text-white/50 font-medium">
                            All Departments
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {showForm && (
          <EducationalRoundForm
            round={selectedRound}
            onClose={() => setShowForm(false)}
            onSaved={handleRefetch}
            staffList={staffList}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}