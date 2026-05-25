import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Database, Bot, Upload, TrendingUp } from 'lucide-react';
import FundingSourceBlock from '@/components/funding/FundingSourceBlock';
import FundingSourceForm from '@/components/funding/FundingSourceForm';
import FundingDatabaseChat from '@/components/funding/FundingDatabaseChat';
import FundingCSVImport from '@/components/funding/FundingCSVImport';
import FundingPipelineKanban from '@/components/funding/FundingPipelineKanban';

export default function FundingDatabase() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddSource, setShowAddSource] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [activeTab, setActiveTab] = useState('database');

  const { data: sources = [] } = useQuery({
    queryKey: ['fundingSources'],
    queryFn: () => base44.entities.FundingSource.list('name'),
  });

  const { data: streams = [] } = useQuery({
    queryKey: ['fundingStreams'],
    queryFn: () => base44.entities.FundingStream.list('name'),
  });

  // Build hierarchy: sources with parent_id become children of their parent
  const tree = useMemo(() => {
    const sourceMap = {};
    sources.forEach(s => { sourceMap[s.id] = { source: s, streams: [], children: [] }; });
    streams.forEach(stream => {
      if (sourceMap[stream.source_id]) {
        sourceMap[stream.source_id].streams.push(stream);
      }
    });

    const roots = [];
    sources.forEach(s => {
      if (s.parent_id && sourceMap[s.parent_id]) {
        sourceMap[s.parent_id].children.push(sourceMap[s.id]);
      } else {
        roots.push(sourceMap[s.id]);
      }
    });

    return roots;
  }, [sources, streams]);

  // Filter
  const filtered = useMemo(() => {
    if (!search && filterType === 'all') return tree;
    const q = search.toLowerCase();
    return tree.filter(node => {
      const matchesType = filterType === 'all' || node.source.source_type === filterType || node.source.government_level === filterType;
      if (!q) return matchesType;
      const matchesSearch =
        node.source.name.toLowerCase().includes(q) ||
        node.source.description?.toLowerCase().includes(q) ||
        node.streams.some(s => s.name.toLowerCase().includes(q) || s.purpose?.toLowerCase().includes(q)) ||
        node.children.some(c =>
          c.source.name.toLowerCase().includes(q) ||
          c.streams.some(s => s.name.toLowerCase().includes(q))
        );
      return matchesType && matchesSearch;
    });
  }, [tree, search, filterType]);

  const stats = {
    sources: sources.length,
    streams: streams.length,
    active: streams.filter(s => s.status === 'active').length,
    strongFit: streams.filter(s => s.fit_score >= 4).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Funding Database</h1>
          <p className="text-muted-foreground text-sm mt-1">Government programs, foundations, and corporate funders organized hierarchically</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setActiveTab('chat')}>
            <Bot className="w-4 h-4 text-primary" />
            Ask MoneyMan
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowCSVImport(true)}>
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button className="gap-2" onClick={() => setShowAddSource(true)}>
            <Plus className="w-4 h-4" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Funding Sources', value: stats.sources },
          { label: 'Funding Streams', value: stats.streams },
          { label: 'Active Streams', value: stats.active },
          { label: 'Strong Fit', value: stats.strongFit },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-heading font-bold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="database" className="gap-1.5">
            <Database className="w-4 h-4" /> Database
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5">
            <TrendingUp className="w-4 h-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <Bot className="w-4 h-4" /> MoneyMan
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'database' && (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search funders, programs, focus areas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[
                { value: 'all', label: 'All' },
                { value: 'federal', label: 'Federal' },
                { value: 'provincial', label: 'Provincial' },
                { value: 'municipal', label: 'Municipal' },
                { value: 'foundation', label: 'Foundations' },
                { value: 'corporate', label: 'Corporate' },
              ].map(opt => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={filterType === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => setFilterType(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tree view */}
          {filtered.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-12 text-center">
                <Database className="w-10 h-10 mx-auto mb-3 text-primary opacity-40" />
                <p className="text-sm text-muted-foreground mb-1">
                  {search ? 'No results found.' : 'No funding sources yet.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Add a source manually, or ask MoneyMan to populate the database.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(node => (
                <FundingSourceBlock
                  key={node.source.id}
                  source={node.source}
                  streams={node.streams}
                  children={node.children}
                  depth={0}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'pipeline' && <FundingPipelineKanban sources={sources} />}

      {activeTab === 'chat' && <FundingDatabaseChat />}

      {showAddSource && <FundingSourceForm onClose={() => setShowAddSource(false)} />}
      {showCSVImport && <FundingCSVImport onClose={() => setShowCSVImport(false)} />}
    </div>
  );
}