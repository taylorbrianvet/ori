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

    // Format the email body with HTML
    let emailBody = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #d9536d 0%, #8b2f42 100%); padding: 30px 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .transfer-count { background-color: #f0f0f0; border-left: 4px solid #d9536d; padding: 12px 15px; margin-bottom: 25px; border-radius: 4px; }
    .transfer-count p { margin: 0; font-size: 16px; font-weight: 600; color: #333; }
    .transfer-item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 12px; background-color: #fafafa; }
    .transfer-item h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #333; }
    .transfer-item p { margin: 6px 0; font-size: 13px; color: #666; }
    .patient-info { background-color: white; padding: 8px 0; border-bottom: 1px solid #e0e0e0; margin-bottom: 10px; }
    .info-row { display: flex; font-size: 13px; margin: 6px 0; }
    .info-label { font-weight: 600; color: #333; min-width: 80px; }
    .info-value { color: #666; }
    .problems { background-color: #fff3cd; border-left: 3px solid #ffc107; padding: 8px 12px; border-radius: 4px; margin-top: 8px; font-size: 12px; }
    .problems strong { color: #856404; }
    .problems div { color: #856404; margin-top: 4px; }
    .notes { background-color: #e7f3ff; border-left: 3px solid #2196f3; padding: 8px 12px; border-radius: 4px; margin-top: 8px; font-size: 12px; }
    .notes strong { color: #0d47a1; }
    .notes div { color: #0d47a1; margin-top: 4px; }
    .cta { text-align: center; margin-top: 30px; }
    .cta-button { display: inline-block; background-color: #d9536d; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Daily Transfer Report</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <div class="content">
      <div class="transfer-count">
        <p>You have ${pending.length} pending patient transfer${pending.length !== 1 ? 's' : ''}</p>
      </div>`;

    pending.forEach(t => {
      emailBody += `
      <div class="transfer-item">
        <h3>🐾 ${t.patient_name}</h3>
        <div class="patient-info">
          <div class="info-row">
            <span class="info-label">Patient ID:</span>
            <span class="info-value">${t.patient_id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Species:</span>
            <span class="info-value">${t.species} ${t.breed}</span>
          </div>
          ${t.age ? `<div class="info-row"><span class="info-label">Age:</span><span class="info-value">${t.age}</span></div>` : ''}
        </div>
        <div class="info-row" style="margin-top: 10px;">
          <span class="info-label">Transfer:</span>
          <span class="info-value"><strong>${t.requesting_service}</strong> → <strong>${t.receiving_service}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Location:</span>
          <span class="info-value">${t.location || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Clinician:</span>
          <span class="info-value">${t.requesting_clinician}</span>
        </div>
        ${t.problem_list && t.problem_list.length > 0 ? `
        <div class="problems">
          <strong>🏥 Problems/Diagnoses:</strong>
          <div>${t.problem_list.join(', ')}</div>
        </div>` : ''}
        ${t.notes ? `
        <div class="notes">
          <strong>📝 Notes:</strong>
          <div>${t.notes}</div>
        </div>` : ''}
      </div>`;
    });

    emailBody += `
      <div class="cta">
        <a href="https://vethub.app" class="cta-button">View Full Details</a>
      </div>
    </div>
    <div class="footer">
      <p><strong>VetHub</strong> — Hospital Management System</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

    // Send emails to all recipients
    for (const recipient of recipients) {
      await base44.integrations.Core.SendEmail({
        to: recipient.email,
        subject: `[VetHub] ${pending.length} Pending Transfer${pending.length !== 1 ? 's' : ''}`,
        body: emailBody
      });
    }

    return Response.json({
      success: true,
      transfers_count: pending.length,
      recipients_count: recipients.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});