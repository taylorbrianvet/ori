import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const SERVICES = [
  "Anesthesia","Cardiology","Clinical Pathology","Dermatology","Emergency",
  "Critical Care","Internal Medicine","Interventional Radiology","Neurology",
  "Nutrition","Medical Oncology","Radiation Oncology","Ophthalmology",
  "Orthopedic Surgery","Primary Care","General Surgery","Radiology","Soft Tissue Surgery"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { pdf_url, journal_id } = await req.json();
    if (!pdf_url) return Response.json({ error: 'pdf_url required' }, { status: 400 });

    // Step 1: Extract text from PDF via OpenAI vision
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a veterinary medical article parser. Extract all text content from this PDF article. Return the complete text as-is, preserving the structure (title, authors, abstract, body, references). Output only the raw extracted text with no extra commentary.`
            },
            {
              type: "image_url",
              image_url: { url: pdf_url, detail: "high" }
            }
          ]
        }
      ],
      max_tokens: 4000
    });

    const full_text = extractionResponse.choices[0].message.content;

    // Step 2: Parse structured data + AI analysis
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a veterinary clinical librarian and AI assistant. Analyze the provided veterinary article text and extract structured information. Be precise and concise.

For journal_name: Use the standard abbreviation (e.g., JAVMA, VCOT, JVIM, JAVS, AJVR, JVCS, VetSurg, Front Vet Sci). Be consistent — do not spell out names that have common abbreviations.

For associated_services: Only select from this exact list: ${SERVICES.join(', ')}.

For procedures: List specific veterinary procedures mentioned (e.g., gastropexy, TPLO, thoracotomy, cystotomy).

For disease_processes: List specific diseases, conditions, or diagnoses discussed (e.g., gastric dilatation volvulus, osteosarcoma, epilepsy).

For ai_summary: Write a thorough 3-5 sentence summary of the article, covering the study design, key findings, and conclusions. Write for a veterinary resident audience.

For ai_clinical_takeaway: Write exactly 1-2 sentences capturing the single most important clinical implication of this article. Be specific and actionable.

For article_url: Extract any DOI (format as https://doi.org/...) or URL mentioned in the article. If none found, return null.`
        },
        {
          role: "user",
          content: `Here is the article text:\n\n${full_text}\n\nReturn a JSON object with these exact fields:\n{\n  "title": string,\n  "journal_name": string,\n  "journal_year": number,\n  "authors": string[],\n  "abstract": string,\n  "ai_summary": string,\n  "ai_clinical_takeaway": string,\n  "associated_services": string[],\n  "procedures": string[],\n  "disease_processes": string[],\n  "keywords": string[],\n  "article_url": string | null\n}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    const parsed = JSON.parse(parseResponse.choices[0].message.content);

    // Update the journal record
    const updateData = {
      title: parsed.title || "Untitled Article",
      journal_name: parsed.journal_name || null,
      journal_year: parsed.journal_year || null,
      authors: parsed.authors || [],
      abstract: parsed.abstract || null,
      full_text,
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