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

    // Step 2: Upload PDF to OpenAI Files API
    const uploaded = await openai.files.create({
      file: pdfFile,
      purpose: 'user_data',
    });
    uploadedFileId = uploaded.id;

    // Step 3: Extract text + parse everything in one call using the file attachment
    const extractAndParseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a veterinary clinical librarian. Analyze the attached veterinary journal article PDF and return a single structured JSON object.

Rules:
- journal_name: Use standard abbreviation only (JAVMA, VCOT, JVIM, AJVR, VetSurg, JVCS, Front Vet Sci, JSAP, JFMS, etc.). Never spell out full names that have abbreviations.
- associated_services: ONLY choose from this exact list: ${SERVICES.join(', ')}
- procedures: List specific veterinary procedures mentioned (e.g., gastropexy, TPLO, splenectomy, thoracotomy)
- disease_processes: List specific diseases/diagnoses discussed (e.g., gastric dilatation volvulus, osteosarcoma, BOAS, epilepsy)
- ai_summary: Write 3-5 sentences covering the study design, key findings, and conclusions. Write for a veterinary resident audience.
- ai_clinical_takeaway: Write exactly 1-2 sentences capturing the single most important clinical implication. Be specific and actionable.
- full_text: Extract the complete article text preserving structure (title, authors, abstract, body, references)
- article_url: Format DOI as https://doi.org/... if found in the article, otherwise null
- keywords: Extract 5-10 key search terms most useful for finding this article`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this veterinary journal article PDF and return ONLY this JSON structure with no other text:\n{\n  "title": "",\n  "journal_name": "",\n  "journal_year": 0,\n  "authors": [],\n  "abstract": "",\n  "full_text": "",\n  "ai_summary": "",\n  "ai_clinical_takeaway": "",\n  "associated_services": [],\n  "procedures": [],\n  "disease_processes": [],\n  "keywords": [],\n  "article_url": null\n}`
            },
            {
              type: "file",
              file: { file_id: uploadedFileId }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    const parsed = JSON.parse(extractAndParseResponse.choices[0].message.content);

    const updateData = {
      title: parsed.title || "Untitled Article",
      journal_name: parsed.journal_name || null,
      journal_year: parsed.journal_year || null,
      authors: parsed.authors || [],
      abstract: parsed.abstract || null,
      full_text: parsed.full_text || null,
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