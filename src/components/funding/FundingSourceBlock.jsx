import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Globe } from 'lucide-react';
import FundingStreamCard from './FundingStreamCard';
import FundingStreamForm from './FundingStreamForm';
import FundingSourceForm from './FundingSourceForm';

const GOV_LEVEL_COLORS = {
  federal: 'bg-primary/10 text-primary',
  provincial: 'bg-chart-4/20 text-chart-4',
  municipal: 'bg-chart-2/20 text-chart-2',
  none: 'bg-secondary text-muted-foreground',
};

const SOURCE_TYPE_LABELS = {
  government_body: 'Government',
  ministry: 'Ministry / Department',
  foundation: 'Foundation',
  corporate: 'Corporate',
  other: 'Other',
};

export default function FundingSourceBlock({ source, streams = [], children = [], depth = 0 }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(depth === 0);
  const [showAddStream, setShowAddStream] = useState(false);
  const [showEditSource, setShowEditSource] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.FundingSource.delete(source.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fundingSources'] }),
  });

  const hasContent = streams.length > 0 || children.length > 0;
  const indent = depth * 16;

  return (
    <>
      {showAddStream && <FundingStreamForm sourceId={source.id} onClose={() => setShowAddStream(false)} />}
      {showEditSource && <FundingSourceForm source={source} onClose={() => setShowEditSource(false)} />}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Source header */}
        <div
          className={cn(
            'flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors',
            depth > 0 && 'pl-5 bg-muted/20'
          )}
          style={{ paddingLeft: `${12 + indent}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex-shrink-0 text-muted-foreground">
            {hasContent
              ? expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              : <span className="w-4 h-4 block" />}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('font-semibold', depth === 0 ? 'text-base font-heading' : 'text-sm')}>{source.name}</span>
              {source.government_level && source.government_level !== 'none' && (
                <Badge variant="secondary" className={cn('text-xs', GOV_LEVEL_COLORS[source.government_level])}>
                  {source.government_level}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs bg-secondary text-muted-foreground">
                {SOURCE_TYPE_LABELS[source.source_type] || source.source_type}
              </Badge>
              {streams.length > 0 && (
                <span className="text-xs text-muted-foreground">{streams.length} stream{streams.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {source.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{source.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {source.website && (
              <a href={source.website} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                  <Globe className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAddStream(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowEditSource(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate()}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-border" style={{ paddingLeft: `${8 + indent}px`, paddingRight: '8px', paddingBottom: '8px', paddingTop: '8px' }}>
            <div className="space-y-2">
              {/* Child sources (sub-ministries etc) */}
              {children.map(child => (
                <FundingSourceBlock
                  key={child.source.id}
                  source={child.source}
                  streams={child.streams}
                  children={child.children}
                  depth={depth + 1}
                />
              ))}

              {/* Streams for this source */}
              {streams.map(stream => (
                <FundingStreamCard key={stream.id} stream={stream} />
              ))}

              {streams.length === 0 && children.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1">No streams yet.</p>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-primary hover:text-primary"
                onClick={() => setShowAddStream(true)}
              >
                <Plus className="w-3 h-3" /> Add Funding Stream
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}