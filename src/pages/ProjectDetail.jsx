import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, StickyNote, PenSquare, Paperclip, BarChart2, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import ProjectProgress from '@/components/project/ProjectProgress';
import DocumentsTab from '@/components/project/DocumentsTab';
import NotesTab from '@/components/project/NotesTab';
import ProposalTab from '@/components/project/ProposalTab';
import ReportsTab from '@/components/project/ReportsTab';
import AIAssistant from '@/components/project/AIAssistant';

const TABS = [
  { id: 'proposal', label: 'Proposal Builder', icon: PenSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
];

const STATUS_OPTIONS = ['research', 'drafting', 'review', 'submitted', 'awarded', 'declined', 'reporting'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'proposal';
  const queryClient = useQueryClient();

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.filter({ id }).then(r => r[0]),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: id }),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', id],
    queryFn: () => base44.entities.ProjectNote.filter({ project_id: id }, '-created_date'),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', id],
    queryFn: () => base44.entities.ProposalSection.filter({ project_id: id }, 'order_index'),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports', id],
    queryFn: () => base44.entities.Report.filter({ project_id: id }, 'due_date'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
  });

  const setTab = (tab) => setSearchParams({ tab });

  if (loadingProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12 text-muted-foreground">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground">{project.funder_name}</span>
              {project.funder_type && <Badge variant="outline" className="text-xs">{project.funder_type}</Badge>}
              {project.award_amount && (
                <span className="text-sm font-medium text-accent">
                  ${project.award_amount.toLocaleString()}
                </span>
              )}
              {project.submission_deadline && (
                <span className="text-xs text-muted-foreground">
                  Due {format(new Date(project.submission_deadline), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={project.status} onValueChange={(v) => updateMutation.mutate({ status: v })}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ProjectProgress project={project} />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'proposal' && (
          <ProposalTab projectId={id} project={project} sections={sections} documents={documents} notes={notes} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab projectId={id} documents={documents} />
        )}
        {activeTab === 'notes' && (
          <NotesTab projectId={id} notes={notes} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab projectId={id} project={project} reports={reports} />
        )}
        {activeTab === 'ai' && (
          <AIAssistant project={project} documents={documents} notes={notes} />
        )}
      </div>
    </div>
  );
}