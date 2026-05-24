import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

function getFiscalYearStart() {
  const now = new Date();
  // Fiscal year: April 1 – March 31
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 3, 1); // April 1
}

export default function StatsRow({ projects, reports }) {
  const activeProjects = projects.filter(p => !['awarded', 'declined', 'reporting'].includes(p.status)).length;
  const awardedCount = projects.filter(p => p.status === 'awarded').length;
  const overdueReports = reports.filter(r => r.status === 'overdue').length;

  // "Submitted" = any project that has ever been submitted (has a submission_deadline or status beyond research/drafting/review)
  const submittedAll = projects.filter(p => ['submitted', 'awarded', 'declined', 'reporting'].includes(p.status));

  const fiscalStart = getFiscalYearStart();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const submittedYTD = submittedAll.filter(p => {
    const date = p.submission_deadline ? new Date(p.submission_deadline) : p.updated_date ? new Date(p.updated_date) : null;
    return date && date >= fiscalStart;
  }).length;

  const submittedThisMonth = submittedAll.filter(p => {
    const date = p.submission_deadline ? new Date(p.submission_deadline) : p.updated_date ? new Date(p.updated_date) : null;
    return date && date >= monthStart;
  }).length;

  const fiscalYearLabel = (() => {
    const start = getFiscalYearStart();
    return `FY${String(start.getFullYear()).slice(2)}/${String(start.getFullYear() + 1).slice(2)}`;
  })();

  const stats = [
    { label: 'Active Proposals', value: activeProjects, icon: FileText, color: 'text-primary bg-primary/10' },
    { label: 'Awarded', value: awardedCount, icon: CheckCircle2, color: 'text-accent bg-accent/10' },
    { label: 'Overdue Reports', value: overdueReports, icon: AlertTriangle, color: 'text-destructive bg-destructive/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Submitted — expanded card */}
      <Card className="p-5 border-none shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</p>
          <div className="p-2.5 rounded-xl text-accent bg-accent/10">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <p className="text-3xl font-heading font-bold">{submittedAll.length}</p>
        <p className="text-xs text-muted-foreground mb-2">All time</p>
        <div className="border-t border-border pt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{fiscalYearLabel} (YTD)</span>
            <span className="font-semibold">{submittedYTD}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">This month</span>
            <span className="font-semibold">{submittedThisMonth}</span>
          </div>
        </div>
      </Card>

      {stats.map((stat) => (
        <Card key={stat.label} className="p-5 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-heading font-bold mt-1">{stat.value}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}