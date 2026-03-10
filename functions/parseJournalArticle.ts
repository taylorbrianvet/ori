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
- ai_summary: A comprehensive, highly detailed HTML summary for journal club. I am preparing to present an in-depth summary of a veterinary research article for a journal club discussion. Produce a comprehensive, highly detailed, and professionally written summary that addresses each of the following criteria. Do not limit the length or level of detail; include all relevant information and supplement with external references or knowledge where the article lacks detail. Provide a copy-and-pasteable HTML output that starts with the < character (no leading or trailing spaces, no extra blank lines, and no indentation). Use emojis to organize sections. The HTML must be valid, with minimal line breaks and no additional whitespace. Structure: (1) 📖 Introduction and Study Context — focus, design, scope, objectives; (2) ✅ Inclusion and Exclusion Criteria — criteria, demographics with precise data; (3) 🧪 Methods and Interventions — thorough overview of methods, mechanisms, supplement gaps with external knowledge; (4) 📊 Results — major findings with percentages, survival rates, comparisons, unexpected findings; (5) 🔍 Detailed Explanation of Techniques — for surgical/procedural studies, describe in depth, reference external sources for gaps; (6) 🗣️ Discussion and Takeaways — key conclusions, clinical relevance, strengths, limitations, specific data points; (7) 🌍 Integration of External Information — additional context integrated, external sources noted; (8) ✍️ References Incorporation — distinguish article-sourced vs externally referenced details. Write in paragraph format with logical flow. Professional tone suitable for a veterinary journal club.
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
      max_tokens: 4000
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