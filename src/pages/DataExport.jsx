import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle2, Loader2, FileJson, AlertTriangle, Package } from 'lucide-react';

// Strip internal platform fields, keep only user data
function cleanRecord(record) {
  const { id, created_date, updated_date, created_by_id, created_by,
    entity_name, app_id, is_sample, is_deleted, deleted_date, environment, ...rest } = record;
  // If data is nested (raw API response), flatten it
  if (rest.data && typeof rest.data === 'object') {
    return rest.data;
  }
  return rest;
}

const EXPORTS = [
  {
    key: 'ProjectGroup',
    label: 'Project Groups',
    description: 'Proposal categories / groups',
    color: 'bg-purple-100 text-purple-700',
    fn: () => base44.entities.ProjectGroup.list('name'),
  },
  {
    key: 'Project',
    label: 'Projects (Proposals)',
    description: '13 proposals with status, funder, amounts',
    color: 'bg-blue-100 text-blue-700',
    fn: () => base44.entities.Project.list('-created_date'),
    note: '⚠️ group_id fields reference ProjectGroup IDs — import ProjectGroups first, then manually re-map group_id values.',
  },
  {
    key: 'ProposalSection',
    label: 'Proposal Sections',
    description: 'Written proposal content for Archbishop O\'Leary',
    color: 'bg-indigo-100 text-indigo-700',
    fn: () => base44.entities.ProposalSection.list('-created_date'),
    note: '⚠️ project_id must match the new Project IDs after import.',
  },
  {
    key: 'ProjectNote',
    label: 'Project Notes',
    description: 'Notes and content attached to proposals',
    color: 'bg-yellow-100 text-yellow-700',
    fn: () => base44.entities.ProjectNote.list('-created_date'),
    note: '⚠️ project_id must match the new Project IDs after import.',
  },
  {
    key: 'SubmissionDocument',
    label: 'Submission Documents',
    description: 'Uploaded application files with external URLs',
    color: 'bg-orange-100 text-orange-700',
    fn: () => base44.entities.SubmissionDocument.list('-created_date'),
    note: '✅ file_url fields are public URLs — they remain accessible in the new app.',
  },
  {
    key: 'ProjectDocument',
    label: 'Project Documents',
    description: 'Guidelines, templates, and auto-filed records',
    color: 'bg-red-100 text-red-700',
    fn: () => base44.entities.ProjectDocument.list('-created_date'),
    note: '⚠️ Records with file_url = "auto-filed" are placeholders — safe to import as-is. Real file URLs remain accessible.',
  },
  {
    key: 'FundingSource',
    label: 'Funding Sources',
    description: 'Funder database — government bodies, foundations, corporates',
    color: 'bg-green-100 text-green-700',
    fn: () => base44.entities.FundingSource.list('name'),
    note: '⚠️ parent_id and linked_project_id reference old IDs — these will need to be cleared or re-mapped after import.',
  },
  {
    key: 'FundingStream',
    label: 'Funding Streams',
    description: 'Individual grant programs under each funder',
    color: 'bg-teal-100 text-teal-700',
    fn: () => base44.entities.FundingStream.list('name'),
    note: '⚠️ source_id references FundingSource IDs — import FundingSources first, then re-map.',
  },
  {
    key: 'FunderReportingHub',
    label: 'Reporting Hubs',
    description: 'Core funders: FCSS, FRN, WD, PHAC, ECALA, EmpowerU',
    color: 'bg-cyan-100 text-cyan-700',
    fn: () => base44.entities.FunderReportingHub.list('name'),
  },
  {
    key: 'OrganizationInfo',
    label: 'Organization Info',
    description: 'Charitable number and org details',
    color: 'bg-gray-100 text-gray-700',
    fn: () => base44.entities.OrganizationInfo.list(),
  },
  {
    key: 'Report',
    label: 'Reports',
    description: 'Report records with due dates and status',
    color: 'bg-pink-100 text-pink-700',
    fn: () => base44.entities.Report.list('-due_date'),
    note: '⚠️ project_id must match the new Project IDs after import.',
  },
];

