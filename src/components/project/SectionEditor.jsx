import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Trash2, Sparkles, Loader2, Save, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export default function SectionEditor({ section, projectId, project, documents, notes, onToggleComplete, onDelete }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(section.content || '');
  const [dirty, setDirty] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setContent(section.content || '');
    setDirty(false);
  }, [section.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ProposalSection.update(section.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', projectId] });
      setDirty(false);
      toast.success('Saved');
    },
  });

  const handleSave = () => saveMutation.mutate({ content });

  const handleExportWord = async () => {
    const lines = content.split('\n');
    const docParagraphs = [
      new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: '' }),
      ...lines.map(line =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 24, font: 'Calibri' })],
          spacing: { after: 120 },
        })
      ),
    ];

    const doc = new Document({
      sections: [{ properties: {}, children: docParagraphs }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section.title.replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Word document downloaded');
  };

  const handleAiAssist = async () => {
    setAiLoading(true);
    const guidelineText = documents.filter(d => ['funder_guidelines', 'proposal_template'].includes(d.category))
      .map(d => d.extracted_text).filter(Boolean).join('\n\n');
    const notesText = notes.map(n => n.content || n.extracted_text).filter(Boolean).join('\n\n');

    const prompt = `You are an expert grant writer helping draft original proposal content.

Project: ${project.title}
Funder: ${project.funder_name}
${project.description ? `Project Description: ${project.description}` : ''}
${guidelineText ? `\nFunder Guidelines / Reference Documents (for context ONLY — do NOT copy or paraphrase these into the proposal):\n${guidelineText.slice(0, 3000)}` : ''}
${notesText ? `\nProject Notes:\n${notesText.slice(0, 2000)}` : ''}
${content ? `\nExisting Draft (improve and expand this):\n${content}` : ''}

Write original, compelling content for the "${section.title}" section of this proposal. The content must be written from the APPLICANT's perspective describing their own project — not the funder's perspective. Be specific, persuasive, and do not reproduce text from the reference documents.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setContent(result);
    setDirty(true);
    setAiLoading(false);
    toast.success('AI content generated');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onToggleComplete} className="flex items-center gap-2">
            {section.is_complete
              ? <CheckCircle2 className="w-5 h-5 text-accent" />
              : <Circle className="w-5 h-5 text-muted-foreground" />
            }
            <h2 className="font-heading font-semibold">{section.title}</h2>
          </button>
          {section.is_complete && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">Complete</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportWord} disabled={!content}>
            <FileDown className="w-3.5 h-3.5" />
            Word
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleAiAssist} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            AI Assist
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSave} disabled={!dirty || saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Textarea
        value={content}
        onChange={e => { setContent(e.target.value); setDirty(true); }}
        className="min-h-[400px] font-body text-sm leading-relaxed resize-y"
        placeholder={`Write your ${section.title} content here...`}
      />

      {dirty && (
        <p className="text-xs text-muted-foreground">Unsaved changes — click Save to keep your work</p>
      )}
    </div>
  );
}