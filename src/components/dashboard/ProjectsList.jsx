import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, Calendar } from 'lucide-react';

const statusConfig = {
  research: { label: 'Research', class: 'bg-secondary text-secondary-foreground' },
  drafting: { label: 'Drafting', class: 'bg-primary/10 text-primary' },
  review: { label: 'Review', class: 'bg-accent/10 text-accent' },
  submitted: { label: 'Submitted', class: 'bg-accent/15 text-accent' },
  awarded: { label: 'Awarded', class: 'bg-accent/20 text-accent' },
  declined: { label: 'Declined', class: 'bg-destructive/10 text-destructive' },
  reporting: { label: 'Reporting', class: 'bg-primary/15 text-primary' },
};

export default function ProjectsList({ projects, limit }) {
  const displayed = limit ? projects.slice(0, limit) : projects;

  if (displayed.length === 0) {
    return (
      <Card className="p-8 text-center border-none shadow-sm">
        <p className="text-muted-foreground">No projects yet. Create your first project to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayed.map((project) => {
        const sc = statusConfig[project.status] || statusConfig.research;
        return (
          <Link key={project.id} to={`/projects/${project.id}`}>
            <Card className="p-4 border-none shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-semibold text-sm truncate">{project.title}</h3>
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${sc.class}`}>
                      {sc.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.funder_name}</p>
                  {project.submission_deadline && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Due {format(new Date(project.submission_deadline), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 hidden sm:block">
                    <Progress value={project.progress_percentage || 0} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">{project.progress_percentage || 0}%</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}