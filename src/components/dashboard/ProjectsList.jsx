import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, Calendar, Tag, FolderOpen } from 'lucide-react';

const statusConfig = {
  research: { label: 'Research', class: 'bg-secondary text-secondary-foreground' },
  drafting: { label: 'Drafting', class: 'bg-primary/10 text-primary' },
  review: { label: 'Review', class: 'bg-accent/10 text-accent' },
  submitted: { label: 'Submitted', class: 'bg-accent/15 text-accent' },
  awarded: { label: 'Awarded', class: 'bg-accent/20 text-accent' },
  declined: { label: 'Declined', class: 'bg-destructive/10 text-destructive' },
  reporting: { label: 'Reporting', class: 'bg-primary/15 text-primary' },
};

export default function ProjectsList({ projects, limit, onOrganize }) {
  const displayed = limit ? projects.slice(0, limit) : projects;

  if (displayed.length === 0) {
    return (
      <Card className="p-8 text-center border-none shadow-sm">
        <p className="text-muted-foreground">No proposals yet. Create your first proposal to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayed.map((project) => {
        const sc = statusConfig[project.status] || statusConfig.research;
        return (
          <Card key={project.id} className="p-4 border-none shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between gap-4">
              <Link to={`/proposals/${project.id}`} className="flex-1 min-w-0">
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
                {(project.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {project.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-secondary rounded-full text-[10px] text-muted-foreground">
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-24 hidden sm:block">
                  <Progress value={project.progress_percentage || 0} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{project.progress_percentage || 0}%</p>
                </div>
                {onOrganize && (
                  <button
                    onClick={(e) => { e.preventDefault(); onOrganize(project); }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    title="Organize (groups & tags)"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                )}
                <Link to={`/proposals/${project.id}`}>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}