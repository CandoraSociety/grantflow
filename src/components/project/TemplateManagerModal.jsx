import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save, Trash2, LayoutTemplate, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateManagerModal({ currentSections, onLoadTemplate, onClose }) {
  const queryClient = useQueryClient();
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['proposal-templates'],
    queryFn: () => base44.entities.ProposalTemplate.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProposalTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposal-templates'] }),
  });

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    await base44.entities.ProposalTemplate.create({
      name: saveName.trim(),
      description: saveDesc.trim(),
      sections: currentSections.map(s => ({ title: s.title, section_type: s.section_type })),
    });
    queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
    setSaveName('');
    setSaveDesc('');
    setSaving(false);
    toast.success('Template saved');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-heading font-semibold text-lg">Proposal Templates</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Save or load section structures</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Save current as template */}
          {currentSections.length > 0 && (
            <div className="border border-border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Save Current Structure</p>
              <p className="text-xs text-muted-foreground">{currentSections.length} sections</p>
              <Input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Template name..."
                className="h-8 text-sm"
              />
              <Input
                value={saveDesc}
                onChange={e => setSaveDesc(e.target.value)}
                placeholder="Description (optional)"
                className="h-8 text-sm"
              />
              <Button size="sm" className="gap-2" onClick={handleSave} disabled={!saveName.trim() || saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Template
              </Button>
            </div>
          )}

          {/* Saved templates */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saved Templates</p>
            {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
            {!isLoading && templates.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No saved templates yet</p>
            )}
            {templates.map(t => (
              <div key={t.id} className="border border-border rounded-lg p-3 flex items-start gap-3">
                <LayoutTemplate className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.name}</p>
                  {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{t.sections?.length || 0} sections</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(t.sections || []).slice(0, 4).map((s, i) => (
                      <span key={i} className="text-xs bg-secondary px-1.5 py-0.5 rounded">{s.title}</span>
                    ))}
                    {(t.sections?.length || 0) > 4 && (
                      <span className="text-xs text-muted-foreground">+{t.sections.length - 4} more</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { onLoadTemplate(t.sections); onClose(); }}>
                    Load
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}