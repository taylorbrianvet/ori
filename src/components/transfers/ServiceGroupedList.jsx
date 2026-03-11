import React from "react";
import { ArrowRight } from "lucide-react";
import TransferCard from "./TransferCard";

// Service summary pill at the top
function ServiceSummaryBar({ serviceGroups }) {
  if (!serviceGroups.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
      <span className="text-[11px] text-white/35 font-medium self-center mr-1">Receiving:</span>
      {serviceGroups.map(({ service, patientGroups }) => (
        <div
          key={service}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/80"
        >
          <ArrowRight className="w-3 h-3 text-orange-300/70" />
          {service}
          <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/60 font-semibold">
            {patientGroups.length}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ServiceGroupedList({ serviceGroups, bucket, onUpdated, emptyMessage }) {
  if (!serviceGroups.length) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 p-10 text-center text-sm text-white/25">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div>
      <ServiceSummaryBar serviceGroups={serviceGroups} />
      <div className="space-y-6">
        {serviceGroups.map(({ service, patientGroups }) => (
          <div key={service}>
            {/* Service header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/18">
                <ArrowRight className="w-3.5 h-3.5 text-orange-300" />
                <span className="text-sm font-semibold text-white">{service}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/55 font-semibold">
                  {patientGroups.length} pt{patientGroups.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            {/* Patient cards under this service */}
            <div className="space-y-3 pl-2">
              {patientGroups.map(group => (
                <TransferCard
                  key={group[0].patient_id || group[0].id}
                  transfers={group}
                  onUpdated={onUpdated}
                  bucket={bucket}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}