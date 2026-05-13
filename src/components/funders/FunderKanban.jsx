import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { key: 'prospect', label: 'Prospects', color: 'border-t-secondary' },
  { key: 'researching', label: 'Researching', color: 'border-t-primary/40' },
  { key: 'relationship_building', label: 'Relationship', color: 'border-t-chart-4' },
  { key: 'ready_to_apply', label: 'Ready to Apply', color: 'border-t-accent' },
  { key: 'applied', label: 'Applied', color: 'border-t-accent' },
  { key: 'awarded', label: 'Awarded', color: 'border-t-accent' },
];

const NEXT_STATUS = {
  prospect: 'researching',
  researching: 'relationship_building',
  relationship_building: 'ready_to_apply',
  ready_to_apply: 'applied',
  applied: 'awarded',
};

export default function FunderKanban({ funders, onEdit }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PotentialFunder.update(id, { pipeline_status: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funders'] }),
  });

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const colFunders = funders.filter(f => f.pipeline_status === col.key);
        return (
          <div key={col.key} className="flex-shrink-0 w-52">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">{colFunders.length}</span>
            </div>
            <div className="space-y-2">
              {colFunders.map(funder => (
                <Card
                  key={funder.id}
                  className={`border-none shadow-sm border-t-2 ${col.color} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => onEdit(funder)}
                >
                  <CardContent className="p-3">
                    <p className="text-xs font-semibold line-clamp-2">{funder.name}</p>
                    {funder.typical_award_max && (
                      <p className="text-[10px] text-accent font-medium mt-1">
                        Up to ${funder.typical_award_max.toLocaleString()}
                      </p>
                    )}
                    {funder.next_deadline && (
                      <p className="text-[10px] text-destructive mt-0.5">
                        Due {format(new Date(funder.next_deadline), 'MMM d')}
                      </p>
                    )}
                    {funder.focus_areas?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{funder.focus_areas.slice(0, 2).join(', ')}</p>
                    )}
                    {NEXT_STATUS[funder.pipeline_status] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-6 text-[10px] mt-2 gap-1"
                        onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: funder.id, status: NEXT_STATUS[funder.pipeline_status] }); }}
                      >
                        Move to {NEXT_STATUS[funder.pipeline_status].replace(/_/g, ' ')}
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {colFunders.length === 0 && (
                <div className="h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}