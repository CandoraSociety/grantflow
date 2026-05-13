import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    funder_name: '',
    funder_type: '',
    description: '',
    submission_deadline: '',
    award_amount: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${created.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      award_amount: form.award_amount ? Number(form.award_amount) : undefined,
      status: 'research',
      progress_percentage: 0,
    };
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Community Health Initiative Grant"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funder Name *</Label>
                <Input
                  value={form.funder_name}
                  onChange={(e) => setForm({ ...form, funder_name: e.target.value })}
                  placeholder="e.g., National Science Foundation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Funder Type</Label>
                <Select value={form.funder_type} onValueChange={(v) => setForm({ ...form, funder_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Submission Deadline</Label>
                <Input
                  type="datetime-local"
                  value={form.submission_deadline}
                  onChange={(e) => setForm({ ...form, submission_deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Requested Amount ($)</Label>
                <Input
                  type="number"
                  value={form.award_amount}
                  onChange={(e) => setForm({ ...form, award_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the project..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}