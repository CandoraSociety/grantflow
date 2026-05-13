import React from 'react';
import { format } from 'date-fns';
import { X, ArrowRight, FileText, CalendarCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const reportStatusLabels = {
  upcoming: { label: 'Upcoming', className: 'bg-primary/10 text-primary border-primary/20' },
  in_progress: { label: 'In Progress', className: 'bg-accent/10 text-accent border-accent/20' },
  submitted: { label: 'Submitted', className: 'bg-accent/15 text-accent border-accent/30' },
  overdue: { label: 'Overdue', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const projectStatusLabels = {
  research: 'Research',
  drafting: 'Drafting',
  review: 'Review',
  submitted: 'Submitted',
  awarded: 'Awarded',
  declined: 'Declined',
  reporting: 'Reporting',
};

export default function DeadlineDetailPopup({ deadline, onClose }) {
  const navigate = useNavigate();
  if (!deadline) return null;

  const isReport = deadline.type === 'report';
  const isProposal = deadline.type === 'proposal';
  const isMilestone = deadline.type === 'milestone';

  const milestoneTypeLabels = {
    site_visit: 'Site Visit',
    questions_deadline: 'Questions Deadline',
    grant_open_date: 'Grant Open Date',
    interview: 'Interview',
    review_meeting: 'Review Meeting',
    notice_of_award: 'Notice of Award',
    other: 'Other',
  };

  const handleNavigate = () => {
    navigate(`/projects/${deadline.project_id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-5 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isProposal ? 'bg-amber-100 text-amber-600' : isMilestone ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'}`}>
              {isProposal ? <CalendarCheck className="w-4 h-4" /> : isMilestone ? <MapPin className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isProposal ? 'Proposal Deadline' : isMilestone ? (milestoneTypeLabels[deadline.milestoneType] || 'Milestone') : 'Report Due'}
              </p>
              <h3 className="font-semibold text-sm leading-tight">{deadline.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{format(new Date(deadline.date), 'MMMM d, yyyy, h:mm a')}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium text-right max-w-[180px] truncate">{deadline.projectTitle}</span>
          </div>

          {isProposal && deadline.funderName && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Funder / Contractee</span>
              <span className="font-medium text-right max-w-[180px] truncate">{deadline.funderName}</span>
            </div>
          )}

          {isReport && deadline.status && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className={`text-xs ${(reportStatusLabels[deadline.status] || reportStatusLabels.upcoming).className}`}>
                {(reportStatusLabels[deadline.status] || reportStatusLabels.upcoming).label}
              </Badge>
            </div>
          )}

          {isProposal && deadline.projectStatus && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="text-xs">
                {projectStatusLabels[deadline.projectStatus] || deadline.projectStatus}
              </Badge>
            </div>
          )}

          {isReport && deadline.reportType && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Report Type</span>
              <span className="font-medium capitalize">{deadline.reportType.replace('_', ' ')}</span>
            </div>
          )}
          {isMilestone && deadline.milestoneType && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{milestoneTypeLabels[deadline.milestoneType] || deadline.milestoneType}</span>
            </div>
          )}

          {deadline.notes && (
            <div className="pt-1 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{deadline.notes}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <Button className="w-full gap-2" onClick={handleNavigate}>
          {isReport ? 'Go to Report' : 'Go to Project'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}