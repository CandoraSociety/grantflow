import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FolderOpen, Tag, X, ArrowUpDown, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectsList from '@/components/dashboard/ProjectsList';
import GroupManagerModal from '@/components/projects/GroupManagerModal';
import AssignGroupModal from '@/components/projects/AssignGroupModal';

export default function Projects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [sortBy, setSortBy] = useState('updated_desc');
  const [groupedView, setGroupedView] = useState(true);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [assigningProject, setAssigningProject] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date'),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['projectGroups'],
    queryFn: () => base44.entities.ProjectGroup.list('name'),
  });

  // Collect all unique tags
  const allTags = [...new Set(projects.flatMap(p => p.tags || []))].sort();

  const sortProjects = (list) => {
    const sorted = [...list];
    switch (sortBy) {
      case 'updated_desc': return sorted.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
      case 'updated_asc': return sorted.sort((a, b) => new Date(a.updated_date) - new Date(b.updated_date));
      case 'created_desc': return sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      case 'created_asc': return sorted.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      case 'alpha_asc': return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'alpha_desc': return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'deadline_asc': return sorted.sort((a, b) => new Date(a.submission_deadline || '9999') - new Date(b.submission_deadline || '9999'));
      case 'amount_desc': return sorted.sort((a, b) => (b.award_amount || 0) - (a.award_amount || 0));
      default: return sorted;
    }
  };

  const filtered = sortProjects(projects.filter(p => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.funder_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesGroup = !groupFilter || p.group_id === groupFilter;
    const matchesTag = !tagFilter || (p.tags || []).includes(tagFilter);
    return matchesSearch && matchesStatus && matchesGroup && matchesTag;
  }));

  const showGroups = groupedView && groups.length > 0;

  const getGroupedProjects = () => {
    const ungrouped = filtered.filter(p => !p.group_id);
    const grouped = groups.map(g => ({
      group: g,
      projects: filtered.filter(p => p.group_id === g.id),
    })).filter(g => g.projects.length > 0);

    return { grouped, ungrouped };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all your grant proposals and submissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowGroupManager(true)}>
            <FolderOpen className="w-4 h-4" /> Manage Groups
          </Button>
          <Link to="/projects/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> New Proposal
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-52 gap-2 bg-card">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Recently Updated</SelectItem>
              <SelectItem value="updated_asc">Oldest Updated</SelectItem>
              <SelectItem value="created_desc">Newest Created</SelectItem>
              <SelectItem value="created_asc">Oldest Created</SelectItem>
              <SelectItem value="alpha_asc">A → Z</SelectItem>
              <SelectItem value="alpha_desc">Z → A</SelectItem>
              <SelectItem value="deadline_asc">Deadline (Soonest)</SelectItem>
              <SelectItem value="amount_desc">Amount (Highest)</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setGroupedView(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-sm font-medium border transition-all ${groupedView ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Group by Category
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="bg-card">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="drafting">Drafting</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="awarded">Awarded</TabsTrigger>
              <TabsTrigger value="declined">Declined</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Group & Tag filter chips */}
        <div className="flex flex-wrap gap-2 items-center">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setGroupFilter(groupFilter === g.id ? null : g.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${groupFilter === g.id ? 'text-white border-transparent' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
              style={groupFilter === g.id ? { backgroundColor: g.color || '#6366f1', borderColor: g.color || '#6366f1' } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color || '#6366f1' }} />
              {g.name}
              {groupFilter === g.id && <X className="w-3 h-3" />}
            </button>
          ))}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${tagFilter === tag ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
            >
              <Tag className="w-3 h-3" />
              {tag}
              {tagFilter === tag && <X className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Projects list — grouped or flat */}
      {showGroups ? (
        <div className="space-y-8">
          {getGroupedProjects().grouped.map(({ group, projects: gProjects }) => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color || '#6366f1' }} />
                <h2 className="font-heading font-semibold text-base">{group.name}</h2>
                {group.description && <span className="text-xs text-muted-foreground">— {group.description}</span>}
                <Badge variant="secondary" className="text-xs">{gProjects.length}</Badge>
              </div>
              <ProjectsList projects={gProjects} onOrganize={setAssigningProject} />
            </div>
          ))}
          {getGroupedProjects().ungrouped.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                <h2 className="font-heading font-semibold text-base text-muted-foreground">Ungrouped</h2>
                <Badge variant="secondary" className="text-xs">{getGroupedProjects().ungrouped.length}</Badge>
              </div>
              <ProjectsList projects={getGroupedProjects().ungrouped} onOrganize={setAssigningProject} />
            </div>
          )}
        </div>
      ) : (
        <ProjectsList projects={filtered} onOrganize={setAssigningProject} />
      )}

      <GroupManagerModal open={showGroupManager} onClose={() => setShowGroupManager(false)} />
      {assigningProject && (
        <AssignGroupModal
          open={!!assigningProject}
          onClose={() => setAssigningProject(null)}
          project={assigningProject}
        />
      )}
    </div>
  );
}