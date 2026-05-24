import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignGroupModal({ open, onClose, project }) {
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState('');
  const [currentGroupId, setCurrentGroupId] = useState(project?.group_id || null);
  const [currentTags, setCurrentTags] = useState(project?.tags || []);

  const { data: groups = [] } = useQuery({
    queryKey: ['projectGroups'],
    queryFn: () => base44.entities.ProjectGroup.list('name'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleGroupSelect = (groupId, groupName) => {
    const removing = currentGroupId === groupId;
    const newGroupId = removing ? null : groupId;
    setCurrentGroupId(newGroupId);
    updateMutation.mutate(
      { group_id: newGroupId },
      { onSuccess: () => toast.success(removing ? 'Removed from group' : `Added to "${groupName}"`) }
    );
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag || currentTags.includes(tag)) return;
    const newTags = [...currentTags, tag];
    setCurrentTags(newTags);
    updateMutation.mutate(
      { tags: newTags },
      { onSuccess: () => toast.success(`Tag "${tag}" added`) }
    );
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    const newTags = currentTags.filter(t => t !== tag);
    setCurrentTags(newTags);
    updateMutation.mutate({ tags: newTags });
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Organize: {project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Group assignment */}
          <div>
            <p className="text-sm font-medium mb-2">Assign to Group</p>
            <div className="space-y-1.5">
              {groups.length === 0 && (
                <p className="text-xs text-muted-foreground">No groups yet. Create groups using the Manage Groups button.</p>
              )}
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => handleGroupSelect(g.id, g.name)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all',
                    currentGroupId === g.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{g.name}</p>
                    {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                  </div>
                  {currentGroupId === g.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-sm font-medium mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
              {currentTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-xs font-medium">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {currentTags.length === 0 && (
                <span className="text-xs text-muted-foreground">No tags yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>Add</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}