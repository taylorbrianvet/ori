import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import PageContainer from "../components/shared/PageContainer";
import BandageChangeForm from "../components/wound/BandageChangeForm";
import AIProcessingScreen from "../components/wound/AIProcessingScreen";
import WoundLocationCard from "../components/wound/WoundLocationCard";

export default function WoundCaseDetail() {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get("id");

  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { data: woundCase, isLoading: caseLoading } = useQuery({
    queryKey: ["wound-case", caseId],
    queryFn: () => base44.entities.WoundCase.filter({ id: caseId }).then(r => r[0]),
    enabled: !!caseId,
  });

  const { data: allChanges = [] } = useQuery({
    queryKey: ["bandage-changes", caseId],
    queryFn: () => base44.entities.BandageChange.filter({ wound_case_id: caseId }, "-change_date"),
    enabled: !!caseId,
  });

  const handleBandageSubmit = async ({ clinician, service, transcript, woundImages, change_date }) => {
    setShowForm(false);
    setProcessing(true);
    try {
      const wounds = woundCase.wound_locations || [];

      // For each wound, call AI to parse transcript + images
      const results = await Promise.all(
        wounds.map(async (wound) => {
          const images = woundImages[wound] || {};
          const response = await base44.functions.invoke("parseWoundCare", {
            transcript,
            wound_location: wound,
            change_date,
            image_pre_url: images.pre || null,
            image_post_url: images.post || null,
          });
          return { wound, data: response.data };
        })
      );

      // Save each bandage change
      const savedChanges = await Promise.all(
        results.map(({ wound, data }) => {
          const images = woundImages[wound] || {};
          return base44.entities.BandageChange.create({
            wound_case_id: caseId,
            wound_location: wound,
            clinician,
            service,
            change_date,
            transcript,
            image_pre_url: images.pre || undefined,
            image_post_url: images.post || undefined,
            wound_type: data.wound_type || undefined,
            exudate_type: data.exudate_type || undefined,
            exudate_amount: data.exudate_amount || undefined,
            pocketing_present: data.pocketing_present || false,
            pocketing_description: data.pocketing_description || undefined,
            granulation_tissue: data.granulation_tissue || false,
            granulation_description: data.granulation_description || undefined,
            debridement_performed: data.debridement_performed || false,
            debridement_type: data.debridement_type || undefined,
            wound_closed: data.wound_closed || false,
            suture_type: data.suture_type || undefined,
            topical_therapy: data.topical_therapy || undefined,
            primary_dressing: data.primary_dressing || undefined,
            secondary_dressing: data.secondary_dressing || undefined,
            bandage_type: data.bandage_type || undefined,
            next_change_date: data.next_change_date || undefined,
            wound_healed: data.wound_healed || false,
            additional_notes: data.additional_notes || undefined,
            ai_processed: true,
          });
        })
      );

      // Check if any wounds marked healed — update wound_statuses
      const updatedStatuses = { ...(woundCase.wound_statuses || {}) };
      results.forEach(({ wound, data }) => {
        if (data.wound_healed) updatedStatuses[wound] = "healed";
      });

      const allHealed = (woundCase.wound_locations || []).every(w => updatedStatuses[w] === "healed");
      await base44.entities.WoundCase.update(caseId, {
        wound_statuses: updatedStatuses,
        status: allHealed ? "complete" : "active",
      });

      queryClient.invalidateQueries({ queryKey: ["bandage-changes", caseId] });
      queryClient.invalidateQueries({ queryKey: ["wound-case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["wound-cases"] });
      toast.success("Wound care recorded successfully.");
    } catch (err) {
      toast.error("Failed to process wound care: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkHealed = async (wound) => {
    const updatedStatuses = { ...(woundCase.wound_statuses || {}), [wound]: "healed" };
    const allHealed = (woundCase.wound_locations || []).every(w => updatedStatuses[w] === "healed");
    await base44.entities.WoundCase.update(caseId, {
      wound_statuses: updatedStatuses,
      status: allHealed ? "complete" : "active",
    });
    queryClient.invalidateQueries({ queryKey: ["wound-case", caseId] });
    queryClient.invalidateQueries({ queryKey: ["wound-cases"] });
    toast.success(allHealed ? "All wounds healed — case marked complete!" : `${wound} marked as healed.`);
  };

  if (caseLoading) {
    return <PageContainer><div className="py-20 text-center text-white/40 text-sm">Loading…</div></PageContainer>;
  }

  if (!woundCase) {
    return <PageContainer><div className="py-20 text-center text-white/40 text-sm">Wound case not found.</div></PageContainer>;
  }

  // Group changes by wound
  const changesByWound = {};
  (woundCase.wound_locations || []).forEach(w => {
    changesByWound[w] = allChanges.filter(c => c.wound_location === w).sort((a, b) => a.change_date > b.change_date ? 1 : -1);
  });

  // Earliest upcoming next change date across all wounds
  const upcomingDates = Object.values(changesByWound)
    .map(changes => changes[changes.length - 1]?.next_change_date)
    .filter(Boolean);
  const nextOverall = upcomingDates.sort()[0];

  const isComplete = woundCase.status === "complete";

  return (
    <PageContainer>
      <AnimatePresence>
        {processing && <AIProcessingScreen />}
      </AnimatePresence>

      {/* Back nav */}
      <div className="mb-5">
        <Link to={createPageUrl("WoundCare")}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Wound Care
        </Link>
      </div>

      {/* Patient header */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{woundCase.patient_name}</h1>
              {isComplete ? (
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </span>
              ) : (
                <span className="text-xs text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full font-medium">Active</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45 mt-1">
              {woundCase.species && <span>{woundCase.species}</span>}
              {woundCase.breed && <span>{woundCase.breed}</span>}
              {woundCase.age_years && <span>{woundCase.age_years}yr</span>}
              {woundCase.weight_kg && <span>{woundCase.weight_kg}kg</span>}
              {woundCase.sex && <span>{woundCase.sex}</span>}
              {woundCase.patient_case_number && <span>ID: {woundCase.patient_case_number}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {woundCase.service && (
                <span className="text-[10px] bg-white/8 text-white/50 px-2.5 py-1 rounded-full">{woundCase.service}</span>
              )}
              {woundCase.primary_clinician && (
                <span className="text-[10px] bg-white/8 text-white/50 px-2.5 py-1 rounded-full">{woundCase.primary_clinician}</span>
              )}
            </div>
          </div>

          {!isComplete && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-sm font-medium transition-colors flex-shrink-0">
              <Plus className="w-4 h-4" />
              Wound Care
            </button>
          )}
        </div>

        {/* Next bandage change banner */}
        {!isComplete && nextOverall && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300">
              Next bandage change scheduled:{" "}
              <span className="font-semibold">
                {(() => { try { const [y,m,d] = nextOverall.split("-").map(Number); return format(new Date(y,m-1,d),"MMMM d, yyyy"); } catch { return nextOverall; } })()}
              </span>
            </p>
          </div>
        )}

        {woundCase.notes && (
          <p className="text-xs text-white/45 mt-3 pt-3 border-t border-white/8">{woundCase.notes}</p>
        )}
      </div>

      {/* Wounds */}
      <div className="space-y-4">
        {(woundCase.wound_locations || []).map(wound => (
          <WoundLocationCard
            key={wound}
            wound={wound}
            changes={changesByWound[wound] || []}
            woundStatus={(woundCase.wound_statuses || {})[wound] || "active"}
            onMarkHealed={!isComplete ? handleMarkHealed : null}
          />
        ))}
      </div>

      {/* Bandage change form */}
      <AnimatePresence>
        {showForm && (
          <BandageChangeForm
            woundCase={woundCase}
            onClose={() => setShowForm(false)}
            onSubmit={handleBandageSubmit}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}