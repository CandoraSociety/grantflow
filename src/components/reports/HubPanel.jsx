import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Calendar, FileText, LayoutTemplate, Pencil, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import HubDocUploader from './HubDocUploader';
import ManageDeadlinesModal from './ManageDeadlinesModal';
import AddHubModal from './AddHubModal';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  upcoming: 'bg-primary/10 text-primary',
  in_progress: 'bg-accent/10 text-accent',
  submitted: 'bg-green-100 text-green-700',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function HubPanel({ hub, docs = [], deadlines = [] }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [showDeadlines, setShowDeadlines] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.FunderReportingHub.delete(hub.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funder-hubs'] }),
  });

  const hubDeadlines = deadlines.filter(d => d.hub_id === hub.id);
  const upcoming = hubDeadlines.filter(d => d.status !== 'submitted').sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <>
      <Card className="border-none shadow-sm">
        <CardHeader className="p-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-3 w-full p-4 text-left hover:bg-muted/30 rounded-t-xl transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            <span className="font-semibold text-sm flex-1">{hub.name}</span>
            {upcoming.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
                <Clock className="w-3 h-3" />
                Next: {format(new Date(upcoming[0].due_date), 'MMM d, yyyy')}
                <Badge variant="secondary" className={cn('ml-1 text-xs', STATUS_COLORS[upcoming[0].status || 'upcoming'])}>
                  {upcoming[0].title}
                </Badge>
              </span>
            )}
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDeadlines(true)}>
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowEdit(true)}>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => { if (confirm(`Delete ${hub.name}?`)) deleteMutation.mutate(); }}>
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          </button>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0 pb-4 px-4">
            <div className="flex gap-2 mb-4 border-b border-border pb-3">
              <button
                onClick={() => setActiveTab('templates')}
                className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium transition-colors',
                  activeTab === 'templates' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
              >
                <LayoutTemplate className="w-3.5 h-3.5" /> Templates
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-medium transition-colors',
                  activeTab === 'reports' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
              >
                <FileText className="w-3.5 h-3.5" /> Submitted Reports
              </button>
            </div>
            <HubDocUploader hub={hub} docs={docs} docType={activeTab === 'templates' ? 'template' : 'report'} />
          </CardContent>
        )}
      </Card>

      <ManageDeadlinesModal open={showDeadlines} onClose={() => setShowDeadlines(false)} hub={hub} deadlines={deadlines} />
      <AddHubModal open={showEdit} onClose={() => setShowEdit(false)} hubType={hub.hub_type} existingHub={hub} />
    </>
  );
}