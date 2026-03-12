import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Back-calculate a birthdate from age fields (years/months/weeks) provided at time of entry
function calcBirthdate(ageYears, ageMonths, ageWeeks) {
  const now = new Date();
  const totalDays =
    (ageYears || 0) * 365 +
    (ageMonths || 0) * 30 +
    (ageWeeks || 0) * 7;
  const bd = new Date(now.getTime() - totalDays * 86400000);
  return bd.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const transfer = payload?.data;

    if (!transfer || !transfer.patient_id) {
      return Response.json({ message: "No transfer data or patient_id" });
    }

    // Normalize receiving services
    const receivingServices = transfer.receiving_services?.length > 0
      ? transfer.receiving_services
      : transfer.receiving_service ? [transfer.receiving_service] : [];

    const isDouble = receivingServices.length > 1;
    const transferType = isDouble ? "double" : receivingServices.length === 1 ? "single" : "none";
    const primaryService = receivingServices[0] || transfer.requesting_service;

    // Normalize sex field
    const sexMap = { MI: "Male Intact", MC: "Male Neutered", FI: "Female Intact", FS: "Female Spayed" };
    const normalizedSex = sexMap[transfer.sex] || transfer.sex;

    // Transfer status and date
    const transferStatus = transfer.already_transferred ? "transferred_in" : "pending_transfer";
    const todayStr = new Date().toISOString().split("T")[0];
    let transferDate = todayStr;
    if (!transfer.already_transferred) {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      transferDate = tomorrow.toISOString().split("T")[0];
    }

    // ── 1. Look up or create GlobalPatient ──────────────────────────────────
    const existingGlobal = await base44.asServiceRole.entities.GlobalPatient.filter({ patient_id: transfer.patient_id });
    let globalPatient;

    if (existingGlobal?.length > 0) {
      globalPatient = existingGlobal[0];
    } else {
      // Create new GlobalPatient; back-calculate birthdate from age fields
      const birthdate = calcBirthdate(transfer.age_years, transfer.age_months, transfer.age_weeks);
      globalPatient = await base44.asServiceRole.entities.GlobalPatient.create({
        patient_id: transfer.patient_id,
        name: transfer.patient_name,
        species: transfer.species,
        breed: transfer.breed,
        sex: normalizedSex,
        birthdate,
        alerts: [],
        infectious_status: "Negative",
      });
    }

    // ── 2. Look up open PatientVisit for this GlobalPatient ──────────────────
    // "Open" = discharge_status is not "discharged"
    const existingVisits = await base44.asServiceRole.entities.PatientVisit.filter({
      global_patient_id: globalPatient.id,
    });

    const openVisit = existingVisits
      ?.filter(v => v.discharge_status !== "discharged")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

    // Calculate approximate current age in years from birthdate
    const ageYears = globalPatient.birthdate
      ? parseFloat(((Date.now() - new Date(globalPatient.birthdate).getTime()) / (365.25 * 86400000)).toFixed(1))
      : null;

    if (openVisit) {
      // Update the existing open visit with the new transfer info
      await base44.asServiceRole.entities.PatientVisit.update(openVisit.id, {
        name: transfer.patient_name,
        species: transfer.species,
        breed: transfer.breed,
        sex: normalizedSex,
        age_years: ageYears,
        problem_list: transfer.problem_list || [],
        service: primaryService,
        assigned_services: receivingServices,
        transfer_status: transferStatus,
        transfer_type: transferType,
        transfer_date: transferDate,
        patient_type: "Inpatient",
        ...(openVisit.primary_clinician ? {} : { primary_clinician: transfer.requesting_clinician || "" }),
      });
    } else {
      // Create a new PatientVisit
      await base44.asServiceRole.entities.PatientVisit.create({
        global_patient_id: globalPatient.id,
        name: transfer.patient_name,
        patient_id: transfer.patient_id,
        species: transfer.species,
        breed: transfer.breed,
        sex: normalizedSex,
        age_years: ageYears,
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

    return Response.json({ success: true, patient_id: transfer.patient_id, transfer_status: transferStatus, transfer_type: transferType });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});