import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function EditMyProfileModal({ staffProfile, onClose, onSaved }) {
  const [form, setForm] = useState({
    phone: staffProfile?.phone || "",
    profile_image_url: staffProfile?.profile_image_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("profile_image_url", file_url);
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!staffProfile?.id) return;
    setSaving(true);
    await base44.entities.Staff.update(staffProfile.id, {
      phone: form.phone,
      profile_image_url: form.profile_image_url,
    });
    toast.success("Profile updated.");
    setSaving(false);
    onSaved?.({ ...staffProfile, ...form });
    onClose();
  };

  const initials = staffProfile
    ? `${staffProfile.first_name?.[0] ?? ""}${staffProfile.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";
  const fullName = staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : "";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative glass-panel rounded-2xl p-6 w-full max-w-sm z-10"
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/50 transition-colors">
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-sm font-semibold text-white mb-5">Edit My Profile</h2>

          {/* Avatar upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {form.profile_image_url ? (
                <img src={form.profile_image_url} alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                  <span className="text-2xl font-bold text-white/80">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 border border-white/25 flex items-center justify-center transition-colors"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleImageUpload(e.target.files[0])} />
            </div>
            <p className="text-xs text-white/45 mt-3">{fullName}</p>
            {staffProfile?.role && <p className="text-[11px] text-white/30 mt-0.5">{staffProfile.role} · {staffProfile.department}</p>}
          </div>

          {/* Email (read-only) */}
          <div className="mb-4">
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/20 text-sm text-white/60 disabled:opacity-50"
              value={staffProfile?.email || ""}
              disabled
            />
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 555-123-4567"
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/35"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/12 hover:bg-white/18 border border-white/20 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}