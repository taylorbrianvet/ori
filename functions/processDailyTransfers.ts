import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    // Find all patients with pending_transfer status and today's transfer_date
    const pendingPatients = await base44.asServiceRole.entities.Patient.filter({
      transfer_status: "pending_transfer",
    });

    // Only promote those whose transfer_date is on or before today
    const toPromote = pendingPatients.filter(p => {
      if (!p.transfer_date) return true; // if no date set, promote anyway
      return p.transfer_date <= today;
    });

    let promoted = 0;
    for (const patient of toPromote) {
      await base44.asServiceRole.entities.Patient.update(patient.id, {
        transfer_status: "transferred_in",
      });
      promoted++;
    }

    return Response.json({
      success: true,
      promoted,
      total_pending: pendingPatients.length,
      date: today,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});