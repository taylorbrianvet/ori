import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, AlertCircle } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import DiagnosticForm from "../components/diagnostics/DiagnosticForm";
import DiagnosticList from "../components/diagnostics/DiagnosticList";

const CLINICAL_SERVICES = [
  "Cardiology",
  "Dermatology",
  "Emergency",
  "Critical Care",
  "Internal Medicine",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedic Surgery",
  "Primary Care",
  "Soft Tissue Surgery"
];

const DIAGNOSTIC_TYPES = ["CBC", "Chemistry", "NOVA", "Histopathology", "Cytology", "Culture", "Urinalysis", "Radiology", "Ultrasound", "CT", "MRI", "X-Ray", "Other"];

export default function Diagnostics() {
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const { data: diagnostics = [], refetch } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: () => base44.entities.Diagnostic.list(),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list(),
  });

  // Filter by selected service
  const filtered = selectedService
    ? diagnostics.filter(d => d.requesting_service === selectedService)
    : diagnostics;

  const pending = filtered.filter(d => !d.diagnostic_complete);
  const complete = filtered.filter(d => d.diagnostic_complete);

  // Separate histopathology from others
  const pendingHistopath = pending.filter(d => d.diagnostic_type === "Histopathology");
  const pendingOthers = pending.filter(d => d.diagnostic_type !== "Histopathology");

  const completeHistopath = complete.filter(d => d.diagnostic_type === "Histopathology");
  const completeOthers = complete.filter(d => d.diagnostic_type !== "Histopathology");

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Diagnostics</h1>
        <p className="text-sm text-white/50">Submit and track diagnostic requests</p>
      </div>

      {/* Service Filter */}
      <div className="mb-6">
        <label className="block text-xs text-white/50 uppercase tracking-wider font-semibold mb-2">Filter by Service</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedService(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedService === null
                ? "bg-white/18 border border-white/25 text-white"
                : "bg-white/8 border border-white/12 text-white/60 hover:bg-white/12"
            }`}
          >
            All Services
          </button>
          {CLINICAL_SERVICES.map(service => (
            <button
              key={service}
              onClick={() => setSelectedService(service)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedService === service
                  ? "bg-white/18 border border-white/25 text-white"
                  : "bg-white/8 border border-white/12 text-white/60 hover:bg-white/12"
              }`}
            >
              {service}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-2xl font-bold text-amber-300">{pending.length}</div>
          <div className="text-xs text-white/50 mt-1">Pending</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-2xl font-bold text-green-300">{complete.length}</div>
          <div className="text-xs text-white/50 mt-1">Completed</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-2xl font-bold text-white">{filtered.length}</div>
          <div className="text-xs text-white/50 mt-1">Total</div>
        </div>
      </div>

      {/* New Request Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 border border-white/20 hover:bg-white/18 text-white text-sm font-medium transition-colors mb-6"
      >
        <Plus className="w-4 h-4" /> New Diagnostic Request
      </button>

      {/* Form */}
      {showForm && (
        <DiagnosticForm
          staffList={staffList}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Pending Diagnostics */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Pending Diagnostics</h2>
          
          {pendingHistopath.length > 0 && (
            <DiagnosticList
              diagnostics={pendingHistopath}
              title="Histopathology"
              onRefetch={refetch}
            />
          )}

          {pendingOthers.length > 0 && (
            <DiagnosticList
              diagnostics={pendingOthers}
              title="Other Diagnostics"
              onRefetch={refetch}
            />
          )}
        </div>
      )}

      {/* Completed Diagnostics */}
      {complete.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Completed</h2>

          {completeHistopath.length > 0 && (
            <DiagnosticList
              diagnostics={completeHistopath}
              title="Histopathology"
              isCompleted
              onRefetch={refetch}
            />
          )}

          {completeOthers.length > 0 && (
            <DiagnosticList
              diagnostics={completeOthers}
              title="Other Diagnostics"
              isCompleted
              onRefetch={refetch}
            />
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/25">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No diagnostics yet</p>
        </div>
      )}
    </PageContainer>
  );
}