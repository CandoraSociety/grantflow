import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, ExternalLink, Search, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Submissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-submitted'],
    queryFn: () => base44.entities.Project.list('-created_date').then(all =>
      all.filter(p => ['submitted', 'awarded', 'declined', 'reporting'].includes(p.status))
    ),
  });

  const { data: submissionDocs = [] } = useQuery({
    queryKey: ['submissionDocs-all'],
    queryFn: async () => {
      const allDocs = [];
      for (const proj of projects) {
        const docs = await base44.entities.SubmissionDocument.filter({ project_id: proj.id });
        allDocs.push(...docs);
      }
      return allDocs;
    },
    enabled: projects.length > 0,
  });

  // Calculate years and months from projects
  const years = useMemo(() => {
    const uniqueYears = new Set(
      projects.map(p => new Date(p.created_date).getFullYear())
    );
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [projects]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const projectYear = new Date(p.created_date).getFullYear();
      const projectMonth = new Date(p.created_date).getMonth();
      
      if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase()) && !p.funder_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedYear && projectYear !== parseInt(selectedYear)) return false;
      if (selectedMonth && projectMonth !== parseInt(selectedMonth)) return false;
      if (selectedCategory && p.proposal_category !== selectedCategory) return false;
      return true;
    });
  }, [projects, searchTerm, selectedYear, selectedMonth, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-heading font-bold">Submissions Archive</h1>
        <p className="text-muted-foreground">Browse all submitted and awarded proposals</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by project name or funder..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Years</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Months</SelectItem>
            {months.map((month, idx) => (
              <SelectItem key={idx} value={idx.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Categories</SelectItem>
            <SelectItem value="core_funder">Core Funder</SelectItem>
            <SelectItem value="social_enterprise">Social Enterprise</SelectItem>
            <SelectItem value="new_programs">New Programs</SelectItem>
            <SelectItem value="program_expansions">Program Expansions</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results grouped by decision */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <p className="text-sm">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { key: 'pending', label: 'Pending Decision', statuses: ['submitted'], badgeClass: 'bg-primary/10 text-primary' },
            { key: 'awarded', label: 'Awarded', statuses: ['awarded', 'reporting'], badgeClass: 'bg-accent/20 text-accent' },
            { key: 'rejected', label: 'Rejected', statuses: ['declined'], badgeClass: 'bg-destructive/10 text-destructive' },
          ].map(group => {
            const groupProjects = filteredProjects.filter(p => group.statuses.includes(p.status));
            if (groupProjects.length === 0) return null;
            return (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-heading font-semibold text-base">{group.label}</h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${group.badgeClass}`}>
                    {groupProjects.length}
                  </span>
                </div>
                <div className="grid gap-4">
                  {groupProjects.map(project => {
                    const projectDocs = submissionDocs.filter(d => d.project_id === project.id);
                    return (
                      <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg">{project.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-sm text-muted-foreground">{project.funder_name}</span>
                                {project.proposal_category && (
                                  <Badge variant="outline" className="text-xs">
                                    {project.proposal_category.replace(/_/g, ' ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(project.created_date), 'MMM d, yyyy')}
                              </p>
                              {project.award_amount && (
                                <p className="font-semibold text-accent mt-1">
                                  ${project.award_amount.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {projectDocs.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground mb-3">
                                {projectDocs.length} Document{projectDocs.length !== 1 ? 's' : ''}
                              </p>
                              <div className="grid gap-2">
                                {projectDocs.slice(0, 3).map(doc => (
                                  <div key={doc.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate text-xs">{doc.file_name}</span>
                                    </div>
                                    {doc.file_url && doc.file_url !== 'auto-filed' && (
                                      <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" asChild>
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                {projectDocs.length > 3 && (
                                  <p className="text-xs text-muted-foreground pl-2">+{projectDocs.length - 3} more</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No documents on file</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}