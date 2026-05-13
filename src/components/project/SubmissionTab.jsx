import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Trash2, FileText, ExternalLink, CheckSquare2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PRESET_DOCUMENTS = [
  { value: 'certificate_incorporation', label: 'Certificate of Incorporation' },
  { value: 'proof_insurance', label: 'Proof of Insurance' },
  { value: 'audited_statements', label: 'Audited Financial Statements' },
  { value: 'nonprofit_status', label: 'Nonprofit Status Verification' },
  { value: 'board_minutes', label: 'Recent Board Minutes' },
  { value: 'conflict_of_interest', label: 'Conflict of Interest Policy' },
  { value: 'financial_statements', label: 'Financial Statements' },
  { value: 'tax_returns', label: 'Tax Returns' },
  { value: 'w9_form', label: 'W-9 Form' },
];

export default function SubmissionTab({ projectId, project, submissionDocuments }) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [sectionHeading, setSectionHeading] = useState('');
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data) => base44.entities.SubmissionDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissionDocuments', projectId] });
      setUploadFile(null);
      setSectionHeading('');
      toast.success('Document uploaded');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SubmissionDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissionDocuments', projectId] });
      toast.success('Document removed');
    },
  });

  const handleUploadDocument = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }
    setUploading(true);
    const res = await base44.integrations.Core.UploadFile({ file: uploadFile });
    await createMutation.mutateAsync({
      project_id: projectId,
      file_url: res.file_url,
      file_name: uploadFile.name,
      section_heading: sectionHeading || null,
      preset_type: 'custom',
    });
    setUploading(false);
    setShowUpload(false);
  };

  const handleSelectPresets = async () => {
    for (const presetType of selectedPresets) {
      const preset = PRESET_DOCUMENTS.find(p => p.value === presetType);
      if (preset) {
        await createMutation.mutateAsync({
          project_id: projectId,
          file_url: null,
          file_name: preset.label,
          section_heading: null,
          preset_type: presetType,
          is_submitted: false,
        });
      }
    }
    setSelectedPresets([]);
    setActiveTab('upload');
    toast.success('Preset documents added');
  };

  // Group documents by section heading
  const groupedDocs = submissionDocuments.reduce((acc, doc) => {
    const heading = doc.section_heading || 'Other Documents';
    if (!acc[heading]) acc[heading] = [];
    acc[heading].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('upload')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-all',
            activeTab === 'upload'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Upload Documents
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-all',
            activeTab === 'presets'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Preset Documents
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload Form */}
          {showUpload && (
            <Card className="border border-primary/50 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-sm">Document File</Label>
                  <label className="cursor-pointer mt-2 block">
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <span>
                        <Upload className="w-4 h-4" />
                        {uploadFile ? uploadFile.name : 'Choose File'}
                      </span>
                    </Button>
                    <input type="file" className="hidden" onChange={e => setUploadFile(e.target.files[0])} />
                  </label>
                </div>
                <div>
                  <Label className="text-sm">Section Heading (optional)</Label>
                  <Input
                    placeholder="e.g., Corporate Documents, Financial Docs..."
                    value={sectionHeading}
                    onChange={e => setSectionHeading(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-2" onClick={handleUploadDocument} disabled={uploading}>
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Upload
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowUpload(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!showUpload && (
            <Button className="gap-2" onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          )}

          {/* Document List */}
          {submissionDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedDocs).map(([heading, docs]) => (
                <div key={heading} className="space-y-3">
                  <h3 className="font-semibold text-sm text-foreground">{heading}</h3>
                  <div className="space-y-2">
                    {docs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            {doc.preset_type && doc.preset_type !== 'custom' && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {PRESET_DOCUMENTS.find(p => p.value === doc.preset_type)?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {doc.file_url && doc.file_url !== 'auto-filed' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteMutation.mutate(doc.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'presets' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select common corporate documents to add to this submission:</p>
          <div className="space-y-2">
            {PRESET_DOCUMENTS.map(preset => (
              <label key={preset.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedPresets.includes(preset.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPresets([...selectedPresets, preset.value]);
                    } else {
                      setSelectedPresets(selectedPresets.filter(p => p !== preset.value));
                    }
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium">{preset.label}</span>
              </label>
            ))}
          </div>
          {selectedPresets.length > 0 && (
            <Button className="w-full gap-2" onClick={handleSelectPresets}>
              <CheckSquare2 className="w-4 h-4" />
              Add {selectedPresets.length} Document{selectedPresets.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}