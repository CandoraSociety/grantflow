import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Image, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function NotesTab({ projectId, notes }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [extractingId, setExtractingId] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes', projectId] }),
  });

  const handleSave = async () => {
    setSaving(true);
    let photo_url = null;
    let extracted_text = null;

    if (photoFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      photo_url = file_url;
      extracted_text = await base44.integrations.Core.InvokeLLM({
        prompt: 'Please transcribe all handwritten or printed text from this image exactly as written. Preserve the structure and formatting.',
        file_urls: [file_url],
      });
    }

    await base44.entities.ProjectNote.create({
      project_id: projectId,
      title: form.title || 'Untitled Note',
      content: form.content,
      photo_url,
      extracted_text,
    });

    queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
    setForm({ title: '', content: '' });
    setPhotoFile(null);
    setShowForm(false);
    setSaving(false);
    toast.success('Note saved');
  };

  const handleExtractFromPhoto = async (note) => {
    if (!note.photo_url) return;
    setExtractingId(note.id);
    const text = await base44.integrations.Core.InvokeLLM({
      prompt: 'Please transcribe all handwritten or printed text from this image exactly as written. Preserve the structure.',
      file_urls: [note.photo_url],
    });
    await base44.entities.ProjectNote.update(note.id, { extracted_text: text });
    queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
    setExtractingId(null);
    toast.success('Text extracted from photo');
  };

  const toggleExpand = (id) => setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/20 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title..." />
            </div>
            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your notes here..." rows={5} />
            </div>
            <div className="space-y-1">
              <Label>Photo of Handwritten Notes (optional)</Label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <Button variant="outline" className="gap-2 pointer-events-none" size="sm">
                    <Image className="w-4 h-4" />
                    {photoFile ? photoFile.name : 'Upload Photo'}
                  </Button>
                  <input type="file" className="hidden" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
                </label>
                {photoFile && <span className="text-xs text-muted-foreground">Will be auto-transcribed with AI</span>}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No notes yet. Add your first note.</p>
        </div>
      )}

      <div className="space-y-3">
        {notes.map(note => (
          <Card key={note.id} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{note.title || 'Untitled Note'}</h4>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(note.created_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {note.content && (
                    <p className={`text-sm text-muted-foreground mt-1 ${!expandedNotes[note.id] ? 'line-clamp-3' : ''}`}>
                      {note.content}
                    </p>
                  )}
                  {note.photo_url && (
                    <div className="mt-3">
                      <img src={note.photo_url} alt="Handwritten note" className="max-h-48 rounded-lg object-contain border" />
                    </div>
                  )}
                  {note.extracted_text && (
                    <div className="mt-3 p-3 bg-secondary rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Transcribed Text</p>
                      <p className={`text-xs ${!expandedNotes[note.id] ? 'line-clamp-3' : ''}`}>{note.extracted_text}</p>
                    </div>
                  )}
                  <button className="text-xs text-primary mt-1" onClick={() => toggleExpand(note.id)}>
                    {expandedNotes[note.id] ? 'Show less' : 'Show more'}
                  </button>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {note.photo_url && !note.extracted_text && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExtractFromPhoto(note)} disabled={extractingId === note.id}>
                      {extractingId === note.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(note.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}