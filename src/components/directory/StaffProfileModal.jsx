import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, MessageCircle, User } from "lucide-react";

export default function StaffProfileModal({ staff, onClose }) {
  if (!staff) return null;

  const fullName = `${staff.first_name} ${staff.last_name}`;
  const initials = `${staff.first_name?.[0] ?? ""}${staff.last_name?.[0] ?? ""}`.toUpperCase();
  const roleLabel = [staff.role, staff.service || staff.department].filter(Boolean).join(" · ");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative glass-panel rounded-2xl p-6 w-full max-w-sm z-10"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-5">
            {staff.profile_image_url ? (
              <img
                src={staff.profile_image_url}
                alt={fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 mb-3">
                <span className="text-2xl font-bold text-white/80">{initials}</span>
              </div>
            )}
            <h2 className="text-lg font-semibold text-white">{fullName}</h2>
            <p className="text-sm text-white/50 mt-0.5">{roleLabel}</p>
          </div>

          {/* Info rows */}
          <div className="space-y-2 mb-5">
            {staff.department && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/6">
                <User className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <span className="text-xs text-white/60">Department</span>
                <span className="text-xs text-white/85 ml-auto font-medium">{staff.department}</span>
              </div>
            )}
            {staff.service && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/6">
                <User className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <span className="text-xs text-white/60">Service</span>
                <span className="text-xs text-white/85 ml-auto font-medium">{staff.service}</span>
              </div>
            )}
          </div>

          {/* Contact Actions */}
          <div className="grid grid-cols-3 gap-2">
            {staff.phone && (
              <a
                href={`tel:${staff.phone}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/8 hover:bg-white/14 transition-colors group"
              >
                <Phone className="w-4 h-4 text-white/60 group-hover:text-white/90 transition-colors" />
                <span className="text-[10px] text-white/45 group-hover:text-white/70">Call</span>
              </a>
            )}
            {staff.phone && (
              <a
                href={`sms:${staff.phone}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/8 hover:bg-white/14 transition-colors group"
              >
                <MessageCircle className="w-4 h-4 text-white/60 group-hover:text-white/90 transition-colors" />
                <span className="text-[10px] text-white/45 group-hover:text-white/70">Text</span>
              </a>
            )}
            {staff.email && (
              <a
                href={`mailto:${staff.email}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/8 hover:bg-white/14 transition-colors group"
              >
                <Mail className="w-4 h-4 text-white/60 group-hover:text-white/90 transition-colors" />
                <span className="text-[10px] text-white/45 group-hover:text-white/70">Email</span>
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}