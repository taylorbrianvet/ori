import React, { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Plus, ArrowUpCircle, Loader2, Clock, Stethoscope, X } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import NewAppointmentForm from "./NewAppointmentForm";
import AppointmentDetailModal from "./AppointmentDetailModal";

const APPOINTMENT_REASON_COLORS = {
  Surgery: "bg-red-500/15 border-red-400/25 text-red-200",
  Recheck: "bg-sky-500/15 border-sky-400/25 text-sky-200",
  Consult: "bg-violet-500/15 border-violet-400/25 text-violet-200",
  "Tech Appointment": "bg-teal-500/15 border-teal-400/25 text-teal-200",
  "General Appointment": "bg-white/8 border-white/15 text-white/65",
  Other: "bg-white/8 border-white/15 text-white/65",
};

function AppointmentCard({ appt, onAdmit, admitting, onClick }) {
  const timeStr = appt.appointment_datetime
    ? (() => {
        const s = /[Z+\-]\d*$/.test(appt.appointment_datetime)
          ? appt.appointment_datetime
          : appt.appointment_datetime + "Z";
        return format(new Date(s), "h:mm a");
      })()
    : null;

  const reasonColor = APPOINTMENT_REASON_COLORS[appt.appointment_reason] || APPOINTMENT_REASON_COLORS.Other;

  return (
    <div
      className={`rounded-xl border p-3 space-y-2 cursor-pointer hover:brightness-110 transition-all ${reasonColor}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{appt.name}</p>
          <p className="text-[11px] text-white/50">
            {[appt.species, appt.breed].filter(Boolean).join(" · ")}
          </p>
        </div>
        {timeStr && (
          <div className="flex items-center gap-1 flex-shrink-0 text-[11px] text-white/60">
            <Clock className="w-3 h-3" />
            {timeStr}
          </div>
        )}
      </div>

      {appt.appointment_reason && (
        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-black/20 border border-white/10 text-white/70">
          {appt.appointment_reason}
        </span>
      )}

      {appt.appointment_clinician && (
        <div className="flex items-center gap-1 text-[11px] text-white/55">
          <Stethoscope className="w-3 h-3" />
          {appt.appointment_clinician}
        </div>
      )}

      {appt.appointment_notes && (
        <p className="text-[10px] text-white/40 line-clamp-2">{appt.appointment_notes}</p>
      )}

      <button
        onClick={e => { e.stopPropagation(); onAdmit(appt); }}
        disabled={admitting === appt.id}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500/20 border border-green-400/30 text-green-200 text-[11px] font-medium hover:bg-green-500/35 transition-colors disabled:opacity-50"
      >
        {admitting === appt.id
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <ArrowUpCircle className="w-3 h-3" />
        }
        Admit as Inpatient
      </button>
    </div>
  );
}

export default function AppointmentsSection({ appointments, selectedService }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [admitting, setAdmitting] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const queryClient = useQueryClient();

  // Filter appointments for the viewed date
  const dayAppointments = appointments.filter(appt => {
    if (!appt.appointment_datetime) return false;
    const s = /[Z+\-]\d*$/.test(appt.appointment_datetime)
      ? appt.appointment_datetime
      : appt.appointment_datetime + "Z";
    return isSameDay(new Date(s), viewDate);
  }).sort((a, b) => {
    return new Date(a.appointment_datetime) - new Date(b.appointment_datetime);
  });

  const handleAdmit = async (appt) => {
    setAdmitting(appt.id);
    await base44.entities.PatientVisit.update(appt.id, {
      patient_type: "Inpatient",
      discharge_status: "active",
      originated_from_appointment: true,
      // Reduce involved_services to the single admitting service
      involved_services: appt.involved_services?.length > 0
        ? [appt.involved_services[0]]
        : [selectedService],
    });
    toast.success(`${appt.name} admitted as Inpatient`);
    queryClient.invalidateQueries({ queryKey: ["patient-visits"] });
    setAdmitting(null);
  };

  const isToday = isSameDay(viewDate, new Date());

  return (
    <div className="glass-card p-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-white/70" />
          <h3 className="text-xs font-semibold text-white">
            Appointments
            {dayAppointments.length > 0 && (
              <span className="ml-1 text-white/40 font-normal">({dayAppointments.length})</span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Date navigator */}
          <button
            onClick={() => setViewDate(d => subDays(d, 1))}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewDate(new Date())}
            className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
              isToday
                ? "bg-orange-500/20 border-orange-400/30 text-orange-200"
                : "bg-white/8 border-white/12 text-white/50 hover:text-white hover:bg-white/12"
            }`}
          >
            {isToday ? "Today" : format(viewDate, "MMM d")}
          </button>
          <button
            onClick={() => setViewDate(d => addDays(d, 1))}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-white/8 border border-white/12 text-white/60 hover:text-white hover:bg-white/15 transition-colors ml-1"
          >
            {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showForm ? "Cancel" : "New"}
          </button>
        </div>
      </div>

      {/* Date label when not today */}
      {!isToday && (
        <p className="text-[10px] text-white/40 text-center mb-2">
          {format(viewDate, "EEEE, MMMM d, yyyy")}
        </p>
      )}

      {/* New Appointment Form */}
      {showForm && (
        <div className="mb-3">
          <NewAppointmentForm
            selectedService={selectedService}
            defaultDate={viewDate}
            onSaved={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ["patient-visits"] });
              toast.success("Appointment created");
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Appointments list */}
      {dayAppointments.length === 0 ? (
        <p className="text-[11px] text-white/30 text-center py-3">No appointments for this day</p>
      ) : (
        <div className="space-y-2">
          {dayAppointments.map(appt => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              onAdmit={handleAdmit}
              admitting={admitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}