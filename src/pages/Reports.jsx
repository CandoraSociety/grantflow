import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ReportCalendar from '@/components/dashboard/ReportCalendar';
import HubPanel from '@/components/reports/HubPanel';
import AddHubModal from '@/components/reports/AddHubModal';

export default function Reports() {
  const [addingType, setAddingType] = useState(null); // 'core_funder' | 'grant' | null

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('due_date'),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.ProjectMilestone.list(),
  });

  const { data: hubs = [] } = useQuery({
    queryKey: ['funder-hubs'],
    queryFn: () => base44.entities.FunderReportingHub.list('name'),
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['funder-docs'],
    queryFn: () => base44.entities.FunderReportingDoc.list('-created_date'),
  });

  const { data: hubDeadlines = [] } = useQuery({
    queryKey: ['funder-deadlines'],
    queryFn: () => base44.entities.FunderReportingDeadline.list('due_date'),
  });

  const coreFunders = hubs.filter(h => h.hub_type === 'core_funder');
  const grants = hubs.filter(h => h.hub_type === 'grant');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage reporting requirements across all funders and grants</p>
      </div>

      <ReportCalendar
        reports={reports}
        projects={projects}
        milestones={milestones}
        hubDeadlines={hubDeadlines}
      />

      <Tabs defaultValue="core_funders">
        <TabsList className="bg-card">
          <TabsTrigger value="core_funders">Ongoing / Core Funders</TabsTrigger>
          <TabsTrigger value="grants">Grants</TabsTrigger>
        </TabsList>

        <TabsContent value="core_funders" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setAddingType('core_funder')}>
              <Plus className="w-4 h-4 mr-2" /> Add Core Funder
            </Button>
          </div>
          {coreFunders.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-10 bg-card rounded-xl border-none shadow-sm">
              No core funders added yet. Click "Add Core Funder" to get started.
            </div>
          )}
          {coreFunders.map(hub => (
            <HubPanel key={hub.id} hub={hub} docs={docs} deadlines={hubDeadlines} />
          ))}
        </TabsContent>

        <TabsContent value="grants" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setAddingType('grant')}>
              <Plus className="w-4 h-4 mr-2" /> Add Grant
            </Button>
          </div>
          {grants.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-10 bg-card rounded-xl border-none shadow-sm">
              No grants added yet. Click "Add Grant" to get started.
            </div>
          )}
          {grants.map(hub => (
            <HubPanel key={hub.id} hub={hub} docs={docs} deadlines={hubDeadlines} />
          ))}
        </TabsContent>
      </Tabs>

      <AddHubModal
        open={!!addingType}
        onClose={() => setAddingType(null)}
        hubType={addingType}
      />
    </div>
  );
}