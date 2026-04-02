/**
 * Dashboard Page - Overview and Key Metrics
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataCard } from '../components/common/DataCard';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, Heart, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { zoneApi, subscriberApi, beneficiaryApi, careCompanionApi, scheduleApi, supportApi } from '../../services/api';
import type { Zone, Subscriber, Beneficiary, CareCompanion, VisitBlock, SupportTicket } from '../../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [careCompanions, setCareCompanions] = useState<CareCompanion[]>([]);
  const [todayVisits, setTodayVisits] = useState<VisitBlock[]>([]);
  const [openTickets, setOpenTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [zonesData, subsData, bensData, ccsData, visitsData, ticketsData] = await Promise.all([
      zoneApi.getAll(),
      subscriberApi.getAll(),
      beneficiaryApi.getAll(),
      careCompanionApi.getAll(),
      scheduleApi.getTodayVisits(),
      supportApi.getAll(),
    ]);
    setZones(zonesData);
    setSubscribers(subsData);
    setBeneficiaries(bensData);
    setCareCompanions(ccsData);
    setTodayVisits(visitsData || []);
    setOpenTickets((ticketsData || []).filter(t => t.status === 'open' || t.status === 'in_progress'));
  };

  const stats = [
    {
      label: 'Active Zones',
      value: (zones || []).filter(z => z.isActive).length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Subscribers',
      value: (subscribers || []).filter(s => s.isActive).length,
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Beneficiaries',
      value: (beneficiaries || []).filter(b => b.isActive).length,
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      label: 'Care Companions',
      value: (careCompanions || []).filter(cc => cc.isActive).length,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-[#DFF4E6]',
    },
    {
      label: "Today's Visits",
      value: todayVisits.length,
      icon: Calendar,
      color: 'text-[#FF7A00]',
      bgColor: 'bg-[#FFF5EE]',
    },
    {
      label: 'Open Tickets',
      value: openTickets.length,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  const completedVisits = (todayVisits || []).filter(v => v.status === 'completed').length;
  const completionRate = todayVisits.length > 0 
    ? Math.round((completedVisits / todayVisits.length) * 100) 
    : 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name}!`}
        description="Here's an overview of your senior care operations"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DataCard title="Today's Visit Progress" description={`${completedVisits} of ${todayVisits.length} visits completed`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <span className="text-lg font-semibold text-success-foreground">{completionRate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-[#1F8A3E] h-3 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mt-4">
              <div className="text-center p-2 bg-[#DFF4E6] rounded">
                <div className="font-semibold text-success-foreground">{completedVisits}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-2 bg-[#FFF5EE] rounded">
                <div className="font-semibold text-[#FF7A00]">
                  {(todayVisits || []).filter(v => v.status === 'in_progress').length}
                </div>
                <div className="text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center p-2 bg-secondary rounded">
                <div className="font-semibold">
                  {(todayVisits || []).filter(v => v.status === 'scheduled').length}
                </div>
                <div className="text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </div>
        </DataCard>

        <DataCard title="Care Companion Utilization" description="Average team capacity">
          <div className="space-y-3">
            {(careCompanions || []).slice(0, 4).map((cc) => (
              <div key={cc.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium truncate">{cc.name}</span>
                  <span className="text-muted-foreground">{cc.utilization}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      cc.utilization >= 90 ? 'bg-destructive' : 
                      cc.utilization >= 75 ? 'bg-[#FF7A00]' : 
                      'bg-[#1F8A3E]'
                    }`}
                    style={{ width: `${cc.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataCard title="Open Support Tickets" description={`${openTickets.length} tickets need attention`}>
          <div className="space-y-2">
            {openTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.reportedBy} • {ticket.category}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  ticket.priority === 'high' || ticket.priority === 'urgent'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-[#FFF5EE] text-[#FF7A00]'
                }`}>
                  {ticket.priority}
                </span>
              </div>
            ))}
            {openTickets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No open tickets
              </p>
            )}
          </div>
        </DataCard>

        <DataCard title="Zone Overview" description={`${zones.length} operational zones`}>
          <div className="space-y-2">
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">{zone.city}, {zone.state}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[#DFF4E6] text-success-foreground">
                  Active
                </span>
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  );
}
