import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'funder_guidelines', label: 'Funder Guidelines' },
  { value: 'proposal_template', label: 'Proposal Template' },
  { value: 'budget_template', label: 'Budget Template' },
  { value: 'support_letter', label: 'Support Letter' },
  { value: 'audit_statement', label: 'Audit Statement' },
  { value: 'insurance_proof', label: 'Proof of Insurance' },
  { value: 'organizational_docs', label: 'Organizational Docs' },
  { value: 'reporting_template', label: 'Reporting Template' },
  { value: 'submitted_report', label: 'Submitted Report' },
  { value: 'other', label: 'Other' },
];

const categoryColors = {
  funder_guidelines: 'bg-primary/10 text-primary',
  proposal_template: 'bg-accent/10 text-accent',
  budget_template: 'bg-chart-3/20 text-chart-3',
  support_letter: 'bg-chart-4/20 text-chart-4',
  audit_statement: 'bg-secondary text-secondary-foreground',
  insurance_proof: 'bg-secondary text-secondary-foreground',
  organizational_docs: 'bg-secondary text-secondary-foreground',
  reporting_template: 'bg-primary/10 text-primary',
  submitted_report: 'bg-accent/10 text-accent',
  other: 'bg-secondary text-secondary-foreground',
};

export default function DocumentsTab({ projectId, documents }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('funder_guidelines');
  const [docName, setDocName] = useState('');
  const [extractingId, setExtractingId] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', projectId] }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ProjectDocument.create({
      project_id: projectId,
      name: docName || file.name,
      category,
      file_url,
      file_type: file.name.split('.').pop(),
    });
    queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    setDocName('');
    setUploading(false);
    toast.success('Document uploaded');
    e.target.value = '';
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

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = documents.filter(d => d.category === cat.value);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <h3 className="font-heading font-semibold text-sm mb-4">Upload Document</h3>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">Document Name</Label>
              <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Leave blank to use filename" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">File</Label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={handleUpload}
                disabled={uploading}
                className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground cursor-pointer"
              />
              {uploading && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents by category */}
      {CATEGORIES.map(cat => {
        const docs = grouped[cat.value] || [];
        if (docs.length === 0) return null;
        return (
          <div key={cat.value}>
            <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <Badge variant="secondary" className={`${categoryColors[cat.value]} text-xs`}>{cat.label}</Badge>
            </h3>
            <div className="space-y-2">
              {docs.map(doc => (
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExtract(doc)} disabled={extractingId === doc.id}>
                          {extractingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                        </Button>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(doc.id)}>
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

      {documents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      )}
    </div>
  );
}