import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Trash2, Sparkles, Loader2, Save, FileDown, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OrgInfoPopup from './OrgInfoPopup';

export default function SectionEditor({ section, projectId, project, documents, notes, selectedDocId, onSelectDoc, onToggleComplete, onDelete }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(section.content || '');
  const [dirty, setDirty] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showOrgPopup, setShowOrgPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const textareaRef = useRef(null);

  const { data: orgInfo } = useQuery({
    queryKey: ['orgInfo'],
    queryFn: async () => {
      const items = await base44.entities.OrganizationInfo.list();
      return items[0] || {};
    },
  });

  const refDocs = documents.filter(d => d.file_url);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setPopupPos({ x: e.clientX, y: e.clientY });
    setShowOrgPopup(true);
  };

  const handleInsertOrgInfo = (value) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + value + content.substring(end);
    setContent(newContent);
    setDirty(true);
  };

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
    const guidelineText = documents
      .filter(d => ['funder_guidelines', 'proposal_template'].includes(d.category))
      .map(d => d.extracted_text).filter(Boolean).join('\n\n');
    const notesText = notes.map(n => n.content || n.extracted_text).filter(Boolean).join('\n\n');

    const prompt = `You are an expert grant writer helping draft original proposal content.

Project: ${project.title}
Funder: ${project.funder_name}
${project.description ? `Project Description: ${project.description}` : ''}
${guidelineText ? `\nFunder Guidelines (context only — do NOT copy):\n${guidelineText.slice(0, 3000)}` : ''}
${notesText ? `\nProject Notes:\n${notesText.slice(0, 2000)}` : ''}
${content ? `\nExisting Draft (improve and expand this):\n${content}` : ''}

Write original, compelling content for the "${section.title}" section of this proposal. Write from the APPLICANT's perspective. Be specific, persuasive, and do not reproduce text from the reference documents.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setContent(result);
    setDirty(true);
    setAiLoading(false);
    toast.success('AI content generated');
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Row 1: Title */}
      <div className="flex items-center gap-3">
        <button onClick={onToggleComplete} className="flex items-center gap-2 min-w-0">
          {section.is_complete
            ? <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
            : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          }
          <h2 className="font-heading font-semibold truncate">{section.title}</h2>
        </button>
        {section.is_complete && (
          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium flex-shrink-0">Complete</span>
        )}
      </div>

      {/* Row 2: Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {refDocs.length > 0 && (
          <Select
            value={selectedDocId || ''}
            onValueChange={v => onSelectDoc(v === '' ? null : v)}
          >
            <SelectTrigger className="h-8 text-xs w-44 border-dashed">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue placeholder="View a document…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>— None —</SelectItem>
              {refDocs.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  <span className="truncate max-w-[180px] block">{d.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportWord} disabled={!content}>
          <FileDown className="w-3.5 h-3.5" /> Word
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

      {/* Editor */}
      <div className="flex-1 flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={e => { setContent(e.target.value); setDirty(true); }}
          onContextMenu={handleContextMenu}
          className="flex-1 min-h-[480px] font-body text-sm leading-relaxed resize-none"
          placeholder={`Write your ${section.title} content here... (right-click to insert org info)`}
        />
        {dirty && (
          <p className="text-xs text-muted-foreground">Unsaved changes — click Save to keep your work</p>
        )}
      </div>

      {showOrgPopup && (
        <OrgInfoPopup
          x={popupPos.x}
          y={popupPos.y}
          orgInfo={orgInfo}
          onClose={() => setShowOrgPopup(false)}
          onInsert={handleInsertOrgInfo}
        />
      )}
    </div>
  );
}