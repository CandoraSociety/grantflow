import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import FundingSourceForm from './FundingSourceForm';

const COLUMNS = [
  { key: 'prospect', label: 'Prospects', colorClass: 'border-t-slate-300' },
  { key: 'researching', label: 'Researching', colorClass: 'border-t-primary' },
  { key: 'relationship_building', label: 'Relationship', colorClass: 'border-t-purple-400' },
  { key: 'ready_to_apply', label: 'Ready to Apply', colorClass: 'border-t-accent' },
  { key: 'applied', label: 'Applied', colorClass: 'border-t-accent' },
  { key: 'awarded', label: 'Awarded', colorClass: 'border-t-green-500' },
];

const NEXT_STATUS = {
  prospect: 'researching',
  researching: 'relationship_building',
  relationship_building: 'ready_to_apply',
  ready_to_apply: 'applied',
  applied: 'awarded',
};

function ScoreDots({ score }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < score ? 'bg-primary' : 'bg-border'}`} />
      ))}
    </div>
  );
}

export default function FundingPipelineKanban({ sources }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.FundingSource.update(id, { pipeline_status: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fundingSources'] }),
  });

  return (
    <>
      {editing && <FundingSourceForm source={editing} onClose={() => setEditing(null)} />}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colSources = sources.filter(s => (s.pipeline_status || 'prospect') === col.key);
          return (
            <div key={col.key} className="flex-shrink-0 w-52">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</h3>
                <span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">{colSources.length}</span>
              </div>
              <div className="space-y-2">
                {colSources.map(source => (
                  <Card
                    key={source.id}
                    className={`border-none shadow-sm border-t-2 ${col.colorClass} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setEditing(source)}
                  >
                    <CardContent className="p-3 space-y-1">
                      <p className="text-xs font-semibold line-clamp-2">{source.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{source.source_type?.replace(/_/g, ' ')}</p>
                      {source.fit_score && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">Fit</span>
                          <ScoreDots score={source.fit_score} />
                        </div>
                      )}
                      {source.relationship_score && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">Rel.</span>
                          <ScoreDots score={source.relationship_score} />
                        </div>
                      )}
                      {NEXT_STATUS[col.key] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-6 text-[10px] mt-1 gap-1"
                          onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: source.id, status: NEXT_STATUS[col.key] }); }}
                        >
                          Move to {NEXT_STATUS[col.key].replace(/_/g, ' ')}
                          <ArrowRight className="w-2.5 h-2.5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {colSources.length === 0 && (
                  <div className="h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">Empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}