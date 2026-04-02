import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataCard } from '../components/common/DataCard';
import { StatusChip } from '../components/common/StatusChip';
import { volunteerApi } from '../../services/api';
import type { Volunteer } from '../../types';
import { Heart, Clock, Calendar } from 'lucide-react';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await volunteerApi.getAll();
    setVolunteers(data);
  };

  return (
    <div>
      <PageHeader title="Volunteers (Saathi)" description="Community volunteers supporting senior care" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {volunteers.map((volunteer) => (
          <DataCard key={volunteer.id} title={volunteer.name} description={volunteer.phone}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-pink-600" />
                <span className="capitalize">{volunteer.type} Volunteer</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Zone:</span>
                <span className="font-medium">{volunteer.zoneId}</span>
              </div>

              <div className="p-3 bg-[#DFF4E6] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-success-foreground" />
                  <span className="text-xs text-muted-foreground">Total Hours Volunteered</span>
                </div>
                <p className="text-2xl font-semibold text-success-foreground">{volunteer.volunteeredHours}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {volunteer.skills.map((skill) => (
                    <span key={skill} className="text-xs px-2 py-1 bg-secondary rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Available Days</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {volunteer.availableDays.map((day) => (
                    <span key={day} className="text-xs px-2 py-1 bg-[#FFF5EE] text-[#FF7A00] rounded-full">
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <StatusChip status={volunteer.isActive ? 'Active' : 'Inactive'} />
                <span className="text-xs text-muted-foreground">Since {volunteer.joinedDate}</span>
              </div>
            </div>
          </DataCard>
        ))}
      </div>
    </div>
  );
}
