import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { X, Mic, MicOff, Camera, ImagePlus, Loader2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

const SERVICES = [
  "Soft Tissue Surgery", "Orthopedic Surgery", "Neurology", "Dermatology",
  "Cardiology", "Internal Medicine", "Oncology", "Ophthalmology",
  "Emergency", "Critical Care", "Primary Care", "General Surgery"
];

function ImageUploadSlot({ label, value, onChange }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1">
      <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-1.5">{label}</p>
      {value ? (
        <div className="relative rounded-xl overflow-hidden aspect-video bg-black/20">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button onClick={() => onChange(null)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-white/15 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1.5 transition-colors">
          {uploading ? <Loader2 className="w-5 h-5 text-white/40 animate-spin" /> : <Camera className="w-5 h-5 text-white/30" />}
          <span className="text-[10px] text-white/30">{uploading ? "Uploading…" : "Tap to add"}</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}

function VoiceRecorder({ transcript, onTranscriptChange }) {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const accumulatedRef = useRef(transcript);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported on this device.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let interim = "";
    rec.onresult = (e) => {
      interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + " ";
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (final) {
        accumulatedRef.current = (accumulatedRef.current + " " + final).trim();
        onTranscriptChange(accumulatedRef.current + (interim ? " " + interim : ""));
      } else {
        onTranscriptChange(accumulatedRef.current + (interim ? " " + interim : ""));
      }
    };

    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    accumulatedRef.current = transcript;
    setRecording(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-white/55 font-medium">Voice Transcript</p>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            recording
              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
              : "bg-white/10 text-white/70 border border-white/15 hover:bg-white/15"
          }`}
        >
          {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {recording ? "Stop" : "Record"}
        </button>
      </div>
      <textarea
        className="w-full px-3 py-2.5 rounded-xl border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
        rows={5}
        placeholder="Speak or type wound care notes here… e.g. 'Flushed wound with dilute saline, cleaned margins with chlorhexidine, placed honey alginate primary, ABD pad secondary. Change in 2 days.'"
        value={transcript}
        onChange={e => {
          accumulatedRef.current = e.target.value;
          onTranscriptChange(e.target.value);
        }}
      />
      {recording && (
        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse" />
          Recording… speak now
        </p>
      )}
    </div>
  );
}

export default function BandageChangeForm({ woundCase, onClose, onSubmit }) {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const clinicianOptions = staffList
    .filter(s => ["Faculty", "Resident", "Intern"].includes(s.role))
    .map(s => `${s.first_name} ${s.last_name}`);

  const [clinician, setClinician] = useState("");
  const [service, setService] = useState(woundCase.service || "");
  const [transcript, setTranscript] = useState("");
  const [woundImages, setWoundImages] = useState(() => {
    const obj = {};
    (woundCase.wound_locations || []).forEach(w => { obj[w] = { pre: null, post: null }; });
    return obj;
  });
  const [submitting, setSubmitting] = useState(false);

  const setImage = (wound, type, url) => {
    setWoundImages(prev => ({ ...prev, [wound]: { ...prev[wound], [type]: url } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clinician) { toast.error("Please select a clinician."); return; }
    setSubmitting(true);
    try {
      await onSubmit({ clinician, service, transcript, woundImages, change_date: today });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldCls = "w-full px-3 py-2.5 rounded-xl border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/30 transition-colors [color-scheme:dark]";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="relative glass-panel w-full sm:rounded-2xl sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-2xl"
      >
        <div className="sticky top-0 z-10 glass-panel rounded-t-2xl px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Perform Wound Care</h2>
            <p className="text-xs text-white/45 mt-0.5">{woundCase.patient_name} · {today}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Clinician + Service */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/55 mb-1.5">Clinician <span className="text-red-400">*</span></label>
              <select className={fieldCls} value={clinician} onChange={e => setClinician(e.target.value)}>
                <option value="">Select…</option>
                {clinicianOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/55 mb-1.5">Service</label>
              <select className={fieldCls} value={service} onChange={e => setService(e.target.value)}>
                <option value="">Select…</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Voice transcript */}
          <VoiceRecorder transcript={transcript} onTranscriptChange={setTranscript} />

          {/* Per-wound images */}
          <div>
            <p className="text-xs text-white/55 font-medium mb-3">Wound Images</p>
            <div className="space-y-4">
              {(woundCase.wound_locations || []).map(wound => (
                <div key={wound} className="glass-card p-3">
                  <p className="text-xs font-medium text-white/80 mb-2">{wound}</p>
                  <div className="flex gap-2">
                    <ImageUploadSlot
                      label="Pre wound care"
                      value={woundImages[wound]?.pre}
                      onChange={url => setImage(wound, "pre", url)}
                    />
                    <ImageUploadSlot
                      label="Post wound care"
                      value={woundImages[wound]?.post}
                      onChange={url => setImage(wound, "post", url)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm text-white/55 hover:text-white hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/15 hover:bg-white/22 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {submitting ? "Submitting…" : "Submit for AI Parsing"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}