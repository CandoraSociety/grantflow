import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ReportCalendar({ reports, projects }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const getReportsForDay = (day) => {
    return reports.filter(r => r.due_date && isSameDay(new Date(r.due_date), day));
  };

  const getProjectName = (projectId) => {
    const p = projects.find(p => p.id === projectId);
    return p?.title || 'Unknown';
  };

  const statusColors = {
    upcoming: 'bg-primary/10 text-primary border-primary/20',
    in_progress: 'bg-accent/10 text-accent border-accent/20',
    submitted: 'bg-accent/15 text-accent border-accent/30',
    overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-heading">
            <CalendarDays className="w-5 h-5 text-primary" />
            Report Due Dates
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="bg-card p-2 min-h-[60px]" />
          ))}
          {days.map((day) => {
            const dayReports = getReportsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`bg-card p-1.5 min-h-[60px] ${isToday(day) ? 'ring-2 ring-primary ring-inset' : ''}`}
              >
                <span className={`text-xs font-medium ${isToday(day) ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </span>
                {dayReports.slice(0, 2).map((r) => (
                  <Link key={r.id} to={`/projects/${r.project_id}?tab=reports`}>
                    <div className={`mt-0.5 px-1 py-0.5 rounded text-[10px] font-medium truncate border ${statusColors[r.status] || statusColors.upcoming}`}>
                      {r.title}
                    </div>
                  </Link>
                ))}
                {dayReports.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">+{dayReports.length - 2} more</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}