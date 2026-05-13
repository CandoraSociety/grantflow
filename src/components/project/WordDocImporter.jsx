import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, FileText, Copy } from 'lucide-react';
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

export default function WordDocImporter({ doc, onClose, onInsertText }) {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setText(null);
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

  return (
    <div className="border-t border-border mt-4 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm truncate max-w-xs">{doc.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Word Document</span>
        </div>
        <div className="flex items-center gap-2">
          {text && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleCopyAll}>
                <Copy className="w-3 h-3" /> Copy All
              </Button>
              <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={handleInsertAll}>
                Insert into Editor
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative rounded-lg border border-border bg-muted/30 min-h-[280px] max-h-[420px] overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Extracting document text…</span>
          </div>
        )}
        {error && (
          <div className="text-sm text-destructive text-center py-8">
            Could not read document: {error}
          </div>
        )}
        {text && (
          <pre className="text-sm font-body leading-relaxed whitespace-pre-wrap text-foreground">
            {text}
          </pre>
        )}
      </div>
    </div>
  );
}