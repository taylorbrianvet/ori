import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const SERVICES = [
  "Anesthesia","Cardiology","Clinical Pathology","Dermatology","Emergency",
  "Critical Care","Internal Medicine","Interventional Radiology","Neurology",
  "Nutrition","Medical Oncology","Radiation Oncology","Ophthalmology",
  "Orthopedic Surgery","Primary Care","General Surgery","Radiology","Soft Tissue Surgery"
];

Deno.serve(async (req) => {
  try {
    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Accepts either raw text (extracted client-side) or pdf_url
    const { raw_text, journal_id } = await req.json();
    if (!raw_text) return Response.json({ error: 'raw_text required' }, { status: 400 });

    // Parse structured data + AI analysis from raw text
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a veterinary clinical librarian. Analyze the provided veterinary article text and return a structured JSON object.

Rules:
- journal_name: Use standard abbreviation only (JAVMA, VCOT, JVIM, AJVR, VetSurg, JVCS, Front Vet Sci, JSAP, JFMS, etc.). Never spell out full names.
- associated_services: ONLY choose from: ${SERVICES.join(', ')}
- procedures: Specific veterinary procedures (e.g., gastropexy, TPLO, splenectomy, thoracotomy, cystotomy)
- disease_processes: Specific diseases/diagnoses (e.g., gastric dilatation volvulus, osteosarcoma, BOAS, epilepsy)
- ai_summary: 3-5 sentences covering study design, key findings, conclusions — for a veterinary resident audience
- ai_clinical_takeaway: Exactly 1-2 sentences, the single most important clinical implication, specific and actionable
- article_url: Format any DOI as https://doi.org/... if found, otherwise null
- keywords: 5-10 key search terms most useful for finding this article`
        },
        {
          role: "user",
          content: `Article text:\n\n${raw_text.slice(0, 12000)}\n\nReturn ONLY this JSON:\n{\n  "title": "",\n  "journal_name": "",\n  "journal_year": 0,\n  "authors": [],\n  "abstract": "",\n  "ai_summary": "",\n  "ai_clinical_takeaway": "",\n  "associated_services": [],\n  "procedures": [],\n  "disease_processes": [],\n  "keywords": [],\n  "article_url": null\n}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    const parsed = JSON.parse(parseResponse.choices[0].message.content);

    const updateData = {
      title: parsed.title || "Untitled Article",
      journal_name: parsed.journal_name || null,
      journal_year: parsed.journal_year || null,
      authors: parsed.authors || [],
      abstract: parsed.abstract || null,
      full_text: raw_text.slice(0, 8000),
      ai_summary: parsed.ai_summary || null,
      ai_clinical_takeaway: parsed.ai_clinical_takeaway || null,
      associated_services: (parsed.associated_services || []).filter(s => SERVICES.includes(s)),
      procedures: parsed.procedures || [],
      disease_processes: parsed.disease_processes || [],
      keywords: parsed.keywords || [],
      article_url: parsed.article_url || null,
      ai_processed: true
    };

    if (journal_id) {
      await base44.entities.Journal.update(journal_id, updateData);
    }

    return Response.json({ success: true, data: updateData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});