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

    // Format the email body
    let emailBody = `Daily Inter-Service Transfer Report\n`;
    emailBody += `\nYou have ${pending.length} pending patient transfer${pending.length !== 1 ? 's' : ''}:\n\n`;

    pending.forEach(t => {
      emailBody += `• ${t.patient_name} (ID: ${t.patient_id}) - ${t.species} ${t.breed}\n`;
      emailBody += `  From: ${t.requesting_service} → To: ${t.receiving_service}\n`;
      emailBody += `  Location: ${t.location || 'N/A'} | Requested by: ${t.requesting_clinician}\n`;
      if (t.problem_list && t.problem_list.length > 0) {
        emailBody += `  Problems: ${t.problem_list.join(', ')}\n`;
      }
      if (t.notes) {
        emailBody += `  Notes: ${t.notes}\n`;
      }
      emailBody += `\n`;
    });

    emailBody += `Log in to the app to view full details and mark transfers as complete.\n`;

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