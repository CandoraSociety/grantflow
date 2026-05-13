import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, FileDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function GenerateDocModal({ sections, project, onClose }) {
  const [selected, setSelected] = useState(sections.map(s => s.id));
  const [format, setFormat] = useState('pdf_text');
  const [generating, setGenerating] = useState(false);

  const toggleSection = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const chosenSections = sections.filter(s => selected.includes(s.id)).sort((a, b) => a.order_index - b.order_index);
    const content = chosenSections.map(s => `# ${s.title}\n\n${s.content || '(No content)'}`).join('\n\n---\n\n');

    // Generate a formatted document using AI
    const docContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Format the following grant proposal sections into a clean, professional document. Preserve all content but improve formatting:\n\n${content}`,
    });

    // Create a blob and download
    const blob = new Blob([`${project.title}\nFunder: ${project.funder_name}\n\n${docContent}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_Proposal.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setGenerating(false);
    toast.success('Document downloaded');
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Export Proposal Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Select sections to include:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sections.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    id={s.id}
                    checked={selected.includes(s.id)}
                    onCheckedChange={() => toggleSection(s.id)}
                  />
                  <Label htmlFor={s.id} className="text-sm cursor-pointer">
                    {s.title}
                    {s.is_complete && <span className="ml-2 text-xs text-accent">✓</span>}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={generating || selected.length === 0} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}