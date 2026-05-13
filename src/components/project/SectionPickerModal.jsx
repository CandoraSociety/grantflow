import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, GripVertical, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTED_SECTIONS = [
  { title: 'Abstract / Executive Summary', section_type: 'abstract' },
  { title: 'Cover Letter', section_type: 'cover_letter' },
  { title: 'Project Narrative', section_type: 'narrative' },
  { title: 'Statement of Need', section_type: 'narrative' },
  { title: 'Goals & Objectives', section_type: 'narrative' },
  { title: 'Project Activities / Work Plan', section_type: 'narrative' },
  { title: 'Evaluation Plan', section_type: 'narrative' },
  { title: 'Organizational Capacity', section_type: 'narrative' },
  { title: 'Budget', section_type: 'budget' },
  { title: 'Budget Narrative / Justification', section_type: 'budget' },
  { title: 'Timeline', section_type: 'timeline' },
  { title: 'References', section_type: 'references' },
  { title: 'Appendix', section_type: 'appendix' },
  { title: 'Logic Model', section_type: 'custom' },
  { title: 'Sustainability Plan', section_type: 'narrative' },
  { title: 'Letters of Support', section_type: 'appendix' },
  { title: 'Key Personnel', section_type: 'narrative' },
  { title: 'Community Partnerships', section_type: 'narrative' },
];

export default function SectionPickerModal({ currentSections, onApply, onClose }) {
  const currentTitles = new Set(currentSections.map(s => s.title));

  // Start with current sections pre-selected
  const [selected, setSelected] = useState(
    currentSections.map(s => ({ title: s.title, section_type: s.section_type }))
  );
  const [customInput, setCustomInput] = useState('');

  const isSelected = (title) => selected.some(s => s.title === title);

  const toggle = (suggestion) => {
    if (isSelected(suggestion.title)) {
      setSelected(prev => prev.filter(s => s.title !== suggestion.title));
    } else {
      setSelected(prev => [...prev, suggestion]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || isSelected(trimmed)) return;
    setSelected(prev => [...prev, { title: trimmed, section_type: 'custom' }]);
    setCustomInput('');
  };

  const remove = (title) => setSelected(prev => prev.filter(s => s.title !== title));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-heading font-semibold text-lg">Customize Proposal Sections</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pick from suggestions or add your own</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: suggestions */}
          <div className="w-1/2 border-r border-border overflow-y-auto p-4 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Suggested Sections</p>
            {SUGGESTED_SECTIONS.map(s => (
              <button
                key={s.title}
                onClick={() => toggle(s)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all',
                  isSelected(s.title)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-secondary text-foreground'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                  isSelected(s.title) ? 'bg-primary border-primary' : 'border-border'
                )}>
                  {isSelected(s.title) && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                {s.title}
              </button>
            ))}

            {/* Custom input */}
            <div className="pt-3 border-t border-border mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Add Custom</p>
              <div className="flex gap-2">
                <Input
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustom()}
                  placeholder="Section name..."
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8 px-3" onClick={addCustom} disabled={!customInput.trim()}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right: selected / order */}
          <div className="w-1/2 overflow-y-auto p-4 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Selected ({selected.length})
            </p>
            {selected.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No sections selected</p>
            )}
            {selected.map((s, i) => (
              <div key={s.title} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm">
                <span className="text-muted-foreground text-xs w-4 text-right">{i + 1}.</span>
                <span className="flex-1 truncate">{s.title}</span>
                <button onClick={() => remove(s.title)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onApply(selected)} disabled={selected.length === 0}>
            Apply Sections
          </Button>
        </div>
      </div>
    </div>
  );
}