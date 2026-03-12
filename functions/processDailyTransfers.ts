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

  const remainingWeeks = Math.floor(days / 7);
  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    weeks: Math.max(0, remainingWeeks),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all pending (not yet transferred) InterserviceTransfer records
    const allTransfers = await base44.asServiceRole.entities.InterserviceTransfer.list();
    const pendingTransfers = allTransfers.filter(t => !t.already_transferred);

    let synced = 0;

    for (const transfer of pendingTransfers) {
      // Skip if already has global_patient_id (already synced)
      if (transfer.global_patient_id) continue;

      // ── Resolve receiving services ──
      const receivingServices = transfer.receiving_services?.length > 0
        ? transfer.receiving_services
        : transfer.receiving_service
          ? [transfer.receiving_service]
          : [];

      const isDouble = receivingServices.length > 1;
      const transferType = isDouble ? "double" : receivingServices.length === 1 ? "single" : "none";
      const primaryService = receivingServices[0] || transfer.requesting_service;

      // ── Normalize sex ──
      const sexMap = { MI: "Male Intact", MC: "Male Neutered", FI: "Female Intact", FS: "Female Spayed" };
      const normalizedSex = sexMap[transfer.sex] || transfer.sex;

      // ── Check for existing GlobalPatient ──
      const existingGlobal = await base44.asServiceRole.entities.GlobalPatient.filter({
        patient_id: transfer.patient_id,
      });

      let globalPatient = null;

      if (existingGlobal && existingGlobal.length > 0) {
        globalPatient = existingGlobal[0];
      } else {
        // Create new GlobalPatient (only at 6 AM for pending transfers)
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

      // ── Find or create PatientVisit ──
      const existingVisits = await base44.asServiceRole.entities.PatientVisit.filter({
        global_patient_id: globalPatient.id,
      });

      const openVisit = existingVisits?.find(v => v.discharge_status !== "discharged");
      const ageComps = calculateAgeComponents(globalPatient.birthdate);

      let patientVisit = null;

      if (openVisit) {
        await base44.asServiceRole.entities.PatientVisit.update(openVisit.id, {
          assigned_services: receivingServices,
          transfer_status: "transferred_in",
          transfer_type: transferType,
          problem_list: transfer.problem_list || [],
        });
        patientVisit = openVisit;
      } else {
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
          transfer_status: "transferred_in",
          transfer_type: transferType,
          patient_type: "Inpatient",
          primary_clinician: transfer.requesting_clinician || "",
          discharge_status: "active",
        });
      }

      // ── Mark transfer as transferred and link IDs ──
      await base44.asServiceRole.entities.InterserviceTransfer.update(transfer.id, {
        already_transferred: true,
        global_patient_id: globalPatient.id,
        patient_visit_id: patientVisit.id,
      });

      synced++;
    }

    return Response.json({
      success: true,
      synced,
      total_pending: pendingTransfers.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});