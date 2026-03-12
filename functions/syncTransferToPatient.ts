import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Helper to calculate age components from birthdate
function calculateAgeComponents(birthdateStr) {
  if (!birthdateStr) return { years: 0, months: 0, weeks: 0 };

  const birthdate = new Date(birthdateStr);
  const today = new Date();

  let years = today.getFullYear() - birthdate.getFullYear();
  let months = today.getMonth() - birthdate.getMonth();
  let days = today.getDate() - birthdate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalWeeks = Math.floor(
    (today.getTime() - birthdate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    weeks: totalWeeks,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const transfer = payload?.data;
    if (!transfer || !transfer.patient_id) {
      return Response.json({ message: "No transfer data or patient_id" });
    }

    // ── Service / transfer type resolution ──────────────────────────────────
    const receivingServices = transfer.receiving_services?.length > 0
      ? transfer.receiving_services
      : transfer.receiving_service
        ? [transfer.receiving_service]
        : [];

    const isDouble = receivingServices.length > 1;
    const transferType = isDouble ? "double" : receivingServices.length === 1 ? "single" : "none";
    const primaryService = receivingServices[0] || transfer.requesting_service;

    // ── Sex normalization ────────────────────────────────────────────────────
    const sexMap = { MI: "Male Intact", MC: "Male Neutered", FI: "Female Intact", FS: "Female Spayed" };
    const normalizedSex = sexMap[transfer.sex] || transfer.sex;

    // ── Transfer status / date ───────────────────────────────────────────────
    const transferStatus = transfer.already_transferred ? "transferred_in" : "pending_transfer";
    const todayStr = new Date().toISOString().split("T")[0];
    let transferDate = todayStr;
    if (!transfer.already_transferred) {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      transferDate = tomorrow.toISOString().split("T")[0];
    }

    // ── 1. Check for existing GlobalPatient ──────────────────────────────────
     const existingGlobal = await base44.asServiceRole.entities.GlobalPatient.filter({ patient_id: transfer.patient_id });

     let globalPatient;
     if (existingGlobal && existingGlobal.length > 0) {
       // Patient exists in system — use existing record
       globalPatient = existingGlobal[0];
       // Only update mutable fields if provided
       const updates = {};
       if (transfer.patient_name) updates.name = transfer.patient_name;
       if (transfer.species) updates.species = transfer.species;
       if (transfer.breed) updates.breed = transfer.breed;
       if (normalizedSex) updates.sex = normalizedSex;
       if (Object.keys(updates).length > 0) {
         await base44.asServiceRole.entities.GlobalPatient.update(globalPatient.id, updates);
         globalPatient = { ...globalPatient, ...updates };
       }
     } else {
       // NEW PATIENT: Only create GlobalPatient if already marked as transferred (at 6 AM trigger)
       // Otherwise, return null and PatientVisit will use local data
       if (!transfer.already_transferred) {
         // Defer creation — this transfer is "upcoming" and will be synced at 6 AM
         globalPatient = null;
       } else {
         // Calculate birthdate from age fields
         let birthdate = null;
         const ageYears = transfer.age_years || 0;
         const ageMonths = transfer.age_months || 0;
         const ageWeeks = transfer.age_weeks || 0;
         if (ageYears > 0 || ageMonths > 0 || ageWeeks > 0) {
           const bd = new Date();
           bd.setFullYear(bd.getFullYear() - ageYears);
           bd.setMonth(bd.getMonth() - ageMonths);
           bd.setDate(bd.getDate() - (ageWeeks * 7));
           birthdate = bd.toISOString().split("T")[0];
         }

         globalPatient = await base44.asServiceRole.entities.GlobalPatient.create({
           patient_id: transfer.patient_id,
           name: transfer.patient_name,
           species: transfer.species,
           breed: transfer.breed,
           sex: normalizedSex,
           age_years: ageYears || undefined,
           age_months: ageMonths || undefined,
           age_weeks: ageWeeks || undefined,
           birthdate: birthdate || undefined,
           infectious_status: "Negative",
         });
       }
     }

    // ── 2. Find or create open PatientVisit (only if GlobalPatient exists) ──
    let patientVisit = null;

    if (globalPatient) {
      // GlobalPatient exists — link to PatientVisit
      const existingVisits = await base44.asServiceRole.entities.PatientVisit.filter({
        global_patient_id: globalPatient.id,
      });

      const openVisit = existingVisits?.find(v => v.discharge_status !== "discharged");

      // Calculate age components from GlobalPatient birthdate
      const ageComps = calculateAgeComponents(globalPatient.birthdate);

      if (openVisit) {
        // Update the open visit with latest transfer info
        await base44.asServiceRole.entities.PatientVisit.update(openVisit.id, {
          name: transfer.patient_name,
          patient_id: transfer.patient_id,
          species: transfer.species,
          breed: transfer.breed,
          sex: normalizedSex,
          age_years: ageComps.years,
          age_months: ageComps.months,
          age_weeks: ageComps.weeks,
          problem_list: transfer.problem_list || [],
          service: primaryService,
          assigned_services: receivingServices,
          transfer_status: transferStatus,
          transfer_type: transferType,
          transfer_date: transferDate,
          patient_type: "Inpatient",
          // Don't overwrite an existing clinician assignment
          ...(openVisit.primary_clinician ? {} : { primary_clinician: transfer.requesting_clinician || "" }),
        });
        patientVisit = { ...openVisit, id: openVisit.id };
      } else {
        // No open visit — create a new one
        patientVisit = await base44.asServiceRole.entities.PatientVisit.create({
          global_patient_id: globalPatient.id,
          name: transfer.patient_name,
          patient_id: transfer.patient_id,
          species: transfer.species,
          breed: transfer.breed,
          sex: normalizedSex,
          age_years: ageComps.years,
          age_months: ageComps.months,
          age_weeks: ageComps.weeks,
          problem_list: transfer.problem_list || [],
          service: primaryService,
          assigned_services: receivingServices,
          transfer_status: transferStatus,
          transfer_type: transferType,
          transfer_date: transferDate,
          patient_type: "Inpatient",
          primary_clinician: transfer.requesting_clinician || "",
          discharge_status: "active",
        });
      }
    }

    // ── 3. Write back IDs to the InterserviceTransfer record ─────────────────
    if (transfer.id) {
      const updateData = {};
      if (globalPatient) updateData.global_patient_id = globalPatient.id;
      if (patientVisit) updateData.patient_visit_id = patientVisit.id;
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.InterserviceTransfer.update(transfer.id, updateData);
      }
    }

    return Response.json({
      success: true,
      patient_id: transfer.patient_id,
      global_patient_id: globalPatient?.id || null,
      patient_visit_id: patientVisit?.id || null,
      transfer_status: transferStatus,
      transfer_type: transferType,
      message: !globalPatient ? "New patient transfer deferred — will sync at 6 AM transfer window" : "Transfer synced",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});