import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, AlertCircle } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import PharmacyRequestForm from "../components/pharmacy/PharmacyRequestForm";
import PharmacyRequestList from "../components/pharmacy/PharmacyRequestList";

export default function Pharmacy() {
  const [showForm, setShowForm] = useState(false);

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: requests = [], refetch } = useQuery({
    queryKey: ["pharmacy-refill-requests"],
    queryFn: () => base44.entities.PharmacyRefillRequest.list(),
  });

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const completedRequests = requests.filter(r => r.status === "completed");

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Pharmacy Refill Requests</h1>
        <p className="text-sm text-white/50">Manage medication refill requests from clinicians</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-2xl font-bold text-amber-300">{pendingRequests.length}</div>
          <div className="text-xs text-white/50 mt-1">Pending Requests</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-2xl font-bold text-blue-300">{approvedRequests.length}</div>
          <div className="text-xs text-white/50 mt-1">Approved</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-2xl font-bold text-green-300">{completedRequests.length}</div>
          <div className="text-xs text-white/50 mt-1">Completed</div>
        </div>
      </div>

      {/* New Request Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 border border-white/20 hover:bg-white/18 text-white text-sm font-medium transition-colors mb-6"
      >
        <Plus className="w-4 h-4" /> New Refill Request
      </button>

      {/* Form */}
      {showForm && (
        <PharmacyRequestForm
          staffList={staffList}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Requests by Status */}
      <div className="space-y-6">
        {pendingRequests.length > 0 && (
          <PharmacyRequestList
            requests={pendingRequests}
            title="Pending Requests"
            status="pending"
            onRefetch={refetch}
          />
        )}

        {approvedRequests.length > 0 && (
          <PharmacyRequestList
            requests={approvedRequests}
            title="Approved Requests"
            status="approved"
            onRefetch={refetch}
          />
        )}

        {completedRequests.length > 0 && (
          <PharmacyRequestList
            requests={completedRequests}
            title="Completed"
            status="completed"
            onRefetch={refetch}
          />
        )}

        {requests.length === 0 && (
          <div className="text-center py-12 text-white/25">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>No refill requests yet</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}