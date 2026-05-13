import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';

const STAGES = [
  { key: 'research', label: 'Research' },
  { key: 'drafting', label: 'Drafting' },
  { key: 'review', label: 'Review' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'awarded', label: 'Awarded' },
];

const STATUS_ORDER = ['research', 'drafting', 'review', 'submitted', 'awarded', 'declined', 'reporting'];

export default function ProjectProgress({ project }) {
  const currentIdx = STATUS_ORDER.indexOf(project.status);
  const progress = project.progress_percentage || 0;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Project Progress</span>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 mb-4" />
        <div className="flex items-center justify-between">
           {STAGES.map((stage, i) => {
             const stageIdx = STATUS_ORDER.indexOf(stage.key);
             const isDone = currentIdx > stageIdx || stage.key === project.status;
             const isCurrent = stage.key === project.status;
            return (
              <div key={stage.key} className="flex flex-col items-center gap-1">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                ) : (
                  <Circle className={`w-4 h-4 ${isCurrent ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />
                )}
                <span className={`text-[10px] font-medium ${isCurrent ? 'text-primary' : isDone ? 'text-accent' : 'text-muted-foreground'}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}