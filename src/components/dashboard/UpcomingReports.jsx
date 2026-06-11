import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Clock, AlertTriangle } from 'lucide-react';

export default function UpcomingReports({ reports, projects }) {
  const upcoming = reports
    .filter(r => r.status !== 'submitted')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  const getProjectName = (id) => projects.find(p => p.id === id)?.title || 'Unknown';

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Upcoming Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming reports</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((report) => {
              const daysLeft = differenceInDays(new Date(report.due_date), new Date());
              const isOverdue = daysLeft < 0;
              const isUrgent = daysLeft >= 0 && daysLeft <= 7;
              return (
                <Link key={report.id} to={`/proposals/${report.project_id}?tab=reports`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    {isOverdue ? (
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                    ) : (
                      <Clock className={`w-4 h-4 flex-shrink-0 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{report.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{getProjectName(report.project_id)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-medium ${isOverdue ? 'text-destructive' : isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(report.due_date), 'MMM d')}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}