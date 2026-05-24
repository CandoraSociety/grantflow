import React from 'react';
import ProjectsList from './ProjectsList';

const IN_PROGRESS_STATUSES = ['research', 'drafting', 'review'];
const SUBMITTED_STATUSES = ['submitted'];

export default function ActiveProposalsList({ projects }) {
  const inProgress = projects.filter(p => IN_PROGRESS_STATUSES.includes(p.status));
  const submitted = projects.filter(p => SUBMITTED_STATUSES.includes(p.status));

  return (
    <div className="space-y-6">
      {inProgress.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">In Progress</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {inProgress.length}
            </span>
          </div>
          <ProjectsList projects={inProgress} />
        </div>
      )}

      {submitted.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Submitted — Awaiting Decision</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
              {submitted.length}
            </span>
          </div>
          <ProjectsList projects={submitted} />
        </div>
      )}

      {inProgress.length === 0 && submitted.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <p className="text-sm">No active proposals. Create your first proposal to get started.</p>
        </div>
      )}
    </div>
  );
}