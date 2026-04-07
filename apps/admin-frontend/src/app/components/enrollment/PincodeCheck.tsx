import React, { useEffect, useState } from 'react';
import { enrollmentApi } from '../../../services/api';
import { CheckCircle2, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PincodeCheckProps {
  pincode: string;
  onCheck?: (serviceable: boolean, zone?: any) => void;
}

export const PincodeCheck: React.FC<PincodeCheckProps> = ({ pincode, onCheck }) => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ serviceable: boolean; zoneName?: string } | null>(null);

  useEffect(() => {
    if (pincode.length !== 6) {
      setResult(null);
      return;
    }

    const check = async () => {
      setChecking(true);
      try {
        const data = await enrollmentApi.checkPincode(pincode);
        setResult({
          serviceable: data.serviceable,
          zoneName: data.zone?.name
        });
        if (onCheck) onCheck(data.serviceable, data.zone);
      } catch (err) {
        console.error('Pincode check failed:', err);
        setResult(null);
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [pincode]);

  if (pincode.length !== 6) return null;

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin text-primary" />
        Checking area serviceability...
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mt-2">
      {result.serviceable ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 py-1 px-2.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Service Available: {result.zoneName}
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 py-1 px-2.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          Service Not Yet Available in this Pincode
        </Badge>
      )}
    </div>
  );
};
