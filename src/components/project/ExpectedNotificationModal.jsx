import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function ExpectedNotificationModal({ 
  open, 
  onOpenChange, 
  project 
}) {
  const [date, setDate] = useState(project?.expected_notification_date || '');
  const [notes, setNotes] = useState(project?.expected_notification_notes || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Project.update(project.id, {
        expected_notification_date: date,
        expected_notification_notes: notes,
      });

      // Auto-create or update a project note if notes exist
      if (notes.trim()) {
        const existingNote = await base44.entities.ProjectNote.filter({
          project_id: project.id,
          title: 'Expected Notification',
        });

        if (existingNote.length > 0) {
          await base44.entities.ProjectNote.update(existingNote[0].id, {
            content: notes,
          });
        } else {
          await base44.entities.ProjectNote.create({
            project_id: project.id,
            title: 'Expected Notification',
            content: notes,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['notes', project.id] });
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Expected Notification Date</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Date or Time Period</Label>
            <Input
              id="date"
              placeholder="e.g., June 15, 2026 or Mid-summer or Unknown"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes about this notification date</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about when you expect to hear back... (will sync to project notes)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5 h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}