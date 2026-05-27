import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

export default function AddHubModal({ open, onClose, hubType, existingHub = null }) {
  const qc = useQueryClient();
  const isEdit = !!existingHub;

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [deadlines, setDeadlines] = useState([{ title: '', due_date: '', report_period: 'annual', year: new Date().getFullYear().toString() }]);

  useEffect(() => {
    if (existingHub) {
      setName(existingHub.name || '');
      setNotes(existingHub.notes || '');
      setContactName(existingHub.contact_name || '');
      setContactEmail(existingHub.contact_email || '');
      setDeadlines([{ title: '', due_date: '', report_period: 'annual', year: new Date().getFullYear().toString() }]);
    } else {
      setName('');
      setNotes('');
      setContactName('');
      setContactEmail('');
      setDeadlines([{ title: '', due_date: '', report_period: 'annual', year: new Date().getFullYear().toString() }]);
    }
  }, [existingHub, open]);

  const hubMutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) return base44.entities.FunderReportingHub.update(existingHub.id, data);
      return base44.entities.FunderReportingHub.create(data);
    },
    onSuccess: async (hub) => {
      const hubId = hub?.id || existingHub?.id;
      const hubName = name;
      // Create any deadlines with a due_date set
      const toCreate = deadlines.filter(d => d.title && d.due_date);
      if (toCreate.length > 0) {
        await Promise.all(toCreate.map(d =>
          base44.entities.FunderReportingDeadline.create({ ...d, hub_id: hubId, hub_name: hubName })
        ));
      }
      qc.invalidateQueries({ queryKey: ['funder-hubs'] });
      qc.invalidateQueries({ queryKey: ['funder-deadlines'] });
      onClose();
    },
  });

  const updateDeadline = (i, field, val) => {
    setDeadlines(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    hubMutation.mutate({ name: name.trim(), hub_type: hubType, notes, contact_name: contactName, contact_email: contactEmail });
  };

  const periodLabels = {
    annual: 'Annual',
    interim_q1: 'Interim Q1',
    interim_q2: 'Interim Q2',
    interim_q3: 'Interim Q3',
    interim_midyear: 'Mid-Year Interim',
    other: 'Other',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} {hubType === 'core_funder' ? 'Core Funder' : 'Grant'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={hubType === 'core_funder' ? 'e.g., FCSS' : 'e.g., TELUS Community Grant 2025'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Report Deadlines</Label>
              <Button variant="ghost" size="sm" onClick={() => setDeadlines(p => [...p, { title: '', due_date: '', report_period: 'annual', year: new Date().getFullYear().toString() }])}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-3">
              {deadlines.map((d, i) => (
                <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Annual Report 2025"
                      value={d.title}
                      onChange={e => updateDeadline(i, 'title', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeadlines(p => p.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Due Date</Label>
                      <Input type="date" value={d.due_date} onChange={e => updateDeadline(i, 'due_date', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Period</Label>
                      <select
                        value={d.report_period}
                        onChange={e => updateDeadline(i, 'report_period', e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      >
                        {Object.entries(periodLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Year</Label>
                      <Input value={d.year} onChange={e => updateDeadline(i, 'year', e.target.value)} placeholder="2025" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={hubMutation.isPending || !name.trim()}>
              {hubMutation.isPending ? 'Saving…' : (isEdit ? 'Save Changes' : `Add ${hubType === 'core_funder' ? 'Core Funder' : 'Grant'}`)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}