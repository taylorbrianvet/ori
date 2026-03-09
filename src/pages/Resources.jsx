import React from "react";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import GlassCard from "../components/shared/GlassCard";
import { FileText, BookOpen, ClipboardList, ExternalLink } from "lucide-react";

const resources = [
  {
    title: "Hospital Protocols",
    description: "Standard operating procedures and clinical protocols.",
    icon: FileText,
  },
  {
    title: "Drug Formulary",
    description: "Comprehensive drug reference and dosing guidelines.",
    icon: ClipboardList,
  },
  {
    title: "Clinical References",
    description: "Quick-access reference cards and guidelines.",
    icon: BookOpen,
  },
  {
    title: "Emergency Procedures",
    description: "Emergency response protocols and contact lists.",
    icon: ExternalLink,
  },
];

export default function Resources() {
  return (
    <PageContainer>
      <PageHeader title="Resources" subtitle="Hospital guides and reference materials." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {resources.map((res, i) => (
          <GlassCard key={i} hover className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <res.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{res.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{res.description}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </PageContainer>
  );
}