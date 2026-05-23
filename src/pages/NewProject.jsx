import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, CalendarDays, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import SetReminderPopover from '@/components/project/SetReminderPopover';

const PROJECT_TYPES = [
  { value: 'grant',        label: 'Grant Application',       orgLabel: 'Funding Organization',  orgPlaceholder: 'e.g., National Science Foundation',  amountLabel: 'Requested Amount ($)' },
  { value: 'contract',     label: 'Contract Proposal',        orgLabel: 'Contracting Entity',     orgPlaceholder: 'e.g., City of Springfield',           amountLabel: 'Contract Value ($)' },
  { value: 'lease',        label: 'Lease / Rights Agreement', orgLabel: 'Lessor / Issuing Party',  orgPlaceholder: 'e.g., University Food Services',      amountLabel: 'Annual Lease Value ($)' },
  { value: 'donation',     label: 'Corporate / Major Donor',  orgLabel: 'Donor / Company Name',   orgPlaceholder: 'e.g., Acme Corp Foundation',          amountLabel: 'Gift Amount ($)' },
  { value: 'rfp',          label: 'RFP / Bid Response',       orgLabel: 'Issuing Organization',   orgPlaceholder: 'e.g., State Department of Health',    amountLabel: 'Bid Value ($)' },
  { value: 'permit',       label: 'Permit / License',         orgLabel: 'Issuing Authority',      orgPlaceholder: 'e.g., County Planning Dept',          amountLabel: 'Fee / Bond Amount ($)' },
  { value: 'other',        label: 'Other Submission',         orgLabel: 'Organization / Recipient', orgPlaceholder: 'Name of receiving organization',    amountLabel: 'Value ($)' },
];

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    project_type: 'grant',
    funder_name: '',
    funder_type: '',
    description: '',
    submission_deadline: '',
    open_for_submissions: '',
    award_amount: '',
  });
  const [openDateMode, setOpenDateMode] = useState('text'); // 'date' or 'text'
  const [amountMode, setAmountMode] = useState('number'); // 'number' or 'text'

  const typeConfig = PROJECT_TYPES.find(t => t.value === form.project_type) || PROJECT_TYPES[0];
  const isGrantOrDonation = ['grant', 'donation'].includes(form.project_type);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${created.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      award_amount: (amountMode === 'number' && form.award_amount) ? Number(form.award_amount) : (form.award_amount || undefined),
      open_for_submissions: form.open_for_submissions || undefined,
      status: 'research',
      progress_percentage: 0,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Proposals
      </Link>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Create New Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Project Type Selector */}
            <div className="space-y-2">
              <Label>Proposal Type *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROJECT_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, project_type: t.value })}
                    className={cn(
                      'text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
                      form.project_type === t.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-primary/40 text-foreground'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Title */}
            <div className="space-y-2">
              <Label>Proposal Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={`e.g., ${typeConfig.orgPlaceholder.split('e.g., ')[1] || 'Proposal title'}...`}
                required
              />
            </div>

            {/* Organization fields — label changes by type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{typeConfig.orgLabel} *</Label>
                <Input
                  value={form.funder_name}
                  onChange={(e) => setForm({ ...form, funder_name: e.target.value })}
                  placeholder={typeConfig.orgPlaceholder}
                  required
                />
              </div>

              {/* Org type — only show for grant/donation/contract */}
              {isGrantOrDonation && (
                <div className="space-y-2">
                  <Label>Organization Type</Label>
                  <Select value={form.funder_type} onValueChange={(v) => setForm({ ...form, funder_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="federal">Federal</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="local">Local Government</SelectItem>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Open for Submissions</Label>
                <div className="flex gap-1 mb-1">
                  <button
                    type="button"
                    onClick={() => { setOpenDateMode('text'); setForm({ ...form, open_for_submissions: '' }); }}
                    className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all', openDateMode === 'text' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
                  >
                    <Type className="w-3 h-3" /> Text
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpenDateMode('date'); setForm({ ...form, open_for_submissions: '' }); }}
                    className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all', openDateMode === 'date' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
                  >
                    <CalendarDays className="w-3 h-3" /> Date
                  </button>
                </div>
                {openDateMode === 'text' ? (
                  <Input
                    value={form.open_for_submissions}
                    onChange={(e) => setForm({ ...form, open_for_submissions: e.target.value })}
                    placeholder="e.g., Fall 2026, Q1 2027..."
                  />
                ) : (
                  <Input
                    type="date"
                    value={form.open_for_submissions}
                    onChange={(e) => setForm({ ...form, open_for_submissions: e.target.value })}
                  />
                )}
                <SetReminderPopover
                  reminderType="open_for_submissions"
                  projectTitle={form.title}
                  funderName={form.funder_name}
                />
              </div>
              <div className="space-y-2">
                <Label>Submission Deadline</Label>
                <Input
                  type="datetime-local"
                  value={form.submission_deadline}
                  onChange={(e) => setForm({ ...form, submission_deadline: e.target.value })}
                />
                <SetReminderPopover
                  reminderType="submission_deadline"
                  projectTitle={form.title}
                  funderName={form.funder_name}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{typeConfig.amountLabel}</Label>
                <div className="flex gap-1 mb-1">
                  <button
                    type="button"
                    onClick={() => { setAmountMode('number'); setForm({ ...form, award_amount: '' }); }}
                    className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all', amountMode === 'number' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
                  >
                    # Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAmountMode('text'); setForm({ ...form, award_amount: '' }); }}
                    className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all', amountMode === 'text' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
                  >
                    <Type className="w-3 h-3" /> Text
                  </button>
                </div>
                {amountMode === 'number' ? (
                  <Input
                    type="number"
                    value={form.award_amount}
                    onChange={(e) => setForm({ ...form, award_amount: e.target.value })}
                    placeholder="0.00"
                  />
                ) : (
                  <Input
                    value={form.award_amount}
                    onChange={(e) => setForm({ ...form, award_amount: e.target.value })}
                    placeholder="e.g., $50K–$100K, Up to $250,000..."
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the proposal..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Proposal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}