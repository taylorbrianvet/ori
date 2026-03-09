import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import PageContainer from "../components/shared/PageContainer";
import {
  Scissors,
  FlaskConical,
  Bandage,
  Pill,
  Activity,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

const CARE_OPTIONS = [
  {
    key: "surgical_log",
    title: "Surgical Log",
    subtext: "Record and review surgical procedures.",
    page: "SurgicalLog",
    icon: Scissors,
    color: "from-rose-900/60 to-rose-800/30",
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&q=80",
  },
  {
    key: "diagnostic_request",
    title: "Diagnostic Request",
    subtext: "Submit labs, imaging, and diagnostic orders.",
    page: "PatientCare",
    icon: FlaskConical,
    color: "from-blue-900/60 to-blue-800/30",
    image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80",
  },
  {
    key: "wound_care",
    title: "Wound Care",
    subtext: "Document wound assessments and bandage changes.",
    page: "WoundCare",
    icon: Bandage,
    color: "from-green-900/60 to-green-800/30",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80",
  },
  {
    key: "medication_log",
    title: "Medication Log",
    subtext: "Track medications administered to patients.",
    page: "PatientCare",
    icon: Pill,
    color: "from-purple-900/60 to-purple-800/30",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80",
  },
  {
    key: "vitals",
    title: "Vitals Monitoring",
    subtext: "Log and review patient vital signs.",
    page: "PatientCare",
    icon: Activity,
    color: "from-amber-900/60 to-amber-800/30",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80",
  },
  {
    key: "discharge_notes",
    title: "Discharge Notes",
    subtext: "Prepare and review patient discharge summaries.",
    page: "PatientCare",
    icon: ClipboardList,
    color: "from-teal-900/60 to-teal-800/30",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
  },
];

export default function PatientCare() {
  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Patient Care</h1>
        <p className="text-sm text-white/50 mt-1">Select a care module to get started.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {CARE_OPTIONS.map((opt, i) => (
          <motion.div
            key={opt.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <Link to={createPageUrl(opt.page)} className="block group">
              <div className="relative overflow-hidden rounded-2xl glass-card glass-hover h-48 sm:h-52">
                <img
                  src={opt.image}
                  alt={opt.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 transition-opacity duration-500 group-hover:scale-105 transform transition-transform"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${opt.color}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <opt.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{opt.title}</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/75 font-medium">{opt.subtext}</p>
                    <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}