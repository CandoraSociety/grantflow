import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, Loader2, CheckCircle2, Clock, AlertTriangle, ExternalLink, Bell } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  upcoming: 'bg-primary/10 text-primary',
  in_progress: 'bg-accent/10 text-accent',
  submitted: 'bg-accent/20 text-accent',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function ReportsTab({ projectId, project, reports }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', report_type: 'interim', due_date: '', notes: '' });
  const [uploadingId, setUploadingId] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Report.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', projectId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setForm({ title: '', report_type: 'interim', due_date: '', notes: '' });
      setShowForm(false);
      toast.success('Report added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Report.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', projectId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Report.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', projectId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const handleUploadReport = async (e, reportId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingId(reportId);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateMutation.mutateAsync({ id: reportId, data: { file_url, status: 'submitted', submitted_date: new Date().toISOString().split('T')[0] } });
    setUploadingId(null);
    toast.success('Report submitted');
    e.target.value = '';
  };

  const handleSendReminder = async (report) => {
    await base44.integrations.Core.SendEmail({
      to: 'me',
      subject: `Report Reminder: ${report.title} due ${format(new Date(report.due_date), 'MMM d, yyyy')}`,
      body: `This is a reminder that your report "${report.title}" for the project "${project.title}" (Funder: ${project.funder_name}) is due on ${format(new Date(report.due_date), 'MMMM d, yyyy')}.\n\nPlease ensure it is submitted on time.`,
    });
    await updateMutation.mutateAsync({ id: report.id, data: { reminder_sent: true } });
    toast.success('Reminder sent!');
  };

  const sorted = [...reports].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Report
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/20 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Report Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Q1 Interim Report" />
              </div>
              <div className="space-y-1">
                <Label>Report Type</Label>
                <Select value={form.report_type} onValueChange={v => setForm({ ...form, report_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interim">Interim</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="narrative">Narrative</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Due Date *</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this report..." rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({ ...form, project_id: projectId, status: 'upcoming' })} disabled={!form.title || !form.due_date || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No reports added yet</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(report => {
          const daysLeft = differenceInDays(new Date(report.due_date), new Date());
          const isOverdue = daysLeft < 0 && report.status !== 'submitted';
          const currentStatus = isOverdue && report.status !== 'submitted' ? 'overdue' : report.status;

          return (
            <Card key={report.id} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-sm">{report.title}</h4>
                      <Badge variant="secondary" className={cn('text-xs', STATUS_STYLES[currentStatus])}>
                        {currentStatus}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{report.report_type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className={cn(isOverdue ? 'text-destructive font-medium' : '')}>
                        Due: {format(new Date(report.due_date), 'MMM d, yyyy')}
                        {report.status !== 'submitted' && ` (${isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})`}
                      </span>
                      {report.submitted_date && <span className="text-accent">Submitted: {format(new Date(report.submitted_date), 'MMM d, yyyy')}</span>}
                    </div>
                    {report.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {report.status !== 'submitted' && (
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" className="gap-1 text-xs pointer-events-none h-8" disabled={uploadingId === report.id}>
                          {uploadingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          Submit
                        </Button>
                        <input type="file" className="hidden" onChange={e => handleUploadReport(e, report.id)} />
                      </label>
                    )}
                    {report.file_url && (
                      <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSendReminder(report)} title="Send reminder email">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(report.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}