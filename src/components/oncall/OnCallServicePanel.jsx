import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CalendarDays } from "lucide-react";
import { format, addDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import OnCallPersonRow from "./OnCallPersonRow";
import ShiftCountdown from "./ShiftCountdown";
import OnCallMiniCalendar from "./OnCallMiniCalendar";

function getShiftDate() {
  // Shift is keyed by the date it starts (8am). If before 8am, still on yesterday's shift.
  const now = new Date();
  if (now.getHours() < 8) {
    return format(addDays(now, -1), "yyyy-MM-dd");
  }
  return format(now, "yyyy-MM-dd");
}

function EntriesBlock({ entries, label }) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1">{label}</p>
      {entries.map((e, i) => (
        <OnCallPersonRow
          key={i}
          slot={e.slot}
          name={e.name}
          role={e.role}
          phone={e.phone}
          email={e.email}
        />
      ))}
    </div>
  );
}

function buildSlots(record) {
  if (!record) return [];
  const slots = [];
  if (record.primary_name) slots.push({ slot: "primary", name: record.primary_name, role: record.primary_role, phone: record.primary_phone, email: record.primary_email });
  if (record.secondary_name) slots.push({ slot: "secondary", name: record.secondary_name, role: record.secondary_role, phone: record.secondary_phone, email: record.secondary_email });
  if (record.tertiary_name) slots.push({ slot: "tertiary", name: record.tertiary_name, role: record.tertiary_role, phone: record.tertiary_phone, email: record.tertiary_email });
  return slots;
}

export default function OnCallServicePanel({ service, allRecords, index }) {
  const [expanded, setExpanded] = useState(false);
  const [showNextShift, setShowNextShift] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const shiftDate = getShiftDate();
  const nextShiftDate = format(addDays(new Date(shiftDate), 1), "yyyy-MM-dd");

  const { data: studentSchedules = [] } = useQuery({
    queryKey: ["student-on-call-schedules"],
    queryFn: () => base44.entities.StudentOnCallSchedule.list(),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const currentRecord = allRecords.find((r) => r.service === service && r.date === shiftDate);
  const nextRecord = allRecords.find((r) => r.service === service && r.date === nextShiftDate);

  const currentSlots = buildSlots(currentRecord);
  const nextSlots = buildSlots(nextRecord);
  const hasData = currentSlots.length > 0;

  // Get current student assignments (primary and secondary)
  const currentStudents = studentSchedules.filter((s) => s.date === shiftDate && s.service === service).sort((a, b) => a.position === "primary" ? -1 : 1).map(s => {
    const studentInfo = staff.find(st => st.email === s.student_email);
    return { ...s, phone: studentInfo?.phone };
  });
  
  // Get next shift student assignments
  const nextStudents = studentSchedules.filter((s) => s.date === nextShiftDate && s.service === service).sort((a, b) => a.position === "primary" ? -1 : 1).map(s => {
    const studentInfo = staff.find(st => st.email === s.student_email);
    return { ...s, phone: studentInfo?.phone };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div className="glass-card overflow-hidden">
        {/* Service header button */}
        <button
          onClick={() => { setExpanded(!expanded); setShowNextShift(false); setShowCalendar(false); }}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${hasData ? "bg-green-400 shadow-sm shadow-green-400/50" : "bg-white/20"}`} />
            <span className="text-sm font-semibold text-white">{service}</span>
            {hasData && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-300 font-medium">
                {currentSlots.length} on call
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-white/35 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-white/8">
                {/* Current date label */}
                <p className="text-[11px] text-white/35 pt-3 pb-2">
                  {format(new Date(shiftDate + "T12:00:00"), "EEEE, MMMM d")} · 8:00 AM → {format(addDays(new Date(shiftDate + "T12:00:00"), 1), "MMMM d")} 8:00 AM
                </p>

                {/* Countdown if within 2hrs */}
                <ShiftCountdown onViewNext={() => { setShowNextShift(true); setShowCalendar(false); }} />

                {/* Current or next shift */}
                {showNextShift ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-amber-200">Next Shift — {format(new Date(nextShiftDate + "T12:00:00"), "MMMM d")}</p>
                      <button onClick={() => setShowNextShift(false)} className="text-[10px] text-white/35 hover:text-white/60">← Current</button>
                    </div>
                    {nextSlots.length === 0 ? (
                      <p className="text-xs text-white/35 italic">No data for next shift yet.</p>
                    ) : nextSlots.map((s, i) => (
                      <OnCallPersonRow key={i} {...s} />
                    ))}
                    {/* Next shift students */}
                    {nextStudents.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1">Students On Call</p>
                        {nextStudents.map((s, i) => (
                          <OnCallPersonRow
                            key={i}
                            slot={s.position}
                            name={s.student_name}
                            phone={s.phone}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {hasData ? currentSlots.map((s, i) => (
                      <OnCallPersonRow key={i} {...s} />
                    )) : (
                      <p className="text-xs text-white/35 italic py-2">No on-call data for today.</p>
                    )}
                    {/* Current shift students */}
                    {currentStudents.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1">Students On Call</p>
                        {currentStudents.map((s, i) => (
                          <OnCallPersonRow
                            key={i}
                            slot={s.position}
                            name={s.student_name}
                            phone={s.phone}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/8">
                  <button
                    onClick={() => { setShowCalendar(!showCalendar); setShowNextShift(false); }}
                    className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 bg-white/6 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    {showCalendar ? "Hide Calendar" : "See Calendar"}
                  </button>
                </div>

                {/* Mini calendar */}
                {showCalendar && (
                  <div className="mt-3">
                    <OnCallMiniCalendar service={service} records={allRecords} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}