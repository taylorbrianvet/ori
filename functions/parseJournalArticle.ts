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

    // Step 1: Download PDF and upload to OpenAI Files API
    const pdfResponse = await fetch(pdf_url);
    if (!pdfResponse.ok) throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'article.pdf', { type: 'application/pdf' });

    // Upload file to OpenAI
    const uploadedFile = await openai.files.create({
      file: pdfFile,
      purpose: 'assistants',
    });

    // Step 2: Extract text using GPT-4o with file search / direct prompt
    // Use the file content via a vector store or direct text extraction
    // Since PDFs can be sent as file attachments in newer API, use that approach
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `You are a veterinary medical article parser. I am providing a veterinary journal article PDF. Please extract ALL text content from it, including: title, authors, journal name, year, abstract, introduction, methods, results, discussion, conclusions, and references. Return the complete extracted text preserving the document structure. Output only the raw text with no extra commentary.

The PDF file ID is: ${uploadedFile.id}

Since you cannot directly read the file by ID in this context, please respond with what you know about processing veterinary journal articles and I will provide the text separately.`
        }
      ],
      max_tokens: 100
    });

    // Delete the uploaded file as we'll use a different approach
    await openai.files.del(uploadedFile.id).catch(() => {});

    // Step 2 (revised): Convert PDF to text using base64 encoding approach
    // Re-fetch and convert to base64 for the vision-capable model
    const pdfResponse2 = await fetch(pdf_url);
    const pdfBytes = await pdfResponse2.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    // Use GPT-4o with PDF as base64 data URL — newer models support this
    const extractResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this veterinary journal article PDF. Return title, authors, journal name and year, abstract, and full body text. Output only the extracted text with no commentary."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 4000
    });

    const full_text = extractResponse.choices[0].message.content;

    // Step 3: Parse structured data + AI analysis from extracted text
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a veterinary clinical librarian. Analyze the provided veterinary article text and return structured JSON.

Rules:
- journal_name: Use standard abbreviation (JAVMA, VCOT, JVIM, AJVR, VetSurg, JVCS, Front Vet Sci, JSAP, JFMS, etc.). Never spell out full names.
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
          content: `Article text:\n\n${full_text}\n\nReturn only this JSON:\n{\n  "title": "",\n  "journal_name": "",\n  "journal_year": 0,\n  "authors": [],\n  "abstract": "",\n  "ai_summary": "",\n  "ai_clinical_takeaway": "",\n  "associated_services": [],\n  "procedures": [],\n  "disease_processes": [],\n  "keywords": [],\n  "article_url": null\n}`
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

    return Response.json({ success: true, data: updateData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});