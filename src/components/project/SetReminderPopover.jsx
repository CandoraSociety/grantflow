import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SetReminderPopover({ reminderType, projectTitle, funderName, projectId }) {
  const [open, setOpen] = useState(false);
  const [remindAt, setRemindAt] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const label = reminderType === 'submission_deadline' ? 'Submission Deadline' : 'Open for Submissions';

  const handleSave = async () => {
    if (!remindAt || !email) return;
    setSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Reminder.create({
        project_id: projectId || '',
        reminder_type: reminderType,
        remind_at: new Date(remindAt).toISOString(),
        recipient_email: email || user?.email || '',
        project_title: projectTitle || '',
        funder_name: funderName || '',
        status: 'pending',
      });
      setDone(true);
      toast.success(`Reminder set for ${label}`);
      setTimeout(() => { setOpen(false); setDone(false); setRemindAt(''); }, 1500);
    } catch (err) {
      toast.error('Failed to set reminder');
    } finally {
      setSaving(false);
    }
  };

  // Pre-fill user email when opening
  const handleOpen = async (isOpen) => {
    setOpen(isOpen);
    if (isOpen && !email) {
      try {
        const user = await base44.auth.me();
        if (user?.email) setEmail(user.email);
      } catch (_) {}
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
          title={`Set reminder for ${label}`}
        >
          <Bell className="w-3 h-3" />
          Set Reminder
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 space-y-3" align="start">
        <p className="text-sm font-medium">{label} Reminder</p>
        <div className="space-y-1">
          <Label className="text-xs">Remind me on</Label>
          <Input
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            className="text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Send email to</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="text-xs"
          />
        </div>
        <Button size="sm" className="w-full" onClick={handleSave} disabled={saving || done || !remindAt || !email}>
          {done ? <><Check className="w-3 h-3 mr-1" /> Saved!</> : saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Reminder'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}