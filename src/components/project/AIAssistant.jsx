import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';

export default function AIAssistant({ project, documents, notes }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const guidelineDocs = documents.filter(d => ['funder_guidelines', 'proposal_template'].includes(d.category));
  const extractedContent = [
    ...guidelineDocs.map(d => d.extracted_text).filter(Boolean),
    ...notes.map(n => n.content || n.extracted_text).filter(Boolean),
  ].join('\n\n---\n\n');

  const suggestedQuestions = [
    'What are the key eligibility requirements?',
    'What sections are required in this proposal?',
    'What is the maximum award amount?',
    'What are the evaluation criteria?',
    'What supporting documents are needed?',
  ];

  const handleAsk = async (q) => {
    const userQ = q || question;
    if (!userQ.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setQuestion('');
    setLoading(true);

    const context = extractedContent
      ? `You are an expert grant writer assistant. Use the following extracted document content to answer questions:\n\n${extractedContent.slice(0, 8000)}`
      : `You are an expert grant writer assistant for the project "${project.title}" funded by "${project.funder_name}".`;

    const fileUrls = guidelineDocs.filter(d => d.file_url && !d.extracted_text).map(d => d.file_url);

    const answer = await base44.integrations.Core.InvokeLLM({
      prompt: `${context}\n\nUser question: ${userQ}\n\nProvide a clear, specific, helpful answer.`,
      file_urls: fileUrls.length > 0 ? fileUrls.slice(0, 3) : undefined,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Context indicator */}
      <Card className="border-none shadow-sm bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            {guidelineDocs.length > 0
              ? `AI has access to ${guidelineDocs.length} funder document(s) and ${notes.length} note(s) for this project.`
              : 'Upload funder guidelines to get more accurate answers.'}
          </p>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map(q => (
              <button
                key={q}
                onClick={() => handleAsk(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary border border-border transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question about the proposal requirements..."
          rows={2}
          className="resize-none"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
        />
        <Button onClick={() => handleAsk()} disabled={loading || !question.trim()} className="self-end">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}