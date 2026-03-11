import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate the 6am–6am window in Central Time (UTC-6 standard, UTC-5 daylight)
    // We detect current offset by checking DST: March–November = CDT (UTC-5), else CST (UTC-6)
    const now = new Date();
    const month = now.getUTCMonth(); // 0=Jan, 11=Dec
    const isDST = month >= 2 && month <= 10; // rough DST window
    const offsetHours = isDST ? 5 : 6; // hours behind UTC

    // "Today 6am CT" in UTC
    const todaySixAmUTC = new Date(now);
    todaySixAmUTC.setUTCHours(6 + offsetHours, 0, 0, 0);

    // "Yesterday 6am CT" in UTC
    const yesterdaySixAmUTC = new Date(todaySixAmUTC);
    yesterdaySixAmUTC.setUTCDate(yesterdaySixAmUTC.getUTCDate() - 1);

    // Get all transfers
    const allTransfers = await base44.asServiceRole.entities.InterserviceTransfer.list();

    // Filter to only those submitted in the previous 6am–6am window
    const transfers = allTransfers.filter(t => {
      if (!t.created_date) return false;
      const s = /[Z+\-]\d*$/.test(t.created_date) ? t.created_date : t.created_date + "Z";
      const created = new Date(s);
      return created >= yesterdaySixAmUTC && created < todaySixAmUTC;
    });

    if (transfers.length === 0) {
      return Response.json({ message: "No transfers in the 6am–6am window to report" });
    }

    // Get all staff who opted in
    const staff = await base44.asServiceRole.entities.Staff.list();
    const recipients = staff.filter(s => s.receive_transfer_emails !== false && s.email);

    if (recipients.length === 0) {
      return Response.json({ message: "No recipients opted in" });
    }

    // Group by receiving service
    const byService = {};
    transfers.forEach(t => {
      const svc = t.receiving_service || "Unknown";
      if (!byService[svc]) byService[svc] = [];
      byService[svc].push(t);
    });

    // Detect double transfers (same patient_id in multiple services)
    const patientMap = {};
    transfers.forEach(t => {
      const key = t.patient_id || t.patient_name;
      if (!patientMap[key]) patientMap[key] = [];
      patientMap[key].push(t);
    });
    const doubleSet = new Set();
    Object.values(patientMap).forEach(group => {
      if (group.length > 1) group.forEach(t => doubleSet.add(t.id));
    });

    // Format window label
    const dateLabel = yesterdaySixAmUTC.toLocaleDateString("en-US", {
      timeZone: "America/Chicago",
      weekday: "long", month: "long", day: "numeric"
    });

    // Build email
    let emailBody = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#111;">
    <div style="max-width:760px;margin:0 auto;padding:20px;">
      <div style="background:#ffffff;border:1px solid #e3e6ea;border-radius:10px;padding:20px;">
        <h2 style="margin:0 0 4px 0;font-size:22px;">Interservice Transfer List</h2>
        <p style="margin:0 0 16px 0;color:#777;font-size:13px;">
          Transfers submitted ${dateLabel} — 6:00 AM to 6:00 AM CT
        </p>
        <div style="padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;font-size:13px;line-height:1.7;">
          <div><strong>Total Transfers:</strong> ${transfers.length}</div>
          ${doubleSet.size > 0 ? `<div style="color:#d32f2f;font-weight:700;">⚠ Double Transfers: ${doubleSet.size}</div>` : ''}
          <div style="margin-top:6px;font-size:12px;color:#555;">
            ${Object.keys(byService).sort().map(svc => `<span style="margin-right:12px;">${svc}: <strong>${byService[svc].length}</strong></span>`).join('')}
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #e9ecef;margin:0 0 16px 0;">
        ${Object.keys(byService).sort().map(svc => {
          const list = byService[svc];
          return `
        <div style="margin-bottom:20px;">
          <h3 style="margin:0 0 10px 0;font-size:16px;color:#1a1a2e;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">
            → ${svc} <span style="font-size:13px;color:#888;font-weight:400;">(${list.length} patient${list.length !== 1 ? 's' : ''})</span>
          </h3>
          ${list.map(t => {
            const isDouble = doubleSet.has(t.id);
            const others = (patientMap[t.patient_id || t.patient_name] || [])
              .filter(x => x.id !== t.id).map(x => x.receiving_service).join(' & ');
            return `
          <div style="border:1px solid ${isDouble ? '#f5c6cb' : '#e5e7eb'};border-radius:8px;padding:12px 14px;margin-bottom:10px;background:${isDouble ? '#fff5f5' : '#fff'};">
            ${isDouble ? `<div style="color:#d32f2f;font-weight:700;font-size:12px;margin-bottom:6px;">⚠ DOUBLE TRANSFER — also going to ${others}</div>` : ''}
            <div style="font-weight:700;font-size:15px;">${t.patient_name}</div>
            <div style="font-size:12px;color:#666;margin-top:2px;">ID: ${t.patient_id || 'N/A'} &nbsp;|&nbsp; ${[t.age, t.sex, t.species, t.breed].filter(Boolean).join(', ')}</div>
            ${(t.problem_list && t.problem_list.length > 0) ? `<div style="font-size:13px;margin-top:6px;"><strong>Problems:</strong> ${t.problem_list.join(', ')}</div>` : ''}
            <div style="font-size:12px;color:#555;margin-top:6px;">
              <strong>From:</strong> ${t.requesting_service || 'N/A'} &nbsp;|&nbsp;
              <strong>Clinician:</strong> ${t.requesting_clinician || 'N/A'} &nbsp;|&nbsp;
              <strong>Location:</strong> ${t.location || 'N/A'}
            </div>
            ${t.estimate ? `<div style="font-size:12px;color:#555;margin-top:4px;"><strong>Estimate:</strong> $${Number(t.estimate).toLocaleString()}</div>` : ''}
            ${t.notes ? `<div style="font-size:12px;color:#777;margin-top:4px;font-style:italic;">${t.notes}</div>` : ''}
            <div style="margin-top:8px;">
              <span style="font-size:11px;padding:2px 8px;border-radius:12px;font-weight:600;background:${t.already_transferred ? '#d4edda' : '#fff3cd'};color:${t.already_transferred ? '#155724' : '#856404'};">
                ${t.already_transferred ? 'Already Transferred' : 'Pending Transfer'}
              </span>
            </div>
          </div>`;
          }).join('')}
        </div>`;
        }).join('')}
        <p style="margin:16px 0 0 0;color:#999;font-size:11px;text-align:center;">
          Auto-generated by ORI · Daily 6 AM transfer report
        </p>
      </div>
    </div>
  </body>
</html>`;

    const emailList = recipients.map(r => r.email).filter(Boolean);
    await base44.integrations.Core.SendEmail({
      to: emailList[0],
      subject: `Transfer Report — ${dateLabel} (${transfers.length} patient${transfers.length !== 1 ? 's' : ''})`,
      body: emailBody
    });

    // BCC remaining recipients individually to avoid exposure
    for (let i = 1; i < emailList.length; i++) {
      await base44.integrations.Core.SendEmail({
        to: emailList[i],
        subject: `Transfer Report — ${dateLabel} (${transfers.length} patient${transfers.length !== 1 ? 's' : ''})`,
        body: emailBody
      });
    }

    return Response.json({
      success: true,
      window: `${yesterdaySixAmUTC.toISOString()} → ${todaySixAmUTC.toISOString()}`,
      transfers_count: transfers.length,
      recipients_count: emailList.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});