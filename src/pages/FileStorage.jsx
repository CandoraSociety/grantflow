import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileText, Search, ExternalLink, Filter } from 'lucide-react';

const CATEGORY_LABELS = {
  funder_guidelines: 'Funder Guidelines',
  proposal_template: 'Proposal Template',
  budget_template: 'Budget Template',
  support_letter: 'Support Letter',
  audit_statement: 'Audit Statement',
  insurance_proof: 'Insurance Proof',
  organizational_docs: 'Org Docs',
  reporting_template: 'Reporting Template',
  submitted_report: 'Submitted Report',
  other: 'Other',
};

const AGREEMENT_CATEGORIES = ['funder_guidelines', 'organizational_docs', 'support_letter', 'audit_statement', 'insurance_proof'];
const REPORT_CATEGORIES = ['submitted_report', 'reporting_template'];

const CATEGORY_COLORS = {
  funder_guidelines: 'bg-amber-100 text-amber-700',
  proposal_template: 'bg-blue-100 text-blue-700',
  budget_template: 'bg-green-100 text-green-700',
  support_letter: 'bg-purple-100 text-purple-700',
  audit_statement: 'bg-orange-100 text-orange-700',
  insurance_proof: 'bg-pink-100 text-pink-700',
  organizational_docs: 'bg-cyan-100 text-cyan-700',
  reporting_template: 'bg-indigo-100 text-indigo-700',
  submitted_report: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function FileStorage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'agreements' | 'reports'

  const { data: documents = [] } = useQuery({
    queryKey: ['project-documents'],
    queryFn: () => base44.entities.ProjectDocument.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date'),
  });

  const { data: reportFiles = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-due_date'),
  });

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

  // Combine project docs + submitted reports (those with file_url)
  const allFiles = [
    ...documents.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category || 'other',
      file_url: d.file_url,
      project_id: d.project_id,
      notes: d.notes,
      created_date: d.created_date,
      source: 'document',
    })),
    ...reportFiles
      .filter(r => r.file_url)
      .map(r => ({
        id: `report-${r.id}`,
        name: r.title,
        category: 'submitted_report',
        file_url: r.file_url,
        project_id: r.project_id,
        notes: r.notes,
        created_date: r.submitted_date || r.created_date,
        source: 'report',
      })),
  ];

  const filtered = allFiles.filter(f => {
    const matchesSearch =
      !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      projectMap[f.project_id]?.title?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'agreements' && AGREEMENT_CATEGORIES.includes(f.category)) ||
      (activeFilter === 'reports' && REPORT_CATEGORIES.includes(f.category));

    return matchesSearch && matchesFilter;
  });

  const agreementCount = allFiles.filter(f => AGREEMENT_CATEGORIES.includes(f.category)).length;
  const reportCount = allFiles.filter(f => REPORT_CATEGORIES.includes(f.category)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">File Storage</h1>
        <p className="text-muted-foreground text-sm mt-1">Funder agreements, past reports, and project documents</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`text-left rounded-xl border p-4 transition-all hover:shadow-md ${activeFilter === 'all' ? 'border-primary bg-primary/5' : 'bg-card'}`}
        >
          <p className="text-xs text-muted-foreground mb-1">All Files</p>
          <p className="text-2xl font-bold">{allFiles.length}</p>
        </button>
        <button
          onClick={() => setActiveFilter('agreements')}
          className={`text-left rounded-xl border p-4 transition-all hover:shadow-md ${activeFilter === 'agreements' ? 'border-amber-500 bg-amber-50' : 'bg-card'}`}
        >
          <p className="text-xs text-muted-foreground mb-1">Agreements & Org Docs</p>
          <p className="text-2xl font-bold text-amber-600">{agreementCount}</p>
        </button>
        <button
          onClick={() => setActiveFilter('reports')}
          className={`text-left rounded-xl border p-4 transition-all hover:shadow-md ${activeFilter === 'reports' ? 'border-teal-500 bg-teal-50' : 'bg-card'}`}
        >
          <p className="text-xs text-muted-foreground mb-1">Submitted Reports</p>
          <p className="text-2xl font-bold text-teal-600">{reportCount}</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by file name or project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No files found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(file => {
            const project = projectMap[file.project_id];
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 bg-card border rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  {project && (
                    <p className="text-xs text-muted-foreground truncate">{project.title}</p>
                  )}
                </div>
                <Badge className={`text-xs shrink-0 ${CATEGORY_COLORS[file.category] || CATEGORY_COLORS.other}`}>
                  {CATEGORY_LABELS[file.category] || file.category}
                </Badge>
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}