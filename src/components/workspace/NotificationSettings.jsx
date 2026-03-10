import React, { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function NotificationSettings({ staffRecord, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [receiveEmails, setReceiveEmails] = useState(
    staffRecord?.receive_transfer_emails !== false
  );

  const handleToggle = async () => {
    if (!staffRecord?.id) return;
    setLoading(true);
    try {
      await base44.entities.Staff.update(staffRecord.id, {
        receive_transfer_emails: !receiveEmails,
      });
      setReceiveEmails(!receiveEmails);
      toast.success(
        !receiveEmails
          ? "Transfer emails enabled"
          : "Transfer emails disabled"
      );
      onUpdated?.();
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-white/40" />
        <h2 className="text-sm font-semibold text-white/70">Notifications</h2>
      </div>
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/90 font-medium">Transfer Emails</p>
            <p className="text-xs text-white/40 mt-1">
              Receive daily 6am emails with pending inter-service transfers
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative w-10 h-5.5 rounded-full border transition-colors flex items-center px-0.5 ${
              receiveEmails
                ? "bg-green-500/40 border-green-400/50"
                : "bg-white/8 border-white/20"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full transition-transform ${
                receiveEmails
                  ? "translate-x-4 bg-green-300"
                  : "translate-x-0 bg-white/30"
              }`}
            />
          </button>
        </div>
        {loading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
            <Loader2 className="w-3 h-3 animate-spin" /> Updating...
          </div>
        )}
      </div>
    </section>
  );
}