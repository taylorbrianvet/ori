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
  let uploadedFileId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { pdf_url, journal_id } = await req.json();
    if (!pdf_url) return Response.json({ error: 'pdf_url required' }, { status: 400 });

    // Step 1: Download PDF
    const pdfResponse = await fetch(pdf_url);
    if (!pdfResponse.ok) throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfFile = new File([pdfBuffer], 'article.pdf', { type: 'application/pdf' });

    // Step 2: Upload PDF to OpenAI Files API (purpose: assistants supports PDF)
    const uploaded = await openai.files.create({
      file: pdfFile,
      purpose: 'user_data',
    });
    uploadedFileId = uploaded.id;

    // Step 3: Use Responses API with file input to extract text
    const extractionResponse = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: uploadedFileId,
            },
            {
              type: "input_text",
              text: "Extract ALL text from this veterinary journal article. Include title, authors, journal name, year, abstract, and complete body text. Return only the raw extracted text with no commentary."
            }
          ]
        }
      ],
      max_output_tokens: 4000
    });

    const full_text = extractionResponse.output_text || extractionResponse.output?.[0]?.content?.[0]?.text || "";

    // Step 4: Parse structured data + AI analysis
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a veterinary clinical librarian. Analyze the provided veterinary article text and return structured JSON.

Rules:
- journal_name: Use standard abbreviation (JAVMA, VCOT, JVIM, AJVR, VetSurg, JVCS, Front Vet Sci, JSAP, JFMS, etc.)
- associated_services: Only pick from: ${SERVICES.join(', ')}
- procedures: Specific vet procedures (e.g., gastropexy, TPLO, splenectomy)
- disease_processes: Specific diseases/diagnoses (e.g., GDV, osteosarcoma, BOAS)
- ai_summary: 3-5 sentences covering study design, key findings, conclusions — written for a vet resident
- ai_clinical_takeaway: Exactly 1-2 sentences, the single most important clinical implication, specific and actionable
- article_url: Format DOI as https://doi.org/... if found, otherwise null
- keywords: 5-10 key search terms`
        },
        {
          role: "user",
          content: `Article text:\n\n${full_text}\n\nReturn only valid JSON:\n{\n  "title": "",\n  "journal_name": "",\n  "journal_year": 0,\n  "authors": [],\n  "abstract": "",\n  "ai_summary": "",\n  "ai_clinical_takeaway": "",\n  "associated_services": [],\n  "procedures": [],\n  "disease_processes": [],\n  "keywords": [],\n  "article_url": null\n}`
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

    // Cleanup uploaded file
    await openai.files.del(uploadedFileId).catch(() => {});

    return Response.json({ success: true, data: updateData });
  } catch (error) {
    if (uploadedFileId) await openai.files.del(uploadedFileId).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});