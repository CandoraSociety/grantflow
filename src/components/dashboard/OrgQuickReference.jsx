import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const FIELDS = [
  { key: 'charitable_number', label: 'Charitable Number' },
  { key: 'business_number', label: 'Business Number' },
  { key: 'corporate_number', label: 'Corporate Number' },
  { key: 'legal_name', label: 'Legal Name' },
  { key: 'incorporation_date', label: 'Incorporation Date' },
  { key: 'fiscal_year_end', label: 'Fiscal Year End' },
];

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-sm font-medium text-foreground truncate">{value}</p>
      </div>
      <Button
        variant="default"
        size="sm"
        className="flex-shrink-0 gap-1.5"
        onClick={handleCopy}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Click to copy'}
      </Button>
    </div>
  );
}

export default function OrgQuickReference({ orgInfo }) {
  const availableFields = FIELDS.filter(f => orgInfo?.[f.key]);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-heading">
          <Building2 className="w-5 h-5 text-primary" />
          Organization Quick Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        {availableFields.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-muted-foreground">No organization info set yet.</p>
            <p className="text-xs text-muted-foreground">
              Add your charitable number, business number, and more in{' '}
              <Link to="/proposals" className="text-primary hover:underline">Settings → Org Info</Link>.
            </p>
          </div>
        ) : (
          <div className="divide-y-0">
            {availableFields.map(f => (
              <CopyField key={f.key} label={f.label} value={orgInfo[f.key]} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}