import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Trash2, ExternalLink, Sparkles, BookOpen, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

// ── Reference docs: inform the submission ──────────────────────────────────
const REFERENCE_CATEGORIES = [
  { value: 'funder_guidelines', label: 'Funder Guidelines' },
  { value: 'proposal_template', label: 'Proposal Template' },
  { value: 'budget_template', label: 'Budget Template' },
  { value: 'reporting_template', label: 'Reporting Template' },
  { value: 'notes', label: 'Notes' },
  { value: 'past_submissions', label: 'Past Relevant Submissions' },
  { value: 'other', label: 'Other Reference' },
];

// ── Submission docs: included in the final submission package ──────────────
const SUBMISSION_CATEGORIES = [
  { value: 'support_letter', label: 'Support Letter' },
  { value: 'audit_statement', label: 'Audit Statement' },
  { value: 'insurance_proof', label: 'Proof of Insurance' },
  { value: 'organizational_docs', label: 'Organizational Docs' },
  { value: 'submitted_report', label: 'Submitted Report' },
];

const ALL_CATEGORIES = [...REFERENCE_CATEGORIES, ...SUBMISSION_CATEGORIES];

const REFERENCE_VALUES = new Set(REFERENCE_CATEGORIES.map(c => c.value));

const categoryColors = {
  funder_guidelines: 'bg-primary/10 text-primary',
  proposal_template: 'bg-accent/10 text-accent',
  budget_template: 'bg-chart-3/20 text-yellow-700',
  reporting_template: 'bg-primary/10 text-primary',
  notes: 'bg-chart-3/20 text-yellow-700',
  past_submissions: 'bg-chart-4/20 text-purple-700',
  other: 'bg-secondary text-secondary-foreground',
  support_letter: 'bg-chart-4/20 text-purple-700',
  audit_statement: 'bg-secondary text-secondary-foreground',
  insurance_proof: 'bg-secondary text-secondary-foreground',
  organizational_docs: 'bg-secondary text-secondary-foreground',
  submitted_report: 'bg-accent/10 text-accent',
};

function UploadPanel({ title, icon: Icon, accentClass, categories, onUpload, uploadProgress, uploadingSection }) {
  const [category, setCategory] = useState(categories[0].value);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const sectionKey = categories[0].value;
  const isUploading = uploadingSection === sectionKey;

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    await onUpload(Array.from(files), category, sectionKey);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${accentClass} ${dragging ? 'border-primary scale-[1.01]' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-heading font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Files <span className="text-muted-foreground font-normal">(select multiple or drag &amp; drop)</span></Label>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
              onChange={e => handleFiles(e.target.files)}
              disabled={isUploading}
              className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground cursor-pointer"
            />
          </div>
        </div>
        {isUploading && uploadProgress && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading {uploadProgress.current} of {uploadProgress.total}...
          </p>
        )}
        {!isUploading && (
          <p className="text-xs text-muted-foreground">You can also drag &amp; drop files anywhere in this box</p>
        )}
      </CardContent>
    </Card>
  );
}

function DocList({ docs, onExtract, onDelete, extractingId }) {
  if (docs.length === 0) return null;

  // Group by category
  const grouped = {};
  docs.forEach(d => {
    if (!grouped[d.category]) grouped[d.category] = [];
    grouped[d.category].push(d);
  });

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, catDocs]) => {
        const label = ALL_CATEGORIES.find(c => c.value === cat)?.label || cat;
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={`${categoryColors[cat] || 'bg-secondary text-secondary-foreground'} text-xs`}>
                {label}
              </Badge>
            </div>
            <div className="space-y-2">
              {catDocs.map(doc => (
                <Card key={doc.id} className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          {doc.file_type && <span className="text-xs text-muted-foreground uppercase">{doc.file_type}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onExtract(doc)} disabled={extractingId === doc.id} title="AI extract">
                          {extractingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                        </Button>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(doc.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {doc.extracted_text && (
                      <div className="mt-3 p-3 bg-secondary rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Extracted Content</p>
                        <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-4">{doc.extracted_text}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DocumentsTab({ projectId, documents }) {
  const queryClient = useQueryClient();
  const [uploadingSection, setUploadingSection] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [extractingId, setExtractingId] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', projectId] }),
  });

  const handleUpload = async (files, category, sectionKey) => {
    if (!files || files.length === 0) return;
    setUploadingSection(sectionKey);
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ProjectDocument.create({
        project_id: projectId,
        name: file.name,
        category,
        file_url,
        file_type: file.name.split('.').pop(),
      });
    }

    queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    setUploadingSection(null);
    setUploadProgress(null);
    toast.success(files.length > 1 ? `${files.length} documents uploaded` : 'Document uploaded');
  };

  const handleExtract = async (doc) => {
    setExtractingId(doc.id);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Please extract and summarize all key information from this document. Include: requirements, deadlines, eligibility criteria, budget limits, evaluation criteria, required sections, and any other important details. Format clearly with sections.`,
      file_urls: [doc.file_url],
    });
    await base44.entities.ProjectDocument.update(doc.id, { extracted_text: res });
    queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    setExtractingId(null);
    toast.success('Text extracted');
  };

  const referenceDocs = documents.filter(d => REFERENCE_VALUES.has(d.category));
  const submissionDocs = documents.filter(d => !REFERENCE_VALUES.has(d.category));

  return (
    <div className="space-y-8">

      {/* ── REFERENCE SECTION ── */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading font-semibold text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Reference Documents
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Guidelines, templates, and background materials that inform your submission</p>
        </div>
        <UploadPanel
          title="Upload Reference Document"
          icon={BookOpen}
          accentClass="border-primary/20 hover:border-primary/40"
          categories={REFERENCE_CATEGORIES}
          onUpload={handleUpload}
          uploadProgress={uploadProgress}
          uploadingSection={uploadingSection}
        />
        {referenceDocs.length > 0
          ? <DocList docs={referenceDocs} onExtract={handleExtract} onDelete={id => deleteMutation.mutate(id)} extractingId={extractingId} />
          : <p className="text-xs text-muted-foreground text-center py-4">No reference documents yet</p>
        }
      </div>

      <div className="border-t border-border" />

      {/* ── SUBMISSION SECTION ── */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading font-semibold text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-accent" />
            Submission Documents
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Attachments and supporting materials that will be included in the final submission package</p>
        </div>
        <UploadPanel
          title="Upload Submission Document"
          icon={Paperclip}
          accentClass="border-accent/20 hover:border-accent/40"
          categories={SUBMISSION_CATEGORIES}
          onUpload={handleUpload}
          uploadProgress={uploadProgress}
          uploadingSection={uploadingSection}
        />
        {submissionDocs.length > 0
          ? <DocList docs={submissionDocs} onExtract={handleExtract} onDelete={id => deleteMutation.mutate(id)} extractingId={extractingId} />
          : <p className="text-xs text-muted-foreground text-center py-4">No submission documents yet</p>
        }
      </div>

    </div>
  );
}