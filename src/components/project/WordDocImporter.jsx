import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, Loader2, FileText, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';

// Extract text from a .docx file using the browser
async function extractDocxText(fileUrl) {
  // Fetch the file
  const res = await fetch(fileUrl);
  const arrayBuffer = await res.arrayBuffer();

  // Use mammoth via dynamic import workaround — parse XML directly from zip
  // We'll use JSZip approach via the raw zip structure
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(arrayBuffer);
  const wordDoc = zip.file('word/document.xml');
  if (!wordDoc) throw new Error('Not a valid .docx file');

  const xml = await wordDoc.async('string');
  // Strip XML tags, decode entities, collapse whitespace
  const text = xml
    .replace(/<w:br[^/]*/g, '\n')
    .replace(/<w:p[ >]/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#xD;/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

export default function WordDocImporter({ doc, onClose, onInsertText, projectId }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Only re-extract if text not yet loaded for this doc
    extractDocxText(doc.file_url)
      .then(t => { setText(t); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [doc.id]);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(text || '');
    toast.success('Copied to clipboard');
  };

  const handleInsertAll = () => {
    if (onInsertText) onInsertText(text || '');
    toast.success('Text inserted into editor');
  };

  const handleSaveToDocuments = async () => {
    setSaving(true);
    await base44.entities.ProjectDocument.update(doc.id, { extracted_text: text });
    queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    setSaving(false);
    toast.success('Saved extracted text to document record');
  };

  // Render paragraphs nicely instead of raw <pre>
  const renderText = (rawText) => {
    const paragraphs = rawText.split('\n').filter(line => line.trim() !== '');
    return paragraphs.map((para, i) => (
      <p key={i} className="text-sm font-body leading-relaxed text-foreground mb-3">
        {para}
      </p>
    ));
  };

  return (
    <div className="border-t-2 border-primary/20 bg-card rounded-b-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-none">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm truncate max-w-xs">{doc.name}</span>
          <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">Word Preview</span>
        </div>
        <div className="flex items-center gap-2">
          {text && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleCopyAll}>
                <Copy className="w-3 h-3" /> Copy
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleSaveToDocuments} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save to Docs
              </Button>
              {onInsertText && (
                <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={handleInsertAll}>
                  Insert into Section
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 320 }}>
        {loading && (
          <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Reading document…</span>
          </div>
        )}
        {error && (
          <div className="text-sm text-destructive text-center py-8">
            Could not read document: {error}
          </div>
        )}
        {text && renderText(text)}
      </div>
    </div>
  );
}