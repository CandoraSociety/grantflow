import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';

export default function FundingStreamForm({ stream, sourceId, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    source_id: sourceId || stream?.source_id || '',
    name: stream?.name || '',
    purpose: stream?.purpose || '',
    award_notes: stream?.award_notes || '',
    award_min: stream?.award_min || '',
    award_max: stream?.award_max || '',
    submission_deadline: stream?.submission_deadline || '',
    open_for_submissions: stream?.open_for_submissions || '',
    application_cycle: stream?.application_cycle || 'unknown',
    eligibility: stream?.eligibility || '',
    focus_areas_text: (stream?.focus_areas || []).join(', '),
    application_url: stream?.application_url || '',
    guidelines_url: stream?.guidelines_url || '',
    status: stream?.status || 'unknown',
    internal_notes: stream?.internal_notes || '',
    fit_score: stream?.fit_score || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => stream
      ? base44.entities.FundingStream.update(stream.id, data)
      : base44.entities.FundingStream.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundingStreams'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const focus_areas = form.focus_areas_text
      ? form.focus_areas_text.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    mutation.mutate({
      source_id: form.source_id,
      name: form.name,
      purpose: form.purpose || undefined,
      award_notes: form.award_notes || undefined,
      award_min: form.award_min ? Number(form.award_min) : undefined,
      award_max: form.award_max ? Number(form.award_max) : undefined,
      submission_deadline: form.submission_deadline || undefined,
      open_for_submissions: form.open_for_submissions || undefined,
      application_cycle: form.application_cycle,
      eligibility: form.eligibility || undefined,
      focus_areas,
      application_url: form.application_url || undefined,
      guidelines_url: form.guidelines_url || undefined,
      status: form.status,
      internal_notes: form.internal_notes || undefined,
      fit_score: form.fit_score ? Number(form.fit_score) : undefined,
    });
  };

  const f = (field) => ({ value: form[field], onChange: (e) => setForm({ ...form, [field]: e.target.value }) });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stream ? 'Edit' : 'Add'} Funding Stream</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Stream Name *</Label>
            <Input {...f('name')} placeholder="e.g., Community Initiatives Program" required />
          </div>
          <div className="space-y-2">
            <Label>Purpose / Description</Label>
            <Textarea {...f('purpose')} placeholder="What does this fund? Who is it for?" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Application Cycle</Label>
              <Select value={form.application_cycle} onValueChange={v => setForm({ ...form, application_cycle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rolling">Rolling</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="biannual">Bi-annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Opens For Submissions</Label>
              <Input {...f('open_for_submissions')} placeholder="e.g., Sept 1, or Rolling" />
            </div>
            <div className="space-y-2">
              <Label>Submission Deadline</Label>
              <Input {...f('submission_deadline')} placeholder="e.g., March 31 annually" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Award Amount (text)</Label>
            <Input {...f('award_notes')} placeholder="e.g., Up to $50,000 per year" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Min Award ($)</Label>
              <Input type="number" {...f('award_min')} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Max Award ($)</Label>
              <Input type="number" {...f('award_max')} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Eligibility</Label>
            <Textarea {...f('eligibility')} placeholder="Who can apply? Geographic restrictions?" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Focus Areas (comma-separated)</Label>
            <Input {...f('focus_areas_text')} placeholder="e.g., employment, youth, housing" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Application URL</Label>
              <Input {...f('application_url')} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Guidelines URL</Label>
              <Input {...f('guidelines_url')} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fit Score (1–5)</Label>
            <Select value={String(form.fit_score)} onValueChange={v => setForm({ ...form, fit_score: v })}>
              <SelectTrigger><SelectValue placeholder="Rate fit..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Poor fit</SelectItem>
                <SelectItem value="2">2 — Weak fit</SelectItem>
                <SelectItem value="3">3 — Moderate fit</SelectItem>
                <SelectItem value="4">4 — Good fit</SelectItem>
                <SelectItem value="5">5 — Excellent fit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea {...f('internal_notes')} placeholder="Which programs or projects could this fund? Strategic notes..." rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {stream ? 'Save Changes' : 'Add Stream'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}