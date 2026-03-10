import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all pending transfers
    const transfers = await base44.asServiceRole.entities.InterserviceTransfer.list();
    const pending = transfers.filter(t => !t.already_transferred);

    if (pending.length === 0) {
      return Response.json({ message: "No pending transfers to report" });
    }

    // Get all staff who opted in to receive emails
    const staff = await base44.asServiceRole.entities.Staff.list();
    const recipients = staff.filter(s => s.receive_transfer_emails !== false);

    if (recipients.length === 0) {
      return Response.json({ message: "No recipients opted in" });
    }

    // Group transfers by receiving service
    const transfersByService = {};
    pending.forEach(t => {
      if (!transfersByService[t.receiving_service]) {
        transfersByService[t.receiving_service] = [];
      }
      transfersByService[t.receiving_service].push(t);
    });

    // Detect double transfers (patients with same ID in multiple services)
    const patientsByKey = {};
    const doubleTransfers = new Set();
    pending.forEach(t => {
      const key = t.patient_id;
      if (!patientsByKey[key]) {
        patientsByKey[key] = [];
      }
      patientsByKey[key].push(t);
    });
    Object.values(patientsByKey).forEach(transfers => {
      if (transfers.length > 1) {
        transfers.forEach(t => doubleTransfers.add(t.id));
      }
    });

    // Format the email body with HTML
    let emailBody = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#111;">
    <div style="max-width:760px;margin:0 auto;padding:20px;">
      <div style="background:#ffffff;border:1px solid #e3e6ea;border-radius:10px;padding:18px;">
        <h2 style="margin:0 0 8px 0;font-size:22px;">Interservice Transfer List</h2>
        <p style="margin:0 0 14px 0;color:#555;font-size:13px;">
          Daily transfer summary grouped by receiving service.
        </p>
        <div style="margin:0 0 14px 0;padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="font-size:13px;line-height:1.6;">
            <div><strong>Total Transfers:</strong> ${pending.length}</div>
            ${doubleTransfers.size > 0 ? `<div style="color:#d32f2f;font-weight:700;margin-top:2px;">DOUBLE TRANSFERS: ${doubleTransfers.size}</div>` : ''}
          </div>
        </div>
        <div style="margin:0 0 14px 0;padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px;">Transfers by Service</div>
          <ul style="margin:0;padding-left:14px;font-size:12px;line-height:1.4;color:#333;">
            ${Object.keys(transfersByService).sort().map(service => 
              `<li>${service} (${transfersByService[service].length})</li>`
            ).join('')}
          </ul>
        </div>
        <hr style="border:none;border-top:1px solid #eceff3;margin:14px 0;">
        ${Object.keys(transfersByService).sort().map(service => {
          const serviceTransfers = transfersByService[service];
          return `
        <div style="margin:16px 0 8px;">
          <h3 style="margin:0 0 8px 0;font-size:16px;">${service} (${serviceTransfers.length})</h3>
          ${serviceTransfers.map(t => {
            const isDouble = doubleTransfers.has(t.id);
            const otherServices = patientsByKey[t.patient_id]
              .filter(x => x.id !== t.id)
              .map(x => x.receiving_service)
              .join(' & ');
            return `
 <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin:8px 0;background:#fff;">
  <div style="font-weight:700;font-size:14px;line-height:1.35;">${t.patient_name}</div>
  <div style="font-size:12px;color:#555;margin-top:2px;"><strong>ID:</strong> ${t.patient_id}</div>
  <div style="font-size:13px;color:#333;margin-top:2px;">${t.age || '?'}, ${t.sex || '?'}, ${t.species} – ${t.breed}</div>
  ${t.problem_list && t.problem_list.length > 0 ? `
  <div style="font-size:13px;line-height:1.45;margin-top:6px;">
    <strong>Problems:</strong> ${t.problem_list.join(', ')}
  </div>` : ''}
  <div style="font-size:12px;color:#444;margin-top:6px;">
    <strong>Location:</strong> ${t.location || 'N/A'}&nbsp;|&nbsp;
    <strong>Admitting:</strong> ${t.requesting_clinician}
  </div>
  <div style="font-size:12px;margin-top:6px;">
    ${isDouble ? `<div style="color:#d32f2f;font-weight:700;">DOUBLE TRANSFER - ${service} & ${otherServices}</div>` : ''}
    <div>${t.already_transferred ? 'ALREADY TRANSFERRED' : 'PENDING TRANSFER'}</div>
  </div>
</div>`;
          }).join('')}
        </div>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:8px 0;">`;
        }).join('')}
        <p style="margin:0;color:#666;font-size:12px;">
          Auto-generated transfer communication.
        </p>
      </div>
    </div>
  </body>
</html>`;

    // Send email with all recipients BCC'd
    const bccEmails = recipients.map(r => r.email);
    await base44.integrations.Core.SendEmail({
      to: recipients[0].email,
      bcc: bccEmails,
      subject: `[VetHub] ${pending.length} Pending Transfer${pending.length !== 1 ? 's' : ''}`,
      body: emailBody
    });

    return Response.json({
      success: true,
      transfers_count: pending.length,
      recipients_count: recipients.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});