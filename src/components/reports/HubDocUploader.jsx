import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Trash2, ExternalLink, Loader2 } from 'lucide-react';

const PERIOD_LABELS = {
  annual: 'Annual',
  interim_q1: 'Q1 Interim',
  interim_q2: 'Q2 Interim',
  interim_q3: 'Q3 Interim',
  interim_midyear: 'Mid-Year',
  other: 'Other',
};

export default function HubDocUploader({ hub, docs = [], docType }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [period, setPeriod] = useState('annual');

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FunderReportingDoc.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funder-docs'] }),
  });

  const hubDocs = docs.filter(d => d.hub_id === hub.id && d.doc_type === docType);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.FunderReportingDoc.create({
      hub_id: hub.id,
      doc_type: docType,
      year,
      report_period: period,
      file_url,
      file_name: file.name,
    });
    qc.invalidateQueries({ queryKey: ['funder-docs'] });
    setUploading(false);
    e.target.value = '';
  };

  const groupedByYear = hubDocs.reduce((acc, doc) => {
    const y = doc.year || 'Other';
    if (!acc[y]) acc[y] = [];
    acc[y].push(doc);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Input value={year} onChange={e => setYear(e.target.value)} placeholder="2025" className="w-20 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Period</Label>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            {Object.entries(PERIOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <Label className="cursor-pointer">
          <Button size="sm" variant="outline" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
              {uploading ? 'Uploading…' : 'Upload File'}
            </span>
          </Button>
          <input type="file" className="hidden" onChange={handleUpload} />
        </Label>
      </div>

      {sortedYears.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No {docType === 'template' ? 'templates' : 'reports'} uploaded yet.</p>
      )}
      {sortedYears.map(y => (
        <div key={y}>
          <p className="text-xs font-semibold text-muted-foreground mb-1">{y}</p>
          <div className="space-y-1">
            {groupedByYear[y].map(doc => (
              <div key={doc.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-muted/40 group">
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{doc.file_name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{PERIOD_LABELS[doc.report_period] || doc.report_period}</span>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                </a>
                <button onClick={() => deleteMutation.mutate(doc.id)} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}