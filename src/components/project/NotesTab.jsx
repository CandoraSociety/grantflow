import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Image, Loader2, Sparkles, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function NotesTab({ projectId, notes, documents }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', photos: [], linked_documents: [] });
  const [handwrittenPhoto, setHandwrittenPhoto] = useState(null);
  const [otherPhoto, setOtherPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [extractingId, setExtractingId] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes', projectId] }),
  });

  const handleSave = async () => {
    setSaving(true);
    const photos = [];

    if (handwrittenPhoto) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: handwrittenPhoto });
      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt: 'Please transcribe all handwritten or printed text from this image exactly as written. Preserve the structure and formatting.',
        file_urls: [file_url],
      });
      photos.push({ url: file_url, type: 'handwritten', extracted_text: extracted });
    }

    if (otherPhoto) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: otherPhoto });
      photos.push({ url: file_url, type: 'other' });
    }

    await base44.entities.ProjectNote.create({
      project_id: projectId,
      title: form.title || 'Untitled Note',
      content: form.content,
      photos: photos.length > 0 ? photos : undefined,
      linked_documents: form.linked_documents.length > 0 ? form.linked_documents : undefined,
    });

    queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
    setForm({ title: '', content: '', photos: [], linked_documents: [] });
    setHandwrittenPhoto(null);
    setOtherPhoto(null);
    setShowForm(false);
    setSaving(false);
    toast.success('Note saved');
  };

  const handleExtractFromPhoto = async (note, photoIndex) => {
    const photos = note.photos || [];
    if (!photos[photoIndex]) return;
    setExtractingId(`${note.id}-${photoIndex}`);
    const text = await base44.integrations.Core.InvokeLLM({
      prompt: 'Please transcribe all handwritten or printed text from this image exactly as written. Preserve the structure.',
      file_urls: [photos[photoIndex].url],
    });
    photos[photoIndex].extracted_text = text;
    await base44.entities.ProjectNote.update(note.id, { photos });
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
            <div className="space-y-3">
              <div>
                <Label>Handwritten Notes Photo (optional)</Label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="cursor-pointer">
                    <Button variant="outline" className="gap-2" size="sm" asChild>
                      <span>
                        <Image className="w-4 h-4" />
                        {handwrittenPhoto ? handwrittenPhoto.name : 'Upload Handwritten'}
                      </span>
                    </Button>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setHandwrittenPhoto(e.target.files[0])} />
                  </label>
                  {handwrittenPhoto && <span className="text-xs text-muted-foreground">Auto-transcribed</span>}
                </div>
              </div>
              <div>
                <Label>Other Photos (optional)</Label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="cursor-pointer">
                    <Button variant="outline" className="gap-2" size="sm" asChild>
                      <span>
                        <Image className="w-4 h-4" />
                        {otherPhoto ? otherPhoto.name : 'Upload Other Photo'}
                      </span>
                    </Button>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setOtherPhoto(e.target.files[0])} />
                  </label>
                </div>
              </div>
              {documents?.length > 0 && (
                <div>
                  <Label>Link Project Documents (optional)</Label>
                  <div className="mt-1 space-y-1">
                    {documents.map(doc => (
                      <label key={doc.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-secondary rounded text-sm">
                        <input
                          type="checkbox"
                          checked={form.linked_documents.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, linked_documents: [...form.linked_documents, doc.id] });
                            } else {
                              setForm({ ...form, linked_documents: form.linked_documents.filter(id => id !== doc.id) });
                            }
                          }}
                        />
                        <LinkIcon className="w-3 h-3 text-muted-foreground" />
                        {doc.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                  {note.photos?.map((photo, idx) => (
                    <div key={idx} className="mt-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1 capitalize">{photo.type} Photo</div>
                      <img src={photo.url} alt={`${photo.type} note`} className="max-h-48 rounded-lg object-contain border" />
                      {photo.extracted_text && (
                        <div className="mt-2 p-2 bg-secondary rounded text-xs">
                          <p className="font-medium text-muted-foreground mb-1">Transcribed</p>
                          <p className={!expandedNotes[note.id] ? 'line-clamp-2' : ''}>{photo.extracted_text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {note.linked_documents?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Linked Documents</p>
                      <div className="flex flex-wrap gap-1">
                        {note.linked_documents.map(docId => {
                          const doc = documents?.find(d => d.id === docId);
                          return doc ? (
                            <span key={docId} className="text-xs bg-secondary px-2 py-1 rounded flex items-center gap-1">
                              <LinkIcon className="w-2.5 h-2.5" />
                              {doc.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  <button className="text-xs text-primary mt-1" onClick={() => toggleExpand(note.id)}>
                    {expandedNotes[note.id] ? 'Show less' : 'Show more'}
                  </button>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {note.photos?.map((photo, idx) => (
                    photo.type === 'handwritten' && !photo.extracted_text && (
                      <Button key={idx} variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExtractFromPhoto(note, idx)} disabled={extractingId === `${note.id}-${idx}`}>
                        {extractingId === `${note.id}-${idx}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                      </Button>
                    )
                  ))}
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