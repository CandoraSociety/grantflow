import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, ArrowLeft, LayoutList, ScrollText } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

// Generate a 1-2 sentence summary using AI (cached per note id)
const summaryCache = {};

function useSummary(note) {
  const [summary, setSummary] = useState(summaryCache[note.id] || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (summaryCache[note.id]) {
      setSummary(summaryCache[note.id]);
      return;
    }
    const text = note.content || note.extracted_text;
    if (!text) return;
    setLoading(true);
    base44.integrations.Core.InvokeLLM({
      prompt: `Summarize the following note in 1-2 sentences:\n\n${text.slice(0, 1500)}`,
    }).then(s => {
      summaryCache[note.id] = s;
      setSummary(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [note.id]);

  return { summary, loading };
}

function NoteSummaryRow({ summary, loading }) {
  if (loading) return <p className="text-xs text-muted-foreground italic mt-1 animate-pulse">Summarizing...</p>;
  if (!summary) return null;
  return <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">{summary}</p>;
}

function AllNotesScroll({ notes }) {
  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-4">
      {notes.map(note => (
        <AllNoteEntry key={note.id} note={note} />
      ))}
      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No notes match your search.</p>
      )}
    </div>
  );
}

function AllNoteEntry({ note }) {
  const { summary, loading } = useSummary(note);
  const text = note.content || note.extracted_text || '';
  return (
    <div className="border-b border-border pb-5 last:border-0">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="font-semibold text-sm">{note.title || 'Untitled Note'}</h3>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">
          {format(new Date(note.created_date), 'MMM d, yyyy')}
        </span>
      </div>
      <NoteSummaryRow summary={summary} loading={loading} />
      {text && (
        <p className="text-xs text-foreground leading-relaxed mt-2 whitespace-pre-wrap">{text}</p>
      )}
      {note.photo_url && (
        <img src={note.photo_url} alt="Note photo" className="mt-3 max-w-full rounded-lg border object-contain max-h-48" />
      )}
    </div>
  );
}

function NoteDetail({ note, onBack }) {
  const { summary, loading } = useSummary(note);
  const text = note.content || note.extracted_text || '';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onBack}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs font-medium truncate flex-1">{note.title || 'Untitled Note'}</span>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">
          {format(new Date(note.created_date), 'MMM d, yyyy')}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(summary || loading) && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Summary</p>
            <NoteSummaryRow summary={summary} loading={loading} />
          </div>
        )}
        {text && (
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">{text}</p>
        )}
        {note.photo_url && (
          <img src={note.photo_url} alt="Note photo" className="max-w-full rounded-lg border object-contain" />
        )}
        {!text && !note.photo_url && (
          <p className="text-sm text-muted-foreground italic text-center py-6">No content in this note.</p>
        )}
      </div>
    </div>
  );
}

export default function NotesPanel({ notes, onClose }) {
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'scroll'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(n => {
      const dateStr = format(new Date(n.created_date), 'MMM d, yyyy').toLowerCase();
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.extracted_text || '').toLowerCase().includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [notes, search]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary border-b border-border flex-shrink-0">
        <span className="text-xs font-semibold flex-1">Project Notes</span>
        {!selectedNote && (
          <div className="flex gap-0.5">
            <Button
              variant="ghost" size="icon" className={cn("h-6 w-6", viewMode === 'list' && 'bg-background')}
              title="List view" onClick={() => setViewMode('list')}
            >
              <LayoutList className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="icon" className={cn("h-6 w-6", viewMode === 'scroll' && 'bg-background')}
              title="Scroll through all" onClick={() => setViewMode('scroll')}
            >
              <ScrollText className="w-3 h-3" />
            </Button>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Search bar */}
      {!selectedNote && (
        <div className="px-3 py-2 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes, keywords, dates..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>
      )}

      {/* Body */}
      {selectedNote ? (
        <NoteDetail note={selectedNote} onBack={() => setSelectedNote(null)} />
      ) : viewMode === 'scroll' ? (
        <AllNotesScroll notes={filtered} />
      ) : (
        // List view
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">No notes match your search.</p>
          )}
          {filtered.map(note => (
            <button
              key={note.id}
              className="w-full text-left px-3 py-3 hover:bg-secondary/60 transition-colors block"
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium truncate">{note.title || 'Untitled Note'}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {format(new Date(note.created_date), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                {note.content || note.extracted_text || 'No content'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}