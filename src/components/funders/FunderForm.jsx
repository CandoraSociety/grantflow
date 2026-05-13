import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function FunderForm({ funder, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: funder?.name || '',
    type: funder?.type || '',
    category: funder?.category || '',
    website: funder?.website || '',
    contact_name: funder?.contact_name || '',
    contact_email: funder?.contact_email || '',
    contact_phone: funder?.contact_phone || '',
    typical_award_min: funder?.typical_award_min || '',
    typical_award_max: funder?.typical_award_max || '',
    application_cycle: funder?.application_cycle || '',
    next_deadline: funder?.next_deadline || '',
    pipeline_status: funder?.pipeline_status || 'prospect',
    fit_score: funder?.fit_score || '',
    relationship_score: funder?.relationship_score || '',
    eligibility_notes: funder?.eligibility_notes || '',
    notes: funder?.notes || '',
    source: funder?.source || '',
  });
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [focusAreas, setFocusAreas] = useState(funder?.focus_areas || []);

  const mutation = useMutation({
    mutationFn: (data) => funder
      ? base44.entities.PotentialFunder.update(funder.id, data)
      : base44.entities.PotentialFunder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funders'] });
      toast.success(funder ? 'Funder updated' : 'Funder added');
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      focus_areas: focusAreas,
      typical_award_min: form.typical_award_min ? Number(form.typical_award_min) : undefined,
      typical_award_max: form.typical_award_max ? Number(form.typical_award_max) : undefined,
      fit_score: form.fit_score ? Number(form.fit_score) : undefined,
      relationship_score: form.relationship_score ? Number(form.relationship_score) : undefined,
    });
  };

  const addFocusArea = () => {
    if (focusAreaInput.trim()) {
      setFocusAreas(prev => [...prev, focusAreaInput.trim()]);
      setFocusAreaInput('');
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-heading">{funder ? 'Edit Funder' : 'Add New Funder'}</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Funder Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {['federal', 'state', 'local', 'foundation', 'corporate', 'individual', 'other'].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {['grant', 'corporate_donation', 'major_gift', 'sponsorship', 'in_kind', 'other'].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Pipeline Status</Label>
              <Select value={form.pipeline_status} onValueChange={v => setForm({ ...form, pipeline_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['prospect', 'researching', 'relationship_building', 'ready_to_apply', 'applied', 'awarded', 'declined', 'not_a_fit'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Website</Label>
              <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </div>
            <div className="space-y-1">
              <Label>Next Deadline</Label>
              <Input type="date" value={form.next_deadline} onChange={e => setForm({ ...form, next_deadline: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Min Award ($)</Label>
              <Input type="number" value={form.typical_award_min} onChange={e => setForm({ ...form, typical_award_min: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Max Award ($)</Label>
              <Input type="number" value={form.typical_award_max} onChange={e => setForm({ ...form, typical_award_max: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Fit Score (1-5)</Label>
              <Select value={String(form.fit_score)} onValueChange={v => setForm({ ...form, fit_score: v })}>
                <SelectTrigger><SelectValue placeholder="Rate fit" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} — {['Poor','Fair','Good','Strong','Excellent'][n-1]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Relationship Score (1-5)</Label>
              <Select value={String(form.relationship_score)} onValueChange={v => setForm({ ...form, relationship_score: v })}>
                <SelectTrigger><SelectValue placeholder="Rate relationship" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} — {['None','Minimal','Some','Good','Strong'][n-1]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <Label>Focus Areas</Label>
            <div className="flex gap-2">
              <Input value={focusAreaInput} onChange={e => setFocusAreaInput(e.target.value)} placeholder="e.g., education, health..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFocusArea(); } }} />
              <Button type="button" variant="outline" size="icon" onClick={addFocusArea}><Plus className="w-4 h-4" /></Button>
            </div>
            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {focusAreas.map(a => (
                  <span key={a} className="text-xs px-2 py-1 rounded-full bg-secondary flex items-center gap-1">
                    {a}
                    <button type="button" onClick={() => setFocusAreas(prev => prev.filter(x => x !== a))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Eligibility Notes</Label>
            <Textarea value={form.eligibility_notes} onChange={e => setForm({ ...form, eligibility_notes: e.target.value })} rows={2} placeholder="Key eligibility requirements..." />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="General notes, strategy, context..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {funder ? 'Update' : 'Add Funder'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}