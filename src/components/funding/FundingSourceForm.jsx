import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function FundingSourceForm({ source, onClose }) {
  const queryClient = useQueryClient();

  const { data: allSources = [] } = useQuery({
    queryKey: ['fundingSources'],
    queryFn: () => base44.entities.FundingSource.list('name'),
  });

  const [form, setForm] = useState({
    name: source?.name || '',
    source_type: source?.source_type || 'foundation',
    government_level: source?.government_level || 'none',
    parent_id: source?.parent_id || '',
    website: source?.website || '',
    description: source?.description || '',
    notes: source?.notes || '',
    contact_name: source?.contact_name || '',
    contact_email: source?.contact_email || '',
    contact_phone: source?.contact_phone || '',
    pipeline_status: source?.pipeline_status || 'prospect',
    fit_score: source?.fit_score || '',
    relationship_score: source?.relationship_score || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => source
      ? base44.entities.FundingSource.update(source.id, data)
      : base44.entities.FundingSource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundingSources'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      source_type: form.source_type,
      government_level: form.government_level,
      parent_id: form.parent_id || undefined,
      website: form.website || undefined,
      description: form.description || undefined,
      notes: form.notes || undefined,
      contact_name: form.contact_name || undefined,
      contact_email: form.contact_email || undefined,
      contact_phone: form.contact_phone || undefined,
      pipeline_status: form.pipeline_status || 'prospect',
      fit_score: form.fit_score ? Number(form.fit_score) : undefined,
      relationship_score: form.relationship_score ? Number(form.relationship_score) : undefined,
    });
  };

  const f = (field) => ({ value: form[field], onChange: (e) => setForm({ ...form, [field]: e.target.value }) });

  const parentOptions = allSources.filter(s => s.id !== source?.id);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{source ? 'Edit' : 'Add'} Funding Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input {...f('name')} placeholder="e.g., Government of Alberta, Calgary Foundation" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={form.source_type} onValueChange={v => setForm({ ...form, source_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="government_body">Government Body</SelectItem>
                  <SelectItem value="ministry">Ministry / Department</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Government Level</Label>
              <Select value={form.government_level} onValueChange={v => setForm({ ...form, government_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="federal">Federal</SelectItem>
                  <SelectItem value="provincial">Provincial</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="none">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pipeline fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-3 sm:col-span-1">
              <Label>Pipeline Status</Label>
              <Select value={form.pipeline_status} onValueChange={v => setForm({ ...form, pipeline_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['prospect','researching','relationship_building','ready_to_apply','applied','awarded','declined','not_a_fit'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fit Score (1–5)</Label>
              <Select value={String(form.fit_score)} onValueChange={v => setForm({ ...form, fit_score: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Relationship (1–5)</Label>
              <Select value={String(form.relationship_score)} onValueChange={v => setForm({ ...form, relationship_score: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {parentOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Parent Source (optional)</Label>
              <Select value={form.parent_id || 'none'} onValueChange={v => setForm({ ...form, parent_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {parentOptions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Website</Label>
            <Input {...f('website')} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...f('description')} placeholder="Brief overview..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...f('notes')} placeholder="Internal notes..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Contact Name</Label>
            <Input {...f('contact_name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input {...f('contact_email')} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input {...f('contact_phone')} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {source ? 'Save Changes' : 'Add Source'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}