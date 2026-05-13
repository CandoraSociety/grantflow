import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react';

const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
const PDF_TYPES = ['pdf'];

export default function DocViewerPanel({ doc, onClose }) {
  const [zoom, setZoom] = useState(1);
  const ext = (doc.file_type || '').toLowerCase();
  const isImage = IMAGE_TYPES.includes(ext);
  const isPdf = PDF_TYPES.includes(ext);

  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const resetZoom = () => setZoom(1);

  return (
    <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary border-b border-border flex-shrink-0 gap-2">
        <p className="text-xs font-medium truncate flex-1">{doc.name}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isImage && (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomOut} title="Zoom out">
                <ZoomOut className="w-3 h-3" />
              </Button>
              <span className="text-xs text-muted-foreground w-9 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomIn} title="Zoom in">
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetZoom} title="Reset zoom">
                <RotateCcw className="w-3 h-3" />
              </Button>
            </>
          )}
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Open in new tab">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} title="Close">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-muted/30" style={{ minHeight: 0 }}>
        {isPdf ? (
          <iframe
            src={doc.file_url}
            title={doc.name}
            className="w-full border-0"
            style={{ height: '100%', minHeight: 600 }}
          />
        ) : isImage ? (
          <div className="flex items-start justify-center p-4 min-h-full">
            <img
              src={doc.file_url}
              alt={doc.name}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
              className="max-w-full object-contain rounded shadow-md"
            />
          </div>
        ) : doc.extracted_text ? (
          <div className="p-4 text-xs font-body leading-relaxed whitespace-pre-wrap text-foreground">
            {doc.extracted_text}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center min-h-64">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">This file type can't be previewed inline.</p>
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-2">
                <ExternalLink className="w-3.5 h-3.5" /> Open File
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}