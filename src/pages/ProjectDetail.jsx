import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, StickyNote, PenSquare, Paperclip, BarChart2, Bot, Loader2, CheckSquare, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import ProjectProgress from '@/components/project/ProjectProgress';
import DocumentsTab from '@/components/project/DocumentsTab';
import NotesTab from '@/components/project/NotesTab';
import ProposalTab from '@/components/project/ProposalTab';
import ReportsTab from '@/components/project/ReportsTab';
import AIAssistant from '@/components/project/AIAssistant';
import SubmissionTab from '@/components/project/SubmissionTab';
import QuickReferenceTab from '@/components/project/QuickReferenceTab';

const TABS = [
  { id: 'proposal', label: 'Proposal Builder', icon: PenSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'submission', label: 'Final Submission Documents', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'quick-ref', label: 'Quick Reference', icon: BookOpen },
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

  const { data: submissionDocuments = [] } = useQuery({
    queryKey: ['submissionDocuments', id],
    queryFn: () => base44.entities.SubmissionDocument.filter({ project_id: id }, '-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Auto-update progress percentage based on status
      const statusOrder = ['research', 'drafting', 'review', 'submitted', 'awarded'];
      const statusIdx = statusOrder.indexOf(data.status);
      if (statusIdx >= 0) {
        const progressPercent = Math.round(((statusIdx + 1) / statusOrder.length) * 100);
        data.progress_percentage = progressPercent;
      }

      const updated = await base44.entities.Project.update(id, data);
      // Auto-file into File Storage when marked as submitted
      if (data.status === 'submitted' && project?.status !== 'submitted') {
        const alreadyFiled = await base44.entities.ProjectDocument.filter({
          project_id: id,
          category: 'submitted_proposal',
        });
        if (alreadyFiled.length === 0) {
          await base44.entities.ProjectDocument.create({
            project_id: id,
            name: `${project.title} — Submitted Proposal`,
            category: 'submitted_proposal',
            file_url: 'auto-filed',
            notes: `Auto-filed on ${new Date().toLocaleDateString()} when project status changed to submitted.`,
          });
        }
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['project-documents'] });
    },
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
    return <div className="text-center py-12 text-muted-foreground">Proposal not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/proposals" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Proposals
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
        {activeTab === 'submission' && (
          <SubmissionTab projectId={id} project={project} submissionDocuments={submissionDocuments} />
        )}
        {activeTab === 'notes' && (
          <NotesTab projectId={id} notes={notes} documents={documents} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab projectId={id} project={project} reports={reports} />
        )}
        {activeTab === 'quick-ref' && (
          <QuickReferenceTab user={user} />
        )}
        {activeTab === 'ai' && (
          <AIAssistant project={project} documents={documents} notes={notes} />
        )}
      </div>
    </div>
  );
}