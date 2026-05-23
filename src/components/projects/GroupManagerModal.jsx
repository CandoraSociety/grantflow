import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, FolderOpen } from 'lucide-react';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function GroupManagerModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);

  const { data: groups = [] } = useQuery({
    queryKey: ['projectGroups'],
    queryFn: () => base44.entities.ProjectGroup.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectGroups'] });
      setNewName('');
      setNewDesc('');
      setNewColor(COLORS[0]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectGroup.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectGroups'] }),
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), description: newDesc.trim(), color: newColor });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" /> Manage Groups
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing groups */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No groups yet. Create one below.</p>
            )}
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color || '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(g.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Create new group */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">New Group</p>
            <Input placeholder="Group name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Color:</span>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-5 h-5 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: newColor === c ? '#1e293b' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Create Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}