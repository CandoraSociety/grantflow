import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsRow from '@/components/dashboard/StatsRow';
import ProjectsList from '@/components/dashboard/ProjectsList';
import ReportCalendar from '@/components/dashboard/ReportCalendar';
import UpcomingReports from '@/components/dashboard/UpcomingReports';

export default function Dashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date'),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-due_date'),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your grants and proposals</p>
        </div>
        <Link to="/projects/new">
          <Button className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      <StatsRow projects={projects} reports={reports} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-base">Recent Projects</h2>
              <Link to="/projects" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </div>
            <ProjectsList projects={projects} limit={5} />
          </div>
          <ReportCalendar reports={reports} projects={projects} />
        </div>
        <div>
          <UpcomingReports reports={reports} projects={projects} />
        </div>
      </div>
    </div>
  );
}