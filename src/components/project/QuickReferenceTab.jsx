import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function QuickReferenceTab({ user }) {
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  const { data: orgInfo, isLoading } = useQuery({
    queryKey: ['orgInfo'],
    queryFn: async () => {
      const items = await base44.entities.OrganizationInfo.list();
      return items[0] || {};
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      if (orgInfo?.id) {
        return base44.entities.OrganizationInfo.update(orgInfo.id, data);
      } else {
        return base44.entities.OrganizationInfo.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgInfo'] });
      setEditMode(false);
      toast.success('Organization info updated');
    },
  });

  const handleEdit = () => {
    setFormData(orgInfo);
    setEditMode(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCopy = (value, fieldName) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const fields = [
    { key: 'charitable_number', label: 'Charitable Number', type: 'text' },
    { key: 'corporate_number', label: 'Corporate Number', type: 'text' },
    { key: 'business_number', label: 'Business Number (GST/HST)', type: 'text' },
    { key: 'legal_name', label: 'Legal Organization Name', type: 'text' },
    { key: 'incorporation_date', label: 'Incorporation Date', type: 'date' },
    { key: 'fiscal_year_end', label: 'Fiscal Year End', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-semibold">Organization Quick Reference</h2>
        {isAdmin && (
          <Button
            variant={editMode ? 'default' : 'outline'}
            onClick={editMode ? handleSave : handleEdit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {editMode ? 'Save' : 'Edit'}
          </Button>
        )}
      </div>

      {editMode && isAdmin ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {fields.map(field => (
              <div key={field.key} className="space-y-2">
                <Label className="text-sm">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    rows={3}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(field => {
            const value = orgInfo?.[field.key];
            return (
              <Card key={field.key} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {value ? (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground break-all font-mono">{value}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handleCopy(value, field.key)}
                      >
                        {copiedField === field.key ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not set</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}