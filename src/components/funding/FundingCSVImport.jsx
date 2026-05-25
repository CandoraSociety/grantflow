import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Upload, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const SOURCES_TEMPLATE = `name,source_type,government_level,website,description,notes,contact_name,contact_email,contact_phone
"Government of Alberta",government_body,provincial,https://alberta.ca,"Province of Alberta funding programs",,,,
"Calgary Foundation",foundation,none,https://calgaryfoundation.org,"Community foundation serving Calgary",,,,`;

const STREAMS_TEMPLATE = `name,source_name,purpose,award_min,award_max,award_notes,submission_deadline,application_cycle,eligibility,focus_areas,application_url,status,internal_notes,fit_score
"Community Initiatives Program","Government of Alberta","Supports community organizations",5000,75000,"Up to $75K","March 31 annually",annual,"Registered nonprofits in Alberta","community,social services",https://alberta.ca/cip,active,,4`;

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += line[i];
      }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { if (values[i] !== undefined && values[i] !== '') obj[h] = values[i]; });
    return obj;
  });
}

export default function FundingCSVImport({ onClose }) {
  const [mode, setMode] = useState('sources'); // 'sources' | 'streams'
  const [status, setStatus] = useState(null); // null | 'loading' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const fileRef = useRef();
  const queryClient = useQueryClient();

  const downloadTemplate = () => {
    const csv = mode === 'sources' ? SOURCES_TEMPLATE : STREAMS_TEMPLATE;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'sources' ? 'funding_sources_template.csv' : 'funding_streams_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('loading');
    setResult(null);

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      setStatus('error');
      setResult({ error: 'No valid rows found in CSV.' });
      return;
    }

    let created = 0;
    let errors = [];

    if (mode === 'sources') {
      for (const row of rows) {
        if (!row.name || !row.source_type) { errors.push(`Skipped row — missing name or source_type`); continue; }
        await base44.entities.FundingSource.create({
          name: row.name,
          source_type: row.source_type,
          government_level: row.government_level || 'none',
          website: row.website,
          description: row.description,
          notes: row.notes,
          contact_name: row.contact_name,
          contact_email: row.contact_email,
          contact_phone: row.contact_phone,
        });
        created++;
      }
      queryClient.invalidateQueries({ queryKey: ['fundingSources'] });
    } else {
      // Streams — need to resolve source_name → source_id
      const sources = await base44.entities.FundingSource.list('name');
      const sourceMap = {};
      sources.forEach(s => { sourceMap[s.name.toLowerCase()] = s.id; });

      for (const row of rows) {
        if (!row.name || !row.source_name) { errors.push(`Skipped row — missing name or source_name`); continue; }
        const source_id = sourceMap[row.source_name.toLowerCase()];
        if (!source_id) { errors.push(`Source not found: "${row.source_name}"`); continue; }
        await base44.entities.FundingStream.create({
          name: row.name,
          source_id,
          purpose: row.purpose,
          award_min: row.award_min ? parseFloat(row.award_min) : undefined,
          award_max: row.award_max ? parseFloat(row.award_max) : undefined,
          award_notes: row.award_notes,
          submission_deadline: row.submission_deadline,
          application_cycle: row.application_cycle || 'unknown',
          eligibility: row.eligibility,
          focus_areas: row.focus_areas ? row.focus_areas.split(',').map(f => f.trim()) : [],
          application_url: row.application_url,
          status: row.status || 'unknown',
          internal_notes: row.internal_notes,
          fit_score: row.fit_score ? parseFloat(row.fit_score) : undefined,
        });
        created++;
      }
      queryClient.invalidateQueries({ queryKey: ['fundingStreams'] });
    }

    setStatus('done');
    setResult({ created, errors });
    fileRef.current.value = '';
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from CSV</DialogTitle>
          <DialogDescription>Import funding sources or streams in bulk from a CSV file.</DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'sources' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setMode('sources'); setStatus(null); setResult(null); }}
          >
            Funding Sources
          </Button>
          <Button
            variant={mode === 'streams' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setMode('streams'); setStatus(null); setResult(null); }}
          >
            Funding Streams
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {mode === 'sources'
            ? 'Import top-level funders (government bodies, foundations, corporates).'
            : 'Import specific funding programs. The "source_name" column must match an existing Funding Source name exactly.'}
        </p>

        {/* Template download */}
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={downloadTemplate}>
          <Download className="w-4 h-4" />
          Download {mode === 'sources' ? 'Sources' : 'Streams'} Template
        </Button>

        {/* Upload */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Click to upload CSV</p>
          <p className="text-xs text-muted-foreground mt-1">Only .csv files</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {/* Status */}
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Importing rows...
          </div>
        )}
        {status === 'done' && result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              {result.created} record{result.created !== 1 ? 's' : ''} imported successfully.
            </div>
            {result.errors.length > 0 && (
              <div className="text-xs text-destructive space-y-1">
                {result.errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
              </div>
            )}
          </div>
        )}
        {status === 'error' && result?.error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" /> {result.error}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}