import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { transcript, wound_location, change_date, image_pre_url, image_post_url } = await req.json();

    const today = change_date || new Date().toISOString().split('T')[0];

    const systemPrompt = `You are a veterinary wound care assistant. Parse the following wound care transcript and extract structured data. Return ONLY valid JSON with these exact fields (use null for anything not mentioned):

{
  "wound_type": one of ["Open wound","Graft site","Abscess","Dehiscence","Surgical wound","Laceration","Pressure wound","Other"] or null,
  "exudate_type": one of ["None","Serous","Serosanguineous","Sanguineous","Purulent","Mucopurulent"] or null,
  "exudate_amount": one of ["None","Minimal","Mild","Moderate","Marked"] or null,
  "pocketing_present": true/false,
  "pocketing_description": string or null,
  "granulation_tissue": true/false,
  "granulation_description": string or null,
  "debridement_performed": true/false,
  "debridement_type": string or null,
  "wound_closed": true/false,
  "suture_type": string or null,
  "topical_therapy": string or null (topical medications like amikacin gel, triple antibiotic, NOT dressings),
  "primary_dressing": string or null (e.g. non-adherent pad, honey alginate, silver alginate, Prisma),
  "secondary_dressing": string or null (e.g. ABD pads x2, hydrophilic foam, cast padding, gauze),
  "bandage_type": one of ["Tie-over","Modified Robert Jones","Adherent Hypafix","Soft padded","Robert Jones","Other"] or null,
  "next_change_days": number or null (number of days until next bandage change, extract from phrases like "change in 2 days" or "recheck in 3 days"),
  "wound_healed": true/false (true only if explicitly stated wound is healed/complete/resolved),
  "additional_notes": string or null (anything that doesn't fit above categories)
}`;

    const userContent = `Wound location: ${wound_location}\nToday's date: ${today}\n\nTranscript:\n${transcript || "(no transcript provided)"}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ];

    // If images provided, add them
    if (image_pre_url || image_post_url) {
      const imageContent = [{ type: "text", text: userContent }];
      if (image_pre_url) imageContent.push({ type: "image_url", image_url: { url: image_pre_url } });
      if (image_post_url) imageContent.push({ type: "image_url", image_url: { url: image_post_url } });
      messages[1] = { role: "user", content: imageContent };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    // Calculate next_change_date from days
    let next_change_date = null;
    if (parsed.next_change_days) {
      const d = new Date(today);
      d.setDate(d.getDate() + parsed.next_change_days);
      next_change_date = d.toISOString().split('T')[0];
    }

    return Response.json({ ...parsed, next_change_date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});