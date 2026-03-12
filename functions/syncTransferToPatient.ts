import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const transfer = payload?.data;
    if (!transfer || !transfer.patient_id) {
      return Response.json({ message: "No transfer data or patient_id" });
    }

    // Determine receiving services array (support both old single field and new array)
    const receivingServices = transfer.receiving_services?.length > 0
      ? transfer.receiving_services
      : transfer.receiving_service
        ? [transfer.receiving_service]
        : [];

    const isDouble = receivingServices.length > 1;
    const transferType = isDouble ? "double" : receivingServices.length === 1 ? "single" : "none";
    const primaryService = receivingServices[0] || transfer.requesting_service;

    // Normalize sex field
    const sexMap = { MI: "Male Intact", MC: "Male Neutered", FI: "Female Intact", FS: "Female Spayed" };
    const normalizedSex = sexMap[transfer.sex] || transfer.sex;

    // Determine transfer status
    const transferStatus = transfer.already_transferred ? "transferred_in" : "pending_transfer";

    // Check if Patient record already exists for this patient_id
    const existing = await base44.asServiceRole.entities.Patient.filter({ patient_id: transfer.patient_id });

    if (existing && existing.length > 0) {
      // Update existing patient record
      const patient = existing[0];
      await base44.asServiceRole.entities.Patient.update(patient.id, {
        name: transfer.patient_name,
        species: transfer.species,
        breed: transfer.breed,
        sex: normalizedSex,
        problem_list: transfer.problem_list || [],
        service: primaryService,
        assigned_services: receivingServices,
        transfer_status: transferStatus,
        transfer_type: transferType,
        transfer_date: transfer.created_date ? transfer.created_date.split("T")[0] : new Date().toISOString().split("T")[0],
        patient_type: "Inpatient",
        // Only set primary_clinician if not already set (don't overwrite clinician assignment)
        ...(patient.primary_clinician ? {} : { primary_clinician: transfer.requesting_clinician || "" }),
      });
    } else {
      // Create new Patient record
      await base44.asServiceRole.entities.Patient.create({
        name: transfer.patient_name,
        patient_id: transfer.patient_id,
        species: transfer.species,
        breed: transfer.breed,
        sex: normalizedSex,
        problem_list: transfer.problem_list || [],
        service: primaryService,
        assigned_services: receivingServices,
        transfer_status: transferStatus,
        transfer_type: transferType,
        transfer_date: transfer.created_date ? transfer.created_date.split("T")[0] : new Date().toISOString().split("T")[0],
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