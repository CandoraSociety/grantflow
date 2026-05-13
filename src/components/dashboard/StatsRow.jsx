import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StatsRow({ projects, reports }) {
  const activeProjects = projects.filter(p => !['awarded', 'declined'].includes(p.status)).length;
  const submittedCount = projects.filter(p => p.status === 'submitted').length;
  const awardedCount = projects.filter(p => p.status === 'awarded').length;
  const overdueReports = reports.filter(r => r.status === 'overdue').length;

  const stats = [
    { label: 'Active Projects', value: activeProjects, icon: FileText, color: 'text-primary bg-primary/10' },
    { label: 'Submitted', value: submittedCount, icon: Clock, color: 'text-accent bg-accent/10' },
    { label: 'Awarded', value: awardedCount, icon: CheckCircle2, color: 'text-accent bg-accent/10' },
    { label: 'Overdue Reports', value: overdueReports, icon: AlertTriangle, color: 'text-destructive bg-destructive/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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