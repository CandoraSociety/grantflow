import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import ReportCalendar from '@/components/dashboard/ReportCalendar';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  upcoming: 'bg-primary/10 text-primary',
  in_progress: 'bg-accent/10 text-accent',
  submitted: 'bg-accent/20 text-accent',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('due_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const getProject = (id) => projects.find(p => p.id === id);

  const enriched = reports.map(r => {
    const daysLeft = differenceInDays(new Date(r.due_date), new Date());
    const isOverdue = daysLeft < 0 && r.status !== 'submitted';
    return { ...r, daysLeft, currentStatus: isOverdue ? 'overdue' : r.status };
  });

  const filtered = statusFilter === 'all' ? enriched : enriched.filter(r => r.currentStatus === statusFilter);

  const counts = {
    all: enriched.length,
    overdue: enriched.filter(r => r.currentStatus === 'overdue').length,
    upcoming: enriched.filter(r => r.currentStatus === 'upcoming').length,
    in_progress: enriched.filter(r => r.currentStatus === 'in_progress').length,
    submitted: enriched.filter(r => r.currentStatus === 'submitted').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all reporting requirements across projects</p>
      </div>

      <ReportCalendar reports={reports} projects={projects} />

      <div className="space-y-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-card">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="overdue" className="text-destructive">Overdue ({counts.overdue})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({counts.upcoming})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({counts.in_progress})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({counts.submitted})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="border-none shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No reports found
              </CardContent>
            </Card>
          )}
          {filtered.map(report => {
            const proj = getProject(report.project_id);
            return (
              <Card key={report.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{report.title}</h3>
                        <Badge variant="secondary" className={cn('text-xs', STATUS_STYLES[report.currentStatus])}>
                          {report.currentStatus}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{report.report_type}</Badge>
                      </div>
                      {proj && (
                        <Link to={`/projects/${proj.id}?tab=reports`} className="text-xs text-primary hover:underline mt-0.5 block">
                          {proj.title} — {proj.funder_name}
                        </Link>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className={cn(report.currentStatus === 'overdue' && 'text-destructive font-medium')}>
                          Due: {format(new Date(report.due_date), 'MMM d, yyyy')}
                          {report.currentStatus !== 'submitted' && (
                            report.currentStatus === 'overdue'
                              ? ` — ${Math.abs(report.daysLeft)}d overdue`
                              : ` — ${report.daysLeft}d left`
                          )}
                        </span>
                        {report.submitted_date && (
                          <span className="text-accent">Submitted {format(new Date(report.submitted_date), 'MMM d')}</span>
                        )}
                      </div>
                    </div>
                    {report.file_url && (
                      <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}