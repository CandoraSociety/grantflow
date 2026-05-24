import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function FundingDatabaseChat() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm MoneyMan 💰 I can research government programs, foundations, and corporate funders and add them to your Funding Database — organized by source and funding stream.\n\nTry asking me:\n- *\"Find Alberta government funding for employment programs\"*\n- *\"Add federal funding streams for non-profits\"*\n- *\"Research foundations in Calgary that fund housing\"*"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const [existingSources, existingStreams] = await Promise.all([
      base44.entities.FundingSource.list('name', 50).catch(() => []),
      base44.entities.FundingStream.list('name', 50).catch(() => []),
    ]);

    const sourcesSummary = existingSources.map(s => `${s.name} (${s.source_type})`).join(', ') || 'none';
    const streamsSummary = existingStreams.map(s => s.name).join(', ') || 'none';

    const systemPrompt = `You are MoneyMan, a funding intelligence expert specializing in grants, government programs, foundations, and corporate giving.

Current funding database:
- Sources: ${sourcesSummary}
- Streams: ${streamsSummary}

Your job: Research and add funding opportunities to the database using the FundingSource and FundingStream entities.

STRUCTURE:
- FundingSource = the organization or government body (e.g., "Government of Alberta", "Alberta Ministry of Jobs, Economy and Trade", "Calgary Foundation")
- FundingStream = a specific funding program within that source (e.g., "Community Initiatives Program", "Summer Temporary Employment Program")

For government funders, create a hierarchy:
1. Create the top-level government body (e.g., "Government of Alberta", type: government_body, government_level: provincial)
2. Create the ministry as a child (type: ministry, parent_id = the body's id)
3. Create specific funding streams under the ministry

For each funding stream include: name, purpose, eligibility, award amounts, deadlines, application URL if known, focus areas.

When you add records to the database, confirm what you've added and give a summary. Use web search to find current, accurate information.

If asked about what's already in the database, summarize what you see above.`;

    const answer = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser request: ${userMsg}`,
      add_context_from_internet: true,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ['fundingSources'] });
    queryClient.invalidateQueries({ queryKey: ['fundingStreams'] });
  };

  return (
    <Card className="border-2 border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-heading">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          MoneyMan — Funding Database Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              }`}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                ) : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="bg-secondary rounded-xl px-4 py-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask MoneyMan to research and populate the funding database..."
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <Button type="button" onClick={handleSend} disabled={loading || !input.trim()}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}