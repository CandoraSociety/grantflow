import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Globe, Mail, Phone, Star, ArrowRight, Bot, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import FunderForm from '@/components/funders/FunderForm';
import FunderKanban from '@/components/funders/FunderKanban';

const PIPELINE_COLORS = {
  prospect: 'bg-secondary text-secondary-foreground',
  researching: 'bg-primary/10 text-primary',
  relationship_building: 'bg-chart-4/20 text-chart-4',
  ready_to_apply: 'bg-accent/20 text-accent',
  applied: 'bg-accent/30 text-accent',
  awarded: 'bg-accent/40 text-accent font-semibold',
  declined: 'bg-destructive/10 text-destructive',
  not_a_fit: 'bg-secondary text-muted-foreground',
};

const TYPE_COLORS = {
  federal: 'bg-primary/10 text-primary',
  state: 'bg-primary/15 text-primary',
  local: 'bg-secondary text-secondary-foreground',
  foundation: 'bg-accent/10 text-accent',
  corporate: 'bg-chart-4/20 text-chart-4',
  individual: 'bg-chart-3/20 text-foreground',
  other: 'bg-secondary text-muted-foreground',
};

function ScoreDots({ score, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${i < score ? 'bg-primary' : 'bg-border'}`} />
      ))}
    </div>
  );
}

export default function Funders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingFunder, setEditingFunder] = useState(null);

  const { data: funders = [] } = useQuery({
    queryKey: ['funders'],
    queryFn: () => base44.entities.PotentialFunder.list('-updated_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PotentialFunder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funders'] }),
  });

  const filtered = funders.filter(f =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.focus_areas?.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
    f.type?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: funders.length,
    readyToApply: funders.filter(f => f.pipeline_status === 'ready_to_apply').length,
    awarded: funders.filter(f => f.pipeline_status === 'awarded').length,
    upcoming: funders.filter(f => f.next_deadline).length,
  };

  const handleEdit = (funder) => { setEditingFunder(funder); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingFunder(null); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Funder Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage prospects and track relationships with funders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <a href="#moneyman">
              <Bot className="w-4 h-4 text-primary" />
              Ask MoneyMan
            </a>
          </Button>
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Add Funder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Funders', value: stats.total, icon: TrendingUp },
          { label: 'Ready to Apply', value: stats.readyToApply, icon: Star },
          { label: 'Awarded', value: stats.awarded, icon: Star },
          { label: 'With Deadlines', value: stats.upcoming, icon: Star },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-heading font-bold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search funders, focus areas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="bg-card">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="kanban">Pipeline</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Form */}
      {showForm && (
        <FunderForm funder={editingFunder} onClose={handleCloseForm} />
      )}

      {/* Views */}
      {view === 'kanban' ? (
        <FunderKanban funders={filtered} onEdit={handleEdit} />
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="border-none shadow-sm">
              <CardContent className="p-12 text-center">
                <Bot className="w-10 h-10 mx-auto mb-3 text-primary opacity-40" />
                <p className="text-sm text-muted-foreground mb-1">No funders yet</p>
                <p className="text-xs text-muted-foreground">Ask MoneyMan to research funders, or add one manually.</p>
              </CardContent>
            </Card>
          )}
          {filtered.map(funder => (
            <Card key={funder.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-semibold text-sm">{funder.name}</h3>
                      <Badge variant="secondary" className={cn('text-xs', PIPELINE_COLORS[funder.pipeline_status])}>
                        {funder.pipeline_status?.replace(/_/g, ' ')}
                      </Badge>
                      {funder.type && (
                        <Badge variant="secondary" className={cn('text-xs', TYPE_COLORS[funder.type])}>
                          {funder.type}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {funder.typical_award_min && (
                        <span className="font-medium text-foreground">
                          ${funder.typical_award_min.toLocaleString()}
                          {funder.typical_award_max && ` – $${funder.typical_award_max.toLocaleString()}`}
                        </span>
                      )}
                      {funder.next_deadline && (
                        <span className="text-destructive font-medium">
                          Deadline: {format(new Date(funder.next_deadline), 'MMM d, yyyy')}
                        </span>
                      )}
                      {funder.application_cycle && <span>Cycle: {funder.application_cycle}</span>}
                    </div>

                    {funder.focus_areas?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {funder.focus_areas.map(a => (
                          <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{a}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2">
                      {funder.fit_score && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">Fit</span>
                          <ScoreDots score={funder.fit_score} />
                        </div>
                      )}
                      {funder.relationship_score && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">Relationship</span>
                          <ScoreDots score={funder.relationship_score} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {funder.website && (
                      <a href={funder.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Globe className="w-3.5 h-3.5" /></Button>
                      </a>
                    )}
                    {funder.contact_email && (
                      <a href={`mailto:${funder.contact_email}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="w-3.5 h-3.5" /></Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleEdit(funder)}>
                      Edit
                    </Button>
                    {funder.linked_project_id ? (
                      <Link to={`/projects/${funder.linked_project_id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                          <ArrowRight className="w-3 h-3" /> View Project
                        </Button>
                      </Link>
                    ) : funder.pipeline_status === 'ready_to_apply' && (
                      <Link to="/projects/new">
                        <Button size="sm" className="h-8 text-xs gap-1">
                          <Plus className="w-3 h-3" /> Start Proposal
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MoneyMan Chat */}
      <div id="moneyman">
        <MoneyManChat />
      </div>
    </div>
  );
}

function MoneyManChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm MoneyMan 💰 Tell me about your organization and what types of funding you're looking for, and I'll research funders and populate your pipeline." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const { data: existingFunders } = await base44.entities.PotentialFunder.list('-updated_date', 20).then(d => ({ data: d })).catch(() => ({ data: [] }));
    const funderList = existingFunders.map(f => `${f.name} (${f.pipeline_status})`).join(', ');

    const systemPrompt = `You are MoneyMan, a funding intelligence expert. You research grants, foundations, corporate donors, and funding opportunities.

Current funders in pipeline: ${funderList || 'none yet'}

When you find promising funders, use your tools to add them to the PotentialFunder database with all available details. Be thorough and specific. Always use web search to find current, accurate information about deadlines and award amounts.

If the user asks you to research funders, search the web and add them directly to the database. Confirm what you've added.`;

    const answer = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser: ${userMsg}`,
      add_context_from_internet: true,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ['funders'] });
  };

  return (
    <Card className="border-2 border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-heading">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          MoneyMan — Funding Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="bg-secondary rounded-xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask MoneyMan to research funders, check deadlines, update pipeline..."
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}