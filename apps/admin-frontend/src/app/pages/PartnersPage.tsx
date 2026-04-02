import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataCard } from '../components/common/DataCard';
import { StatusChip } from '../components/common/StatusChip';
import { partnerApi } from '../../services/api';
import type { Partner } from '../../types';
import { Building2, Phone, Mail, User } from 'lucide-react';

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await partnerApi.getAll();
    setPartners(data);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pharmacy': return 'bg-blue-50 text-blue-700';
      case 'laboratory': return 'bg-purple-50 text-purple-700';
      case 'hospital': return 'bg-pink-50 text-pink-700';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div>
      <PageHeader title="Partners" description="Third-party labs, pharmacies, and healthcare providers" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => (
          <DataCard key={partner.id} title={partner.name}>
            <div className="space-y-3">
              <span className={`inline-block text-xs px-2 py-1 rounded-full capitalize ${getTypeColor(partner.type)}`}>
                {partner.type}
              </span>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{partner.address}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{partner.contactPerson}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{partner.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{partner.email}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Services Offered</p>
                <div className="flex flex-wrap gap-1">
                  {partner.servicesOffered.map((service) => (
                    <span key={service} className="text-xs px-2 py-1 bg-[#DFF4E6] text-success-foreground rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <StatusChip status={partner.isActive ? 'Active' : 'Inactive'} />
                <span className="text-xs text-muted-foreground">Since {partner.onboardedDate}</span>
              </div>
            </div>
          </DataCard>
        ))}
      </div>
    </div>
  );
}
