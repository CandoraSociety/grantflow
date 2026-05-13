import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckCircle2, Circle, Loader2, Sparkles, Download, ChevronUp, ChevronDown, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SectionEditor from './SectionEditor';
import GenerateDocModal from './GenerateDocModal';

const SECTION_TYPES = [
  { value: 'abstract', label: 'Abstract / Executive Summary' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'narrative', label: 'Project Narrative' },
  { value: 'budget', label: 'Budget' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'references', label: 'References' },
  { value: 'appendix', label: 'Appendix' },
  { value: 'custom', label: 'Custom Section' },
];

export default function ProposalTab({ projectId, project, sections, documents, notes }) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionType, setNewSectionType] = useState('custom');
  const [generating, setGenerating] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProposalSection.create(data),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['sections', projectId] });
      setActiveSection(s.id);
      setShowAddSection(false);
      setNewSectionTitle('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProposalSection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', projectId] });
      setActiveSection(null);
    },
  });

  const toggleComplete = async (section) => {
    await base44.entities.ProposalSection.update(section.id, { is_complete: !section.is_complete });
    queryClient.invalidateQueries({ queryKey: ['sections', projectId] });
    // Auto-update project progress
    const total = sections.length;
    const completed = sections.filter(s => s.id === section.id ? !section.is_complete : s.is_complete).length;
    const progress = total > 0 ? Math.round((completed / total) * 80) + 10 : 10;
    await base44.entities.Project.update(projectId, { progress_percentage: progress, status: progress > 70 ? 'review' : 'drafting' });
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  };

  const handleAddSection = () => {
    createMutation.mutate({
      project_id: projectId,
      title: newSectionTitle || SECTION_TYPES.find(t => t.value === newSectionType)?.label || 'New Section',
      section_type: newSectionType,
      order_index: sections.length,
      content: '',
      is_complete: false,
    });
  };

  const handleGenerateTemplate = async () => {
    setGenerating(true);
    const guidelineText = documents.filter(d => d.category === 'funder_guidelines').map(d => d.extracted_text).filter(Boolean).join('\n\n');
    const notesText = notes.map(n => n.content || n.extracted_text).filter(Boolean).join('\n\n');

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a grant writing expert helping draft a NEW proposal from scratch.

Project: ${project.title}
Funder: ${project.funder_name}
${guidelineText ? `\nFunder Guidelines (use ONLY to understand what sections are required and what the funder wants — do NOT copy this text into the proposal):\n${guidelineText.slice(0, 4000)}` : ''}
${notesText ? `\nProject Notes (use as background context):\n${notesText.slice(0, 2000)}` : ''}

Generate a list of proposal sections that this applicant needs to write. For each section, write a SHORT placeholder prompt (1-2 sentences) telling the user what they should write in that section — do NOT reproduce or paraphrase the funder guidelines text. The content should be an original writing prompt/guide for the applicant.

Return a JSON array of sections: [{"title": "...", "section_type": "narrative|budget|timeline|abstract|custom", "content": "starter prompt for the user..."}]`,
      response_json_schema: {
        type: 'object',
        properties: {
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                section_type: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
        },
      },
    });

    for (let i = 0; i < res.sections.length; i++) {
      await base44.entities.ProposalSection.create({
        project_id: projectId,
        title: res.sections[i].title,
        section_type: res.sections[i].section_type || 'custom',
        content: res.sections[i].content,
        order_index: sections.length + i,
        is_complete: false,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['sections', projectId] });
    await base44.entities.Project.update(projectId, { status: 'drafting', proposal_approach: 'ai_generated' });
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    setGenerating(false);
    toast.success(`Generated ${res.sections.length} sections`);
  };

  const completedCount = sections.filter(s => s.is_complete).length;
  const activeS = sections.find(s => s.id === activeSection);

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar - Section Navigator */}
      <div className="w-52 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{completedCount}/{sections.length} complete</span>
          <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => setShowDocModal(true)} disabled={sections.length === 0}>
            <FileDown className="w-3 h-3" /> Export
          </Button>
        </div>

        {sections.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center py-4">No sections yet</p>
            <Button size="sm" className="w-full gap-2" variant="outline" onClick={handleGenerateTemplate} disabled={generating}>
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI Generate Template
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2',
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary text-foreground'
                )}
              >
                {section.is_complete
                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-accent" />
                  : <Circle className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                }
                <span className="truncate text-xs">{section.title}</span>
              </button>
            ))}
          </div>
        )}

        <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setShowAddSection(!showAddSection)}>
          <Plus className="w-3.5 h-3.5" /> Add Section
        </Button>

        {showAddSection && (
          <Card className="border border-border shadow-sm">
            <CardContent className="p-3 space-y-2">
              <Select value={newSectionType} onValueChange={setNewSectionType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                placeholder="Custom title (optional)"
                className="h-8 text-xs"
              />
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleAddSection} disabled={createMutation.isPending}>
                Add
              </Button>
            </CardContent>
          </Card>
        )}

        {sections.length === 0 && (
          <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={handleGenerateTemplate} disabled={generating}>
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            AI Generate
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {activeS ? (
          <SectionEditor
            section={activeS}
            projectId={projectId}
            project={project}
            documents={documents}
            notes={notes}
            onToggleComplete={() => toggleComplete(activeS)}
            onDelete={() => deleteMutation.mutate(activeS.id)}
          />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <p className="text-sm">Select a section to start editing</p>
            {sections.length === 0 && (
              <Button className="mt-4 gap-2" onClick={handleGenerateTemplate} disabled={generating}>
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Generate Template
              </Button>
            )}
          </div>
        )}
      </div>

      {showDocModal && (
        <GenerateDocModal sections={sections} project={project} onClose={() => setShowDocModal(false)} />
      )}
    </div>
  );
}