import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const PERIOD_LABELS = {
  annual: 'Annual',
  interim_q1: 'Q1 Interim',
  interim_q2: 'Q2 Interim',
  interim_q3: 'Q3 Interim',
  interim_midyear: 'Mid-Year',
  other: 'Other',
};

const STATUS_COLORS = {
  upcoming: 'bg-primary/10 text-primary',
  in_progress: 'bg-accent/10 text-accent',
  submitted: 'bg-green-100 text-green-700',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function ManageDeadlinesModal({ open, onClose, hub, deadlines = [] }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: '', due_date: '', report_period: 'annual', year: new Date().getFullYear().toString() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FunderReportingDeadline.create({ ...data, hub_id: hub.id, hub_name: hub.name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funder-deadlines'] });
      setAdding(false);
      setNewDeadline({ title: '', due_date: '', report_period: 'annual', year: new Date().getFullYear().toString() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FunderReportingDeadline.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funder-deadlines'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.FunderReportingDeadline.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funder-deadlines'] }),
  });

  const hubDeadlines = deadlines.filter(d => d.hub_id === hub?.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Deadlines — {hub?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {hubDeadlines.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground text-center py-4">No deadlines yet.</p>
          )}
          {hubDeadlines.map(d => (
            <div key={d.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{d.due_date ? format(new Date(d.due_date), 'MMM d, yyyy') : '—'}</span>
                  <span className="text-xs text-muted-foreground">· {PERIOD_LABELS[d.report_period] || d.report_period}</span>
                  {d.year && <span className="text-xs text-muted-foreground">· {d.year}</span>}
                </div>
              </div>
              <select
                value={d.status || 'upcoming'}
                onChange={e => updateStatusMutation.mutate({ id: d.id, status: e.target.value })}
                className={`text-xs rounded px-2 py-1 border-none font-medium cursor-pointer ${STATUS_COLORS[d.status || 'upcoming']}`}
              >
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="overdue">Overdue</option>
              </select>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => deleteMutation.mutate(d.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          {adding && (
            <div className="bg-muted/40 rounded-lg p-3 space-y-2 border border-border">
              <Input
                placeholder="Deadline title (e.g., Annual Report 2025)"
                value={newDeadline.title}
                onChange={e => setNewDeadline(p => ({ ...p, title: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <Input type="date" value={newDeadline.due_date} onChange={e => setNewDeadline(p => ({ ...p, due_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Period</Label>
                  <select
                    value={newDeadline.report_period}
                    onChange={e => setNewDeadline(p => ({ ...p, report_period: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {Object.entries(PERIOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <Input value={newDeadline.year} onChange={e => setNewDeadline(p => ({ ...p, year: e.target.value }))} placeholder="2025" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => createMutation.mutate(newDeadline)} disabled={!newDeadline.title || !newDeadline.due_date || createMutation.isPending}>
                  {createMutation.isPending ? 'Adding…' : 'Add Deadline'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {!adding && (
            <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Deadline
            </Button>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}