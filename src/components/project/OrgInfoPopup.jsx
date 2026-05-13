import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function OrgInfoPopup({ x, y, onClose, orgInfo, onInsert }) {
  const popupRef = useRef(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopy = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success('Copied');
  };

  const handleInsert = (value) => {
    if (!value) return;
    onInsert(value);
    onClose();
    toast.success('Inserted');
  };

  const fields = [
    { key: 'charitable_number', label: 'Charitable #', value: orgInfo?.charitable_number },
    { key: 'corporate_number', label: 'Corporate #', value: orgInfo?.corporate_number },
    { key: 'business_number', label: 'Business #', value: orgInfo?.business_number },
    { key: 'legal_name', label: 'Legal Name', value: orgInfo?.legal_name },
    { key: 'incorporation_date', label: 'Incorporation', value: orgInfo?.incorporation_date },
    { key: 'fiscal_year_end', label: 'Fiscal Year End', value: orgInfo?.fiscal_year_end },
  ];

  const availableFields = fields.filter(f => f.value);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-3"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className="space-y-1 min-w-max">
        {availableFields.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-1">No organization info set</p>
        ) : (
          availableFields.map(field => (
            <div key={field.key} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground min-w-20 truncate">{field.label}:</span>
              <span className="font-mono text-foreground truncate max-w-[150px]">{field.value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => handleCopy(field.value)}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => handleInsert(field.value)}
                title="Insert into field"
              >
                <Check className="w-3 h-3 text-green-600" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}