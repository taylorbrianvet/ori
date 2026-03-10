import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Star, ExternalLink, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import { toast } from "sonner";
import { format } from "date-fns";

function fmt(d) {
  if (!d) return "";
  try { return format(new Date(d), "MMM d, yyyy"); } catch { return d; }
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function JournalDetail() {
  const params = new URLSearchParams(window.location.search);
  const journalId = params.get("id");
  const queryClient = useQueryClient();

  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const { data: journal, isLoading } = useQuery({
    queryKey: ["journal", journalId],
    queryFn: () => base44.entities.Journal.filter({ id: journalId }).then(r => r[0]),
    enabled: !!journalId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["journal-comments", journalId],
    queryFn: () => base44.entities.JournalComment.filter({ journal_id: journalId }, "-created_date"),
    enabled: !!journalId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const userEmail = currentUser?.email || "";
  const isFav = (journal?.favorited_by || []).includes(userEmail);

  const toggleFav = async () => {
    if (!journal) return;
    setToggling(true);
    const favs = journal.favorited_by || [];
    const newFavs = isFav ? favs.filter(e => e !== userEmail) : [...favs, userEmail];
    await base44.entities.Journal.update(journal.id, { favorited_by: newFavs });
    queryClient.invalidateQueries({ queryKey: ["journal", journalId] });
    setToggling(false);
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    await base44.entities.JournalComment.create({
      journal_id: journalId,
      comment: comment.trim(),
      author_email: userEmail,
      author_name: currentUser?.full_name || userEmail,
    });
    setComment("");
    queryClient.invalidateQueries({ queryKey: ["journal-comments", journalId] });
    setSubmitting(false);
  };

  if (isLoading) return (
    <PageContainer>
      <div className="py-20 text-center text-white/40 text-sm">Loading…</div>
    </PageContainer>
  );

  if (!journal) return (
    <PageContainer>
      <div className="py-20 text-center text-white/40 text-sm">Article not found.</div>
    </PageContainer>
  );

  const authors = journal.authors || [];
  const authorStr = authors.join(", ");

  return (
    <PageContainer>
      {/* Back nav */}
      <div className="mb-5">
        <Link to={createPageUrl("JournalClub")}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Journal Club
        </Link>
      </div>

      {/* Article header */}
      <div className="glass-card p-5 mb-4">
        {/* Journal badge + fav + external link */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {journal.journal_name && (
              <span className="text-[10px] text-white/45 bg-white/8 px-2 py-0.5 rounded-full">
                {journal.journal_name}{journal.journal_year ? ` · ${journal.journal_year}` : ""}
              </span>
            )}
            {journal.uploaded_by_name && (
              <span className="text-[10px] text-white/30">Uploaded by {journal.uploaded_by_name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {journal.article_url && (
              <a href={journal.article_url} target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button onClick={toggleFav} disabled={toggling}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isFav ? "bg-amber-500/20 text-amber-400" : "bg-white/8 hover:bg-white/15 text-white/35 hover:text-amber-400"
              }`}>
              <Star className={`w-3.5 h-3.5 ${isFav ? "fill-amber-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold text-white leading-snug mb-2">{journal.title}</h1>

        {/* Authors */}
        {authorStr && (
          <p className="text-xs text-white/45 mb-4">{authorStr}</p>
        )}

        {/* Clinical Takeaway — prominent */}
        {journal.ai_clinical_takeaway && (
          <div className="rounded-xl bg-white/8 border border-white/12 px-4 py-3">
            <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Clinical Takeaway</p>
            <p className="text-sm text-white/85 leading-relaxed font-medium">{journal.ai_clinical_takeaway}</p>
          </div>
        )}
      </div>

      {/* Service + keyword tags */}
      {((journal.associated_services || []).length > 0 || (journal.procedures || []).length > 0 || (journal.disease_processes || []).length > 0) && (
        <Section title="Services, Procedures & Disease Processes" defaultOpen={false}>
          <div className="space-y-3">
            {(journal.associated_services || []).length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {journal.associated_services.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/55">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {(journal.procedures || []).length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Procedures</p>
                <div className="flex flex-wrap gap-1.5">
                  {journal.procedures.map(p => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-white/45">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {(journal.disease_processes || []).length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Disease Processes</p>
                <div className="flex flex-wrap gap-1.5">
                  {journal.disease_processes.map(d => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-white/45">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* AI Summary */}
      {journal.ai_summary && (
        <div className="mb-4">
          <Section title="Journal Club Summary" defaultOpen={true}>
            {journal.ai_summary.trim().startsWith("<") ? (
              <div
                className="journal-club-summary text-sm text-white/75 leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: journal.ai_summary }}
              />
            ) : (
              <p className="text-sm text-white/70 leading-relaxed">{journal.ai_summary}</p>
            )}
          </Section>
        </div>
      )}

      {/* PDF Viewer */}
      {journal.pdf_url && (
        <div className="glass-card overflow-hidden mb-4">
          <button onClick={() => setShowPdf(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">PDF</span>
            {showPdf ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>
          {showPdf && (
            <div className="w-full h-[70vh]">
              <iframe
                src={journal.pdf_url}
                className="w-full h-full border-0"
                title="Article PDF"
              />
            </div>
          )}
        </div>
      )}

      {/* Abstract */}
      {journal.abstract && (
        <div className="mt-3">
          <Section title="Abstract" defaultOpen={false}>
            <p className="text-sm text-white/60 leading-relaxed">{journal.abstract}</p>
          </Section>
        </div>
      )}

      {/* Comments */}
      <div className="mt-3 glass-card p-4">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Discussion</p>

        {/* Comment input */}
        <div className="flex gap-2 mb-4">
          <textarea
            className="flex-1 px-3 py-2.5 rounded-xl border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/30 resize-none"
            rows={2}
            placeholder="Share a thought or clinical insight…"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <button onClick={submitComment} disabled={submitting || !comment.trim()}
            className="px-3 rounded-xl bg-white/12 hover:bg-white/20 text-white transition-colors disabled:opacity-40 flex items-center justify-center">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Comment list */}
        {comments.length === 0 ? (
          <p className="text-xs text-white/25 text-center py-4">No discussion yet — be the first to comment.</p>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 flex-shrink-0 font-medium">
                  {(c.author_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white/70">{c.author_name || c.author_email}</span>
                    <span className="text-[10px] text-white/25">{fmt(c.created_date)}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{c.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}