function ExportRow({ item, index }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [count, setCount] = useState(null);

  const handleDownload = async () => {
    setStatus('loading');
    try {
      const records = await item.fn();
      const cleaned = records.map(r => {
        const d = r.data || r;
        // Remove internal fields
        const { id, created_date, updated_date, created_by_id, created_by,
          entity_name, app_id, is_sample, is_deleted, deleted_date, environment, data, ...rest } = r;
        return d;
      });
      setCount(cleaned.length);
      const json = JSON.stringify(cleaned, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candora_export_${item.key}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 border rounded-xl bg-card hover:shadow-sm transition-shadow">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{item.label}</span>
          <Badge className={`text-xs ${item.color}`}>{item.key}</Badge>
          {count !== null && (
            <span className="text-xs text-muted-foreground font-mono">{count} records</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
        {item.note && (
          <p className="text-xs mt-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            {item.note}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant={status === 'done' ? 'outline' : 'default'}
        className="flex-shrink-0 gap-1.5"
        onClick={handleDownload}
        disabled={status === 'loading'}
      >
        {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
        {status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
        {status === 'idle' && <Download className="w-3.5 h-3.5" />}
        {status === 'loading' ? 'Exporting…' : status === 'done' ? 'Downloaded' : status === 'error' ? 'Error' : 'Export JSON'}
      </Button>
    </div>
  );
}

export default function DataExport() {
  const [exportingAll, setExportingAll] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const handleExportAll = async () => {
    setExportingAll(true);
    const allData = {};
    for (const item of EXPORTS) {
      try {
        const records = await item.fn();
        allData[item.key] = records.map(r => r.data || r);
      } catch (e) {
        allData[item.key] = { error: e.message };
      }
    }
    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candora_FULL_EXPORT_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportingAll(false);
    setAllDone(true);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Data Export</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Download all your data as JSON files for bulk import into the new app.
        </p>
      </div>

      {/* Export All button */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Export Everything at Once</p>
              <p className="text-sm text-muted-foreground">Downloads a single JSON file containing all entities — easiest option for a full migration.</p>
            </div>
            <Button
              className="gap-2 flex-shrink-0"
              onClick={handleExportAll}
              disabled={exportingAll}
              variant={allDone ? 'outline' : 'default'}
            >
              {exportingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : allDone ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Download className="w-4 h-4" />}
              {exportingAll ? 'Exporting…' : allDone ? 'Downloaded!' : 'Export All'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual exports */}
      <div>
        <h2 className="font-heading font-semibold text-base mb-3">Export by Entity</h2>
        <div className="space-y-3">
          {EXPORTS.map((item, i) => (
            <ExportRow key={item.key} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* Import Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            Bulk Import Instructions for the New App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">

          <div>
            <p className="font-semibold mb-1">Step 1 — Import in this exact order</p>
            <p className="text-muted-foreground text-xs mb-2">Parent records must exist before child records that reference them.</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
              <li><span className="font-medium text-foreground">OrganizationInfo</span> — no dependencies</li>
              <li><span className="font-medium text-foreground">ProjectGroup</span> — no dependencies</li>
              <li><span className="font-medium text-foreground">FundingSource</span> — no dependencies (clear parent_id &amp; linked_project_id first)</li>
              <li><span className="font-medium text-foreground">FundingStream</span> — depends on FundingSource (re-map source_id)</li>
              <li><span className="font-medium text-foreground">FunderReportingHub</span> — no dependencies</li>
              <li><span className="font-medium text-foreground">Project</span> — depends on ProjectGroup (re-map group_id)</li>
              <li><span className="font-medium text-foreground">ProposalSection</span> — depends on Project (re-map project_id)</li>
              <li><span className="font-medium text-foreground">ProjectNote</span> — depends on Project (re-map project_id)</li>
              <li><span className="font-medium text-foreground">ProjectDocument</span> — depends on Project (re-map project_id)</li>
              <li><span className="font-medium text-foreground">SubmissionDocument</span> — depends on Project (re-map project_id)</li>
              <li><span className="font-medium text-foreground">Report</span> — depends on Project (re-map project_id)</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold mb-1">Step 2 — How to import in the new app</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
              <li>Go to the new app's Base44 dashboard → <strong>Data</strong> tab</li>
              <li>Select the entity (e.g. "Project")</li>
              <li>Click <strong>Import</strong> → upload the JSON file for that entity</li>
              <li>The importer accepts a JSON array of objects — each object is one record</li>
              <li>Repeat for each entity in the order above</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold mb-1">Step 3 — Re-map ID references</p>
            <p className="text-xs text-muted-foreground mb-1">
              After importing parent entities, the new app assigns new IDs. You'll need to update child records to use the new IDs before importing them. Fields to update:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
              <li><strong>Project.group_id</strong> → new ProjectGroup ID</li>
              <li><strong>FundingStream.source_id</strong> → new FundingSource ID</li>
              <li><strong>FundingSource.parent_id</strong> → new FundingSource ID (or clear it)</li>
              <li><strong>ProposalSection.project_id</strong> → new Project ID</li>
              <li><strong>ProjectNote.project_id</strong> → new Project ID</li>
              <li><strong>ProjectDocument.project_id</strong> → new Project ID</li>
              <li><strong>SubmissionDocument.project_id</strong> → new Project ID</li>
              <li><strong>Report.project_id</strong> → new Project ID</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">Step 4 — File URLs</p>
            <p className="text-xs text-muted-foreground">
              All <strong>file_url</strong> fields in SubmissionDocument and ProjectDocument that contain a real URL (not "auto-filed") are <strong>public URLs hosted by Base44</strong> and will continue to work in the new app — no re-uploading needed. Records with <code className="bg-muted px-1 rounded">file_url = "auto-filed"</code> are placeholder markers only and have no actual file.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-semibold text-amber-800 text-xs mb-1">⚠️ Important: FundingSource linked_project_id</p>
            <p className="text-xs text-amber-700">
              Many FundingSource records have a <code>linked_project_id</code> that was auto-generated when projects were synced. Before importing, open the FundingSource JSON and either clear all <code>linked_project_id</code> values to <code>null</code>, or re-map them to the new Project IDs after projects are imported.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}