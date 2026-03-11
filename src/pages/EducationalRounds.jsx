import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { startOfWeek, addDays, format, isSameDay, endOfWeek } from "date-fns";
import { Plus } from "lucide-react";
import WeekNav from "../components/rounds/WeekNav";
import RoundRow from "../components/rounds/RoundRow";
import RoundDetailModal from "../components/rounds/RoundDetailModal";

export default function EducationalRoundsPage() {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedRound, setSelectedRound] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const { data: allRounds = [] } = useQuery({
    queryKey: ["educational-rounds"],
    queryFn: () => base44.entities.EducationalRound.list("-date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === "admin";
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  // Filter approved rounds for this week
  const weekRounds = useMemo(() => {
    return allRounds.filter(r => {
      if (r.approval_status !== "approved") return false;
      const d = new Date(r.date);
      return d >= weekStart && d <= weekEnd;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allRounds, weekStart, weekEnd]);

  // Split into weekdays (Mon-Fri) and weekends (Sat-Sun)
  const weekdayRounds = weekRounds.filter(r => {
    const d = new Date(r.date);
    const day = d.getDay();
    return day > 0 && day < 6;
  });

  const weekendRounds = weekRounds.filter(r => {
    const d = new Date(r.date);
    const day = d.getDay();
    return day === 0 || day === 6;
  });

  const handleEditRound = (round) => {
    setSelectedRound(round);
    setShowForm(true);
  };

  const handleAddEvent = () => {
    setSelectedRound(null);
    setShowForm(true);
  };

  const handleRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ["educational-rounds"] });
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Educational Events</h1>
          <p className="text-sm text-white/40 mt-1">View and manage scheduled events</p>
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

      <WeekNav weekStart={weekStart} onPrev={() => setWeekStart(d => addDays(d, -7))} onNext={() => setWeekStart(d => addDays(d, 7))} />

      {/* Weekdays */}
      {weekdayRounds.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs uppercase font-semibold text-white/50 mb-3">Monday – Friday</h2>
          <div className="space-y-2">
            {weekdayRounds.map(r => (
              <RoundRow
                key={r.id}
                round={r}
                onClick={() => isAdmin && handleEditRound(r)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Weekends */}
      {weekendRounds.length > 0 && (
        <div>
          <h2 className="text-xs uppercase font-semibold text-white/50 mb-3">Saturday & Sunday</h2>
          <div className="space-y-2">
            {weekendRounds.map(r => (
              <RoundRow
                key={r.id}
                round={r}
                onClick={() => isAdmin && handleEditRound(r)}
              />
            ))}
          </div>
        </div>
      )}

      {weekRounds.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/40">No approved events this week</p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRound && showForm && (
          <RoundDetailModal
            round={selectedRound}
            onClose={() => setShowForm(false)}
            onSaved={handleRefetch}
            staffList={staffList}
          />
        )}
      </AnimatePresence>
    </div>
  );
}