import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Globe, FileText, ExternalLink, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import FundingStreamForm from './FundingStreamForm';

const STATUS_COLORS = {
  active: 'bg-accent/20 text-accent',
  closed: 'bg-destructive/10 text-destructive',
  upcoming: 'bg-chart-3/20 text-foreground',
  unknown: 'bg-secondary text-muted-foreground',
};

const CYCLE_LABELS = {
  rolling: 'Rolling',
  annual: 'Annual',
  biannual: 'Bi-annual',
  quarterly: 'Quarterly',
  unknown: 'Unknown cycle',
};

export default function FundingStreamCard({ stream, defaultExpanded = false }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(stream.internal_notes || '');
  const [showEditForm, setShowEditForm] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.FundingStream.update(stream.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fundingStreams'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.FundingStream.delete(stream.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fundingStreams'] }),
  });

  const handleSaveNotes = () => {
    updateMutation.mutate({ internal_notes: notesValue });
    setEditingNotes(false);
  };

  const amountDisplay = stream.award_notes
    ? stream.award_notes
    : stream.award_max
      ? `$${(stream.award_min || 0).toLocaleString()} – $${stream.award_max.toLocaleString()}`
      : stream.award_min
        ? `From $${stream.award_min.toLocaleString()}`
        : null;

  return (
    <>
      {showEditForm && (
        <FundingStreamForm
          stream={stream}
          sourceId={stream.source_id}
          onClose={() => setShowEditForm(false)}
        />
      )}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {/* Header row */}
        <button
          type="button"
          className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{stream.name}</span>
              {stream.status && stream.status !== 'unknown' && (
                <Badge variant="secondary" className={cn('text-xs', STATUS_COLORS[stream.status])}>
                  {stream.status}
                </Badge>
              )}
              {stream.fit_score >= 4 && (
                <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">Strong Fit</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-muted-foreground">
              {amountDisplay && <span className="font-medium text-foreground">{amountDisplay}</span>}
              {stream.submission_deadline && (
                <span className="text-destructive font-medium">Deadline: {stream.submission_deadline}</span>
              )}
              {stream.application_cycle && stream.application_cycle !== 'unknown' && (
                <span>{CYCLE_LABELS[stream.application_cycle]}</span>
              )}
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              {stream.purpose && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Purpose / Description</p>
                  <p className="text-sm">{stream.purpose}</p>
                </div>
              )}
              {stream.eligibility && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Eligibility</p>
                  <p className="text-sm">{stream.eligibility}</p>
                </div>
              )}
              {stream.open_for_submissions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Opens</p>
                  <p className="text-sm">{stream.open_for_submissions}</p>
                </div>
              )}
              {stream.focus_areas?.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Focus Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {stream.focus_areas.map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              {stream.application_url && (
                <a href={stream.application_url} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Globe className="w-3 h-3" /> Apply
                  </Button>
                </a>
              )}
              {stream.guidelines_url && (
                <a href={stream.guidelines_url} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <FileText className="w-3 h-3" /> Guidelines
                  </Button>
                </a>
              )}
              {stream.linked_project_id && (
                <Link to={`/projects/${stream.linked_project_id}`}>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <ExternalLink className="w-3 h-3" /> View Project
                  </Button>
                </Link>
              )}
            </div>

            {/* Internal notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">Internal Notes</p>
                {!editingNotes && (
                  <button type="button" onClick={() => setEditingNotes(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    placeholder="Which programs or projects could this fund? Any strategic notes..."
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleSaveNotes} className="h-7 text-xs gap-1">
                      <Check className="w-3 h-3" /> Save
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => { setEditingNotes(false); setNotesValue(stream.internal_notes || ''); }} className="h-7 text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {stream.internal_notes || 'No notes yet. Click Edit to add notes about which programs this could fund.'}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowEditForm(true)}>
                <Pencil className="w-3 h-3" /> Edit Stream
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive gap-1" onClick={() => deleteMutation.mutate()}>
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}