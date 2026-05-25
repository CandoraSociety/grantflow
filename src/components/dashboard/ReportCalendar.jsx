import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import DeadlineDetailPopup from './DeadlineDetailPopup';

// Build a unified list of deadlines from reports, projects, and milestones
function buildDeadlines(reports, projects, milestones = []) {
  const deadlines = [];

  reports.forEach(r => {
    if (!r.due_date) return;
    const project = projects.find(p => p.id === r.project_id);
    deadlines.push({
      id: `report-${r.id}`,
      type: 'report',
      date: r.due_date,
      title: r.title,
      project_id: r.project_id,
      projectTitle: project?.title || 'Unknown Project',
      funderName: project?.funder_name,
      status: r.status,
      reportType: r.report_type,
      notes: r.notes,
    });
  });

  projects.forEach(p => {
    if (!p.submission_deadline) return;
    deadlines.push({
      id: `proposal-${p.id}`,
      type: 'proposal',
      date: p.submission_deadline,
      title: p.title,
      project_id: p.id,
      projectTitle: p.title,
      funderName: p.funder_name,
      projectStatus: p.status,
      notes: p.description,
    });
  });

  projects.forEach(p => {
    if (!p.expected_notification_date) return;
    // Only include if it looks like a parseable date (not free text like "Fall 2026")
    const d = new Date(p.expected_notification_date);
    if (isNaN(d.getTime())) return;
    deadlines.push({
      id: `notification-${p.id}`,
      type: 'notification',
      date: p.expected_notification_date,
      title: p.title,
      project_id: p.id,
      projectTitle: p.title,
      funderName: p.funder_name,
      projectStatus: p.status,
      notes: p.expected_notification_notes || p.description,
    });
  });

  milestones.forEach(m => {
    if (!m.date) return;
    const project = projects.find(p => p.id === m.project_id);
    deadlines.push({
      id: `milestone-${m.id}`,
      type: 'milestone',
      date: m.date,
      title: m.title,
      project_id: m.project_id,
      projectTitle: project?.title || 'Unknown Project',
      funderName: project?.funder_name,
      milestoneType: m.milestone_type,
      notes: m.notes,
    });
  });

  return deadlines;
}

const DEADLINE_STYLES = {
  report: 'bg-primary/10 text-primary border-primary/20',
  proposal: 'bg-amber-100 text-amber-700 border-amber-200',
  milestone: 'bg-purple-100 text-purple-700 border-purple-200',
  notification: 'bg-teal-100 text-teal-700 border-teal-200',
};

export default function ReportCalendar({ reports, projects, milestones = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDeadline, setSelectedDeadline] = useState(null);

  const deadlines = buildDeadlines(reports, projects, milestones);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const paddingDays = Array(monthStart.getDay()).fill(null);

  const getDeadlinesForDay = (day) =>
    deadlines.filter(d => d.date && isSameDay(new Date(d.date), day));

  return (
    <>
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2 text-base font-heading">
                <CalendarDays className="w-5 h-5 text-primary" />
                Important Dates & Deadlines
              </CardTitle>
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/30" />
                  Report
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" />
                  Proposal
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-purple-100 border border-purple-300" />
                  Milestone
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-100 border border-teal-300" />
                  Notification
                </span>
              </div>
            </div>
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
              const dayDeadlines = getDeadlinesForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-card p-1.5 min-h-[60px] ${isToday(day) ? 'ring-2 ring-primary ring-inset' : ''}`}
                >
                  <span className={`text-xs font-medium ${isToday(day) ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayDeadlines.slice(0, 2).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDeadline(d)}
                      className={`w-full mt-0.5 px-1 py-0.5 rounded text-[10px] font-medium truncate border text-left hover:opacity-80 transition-opacity cursor-pointer ${DEADLINE_STYLES[d.type]}`}
                    >
                      {d.title}
                    </button>
                  ))}
                  {dayDeadlines.length > 2 && (
                    <button
                      onClick={() => setSelectedDeadline(dayDeadlines[2])}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      +{dayDeadlines.length - 2} more
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDeadline && (
        <DeadlineDetailPopup
          deadline={selectedDeadline}
          onClose={() => setSelectedDeadline(null)}
        />
      )}
    </>
  );
}