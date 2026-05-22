import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusChip } from '../components/common/StatusChip';
import { activityLogApi } from '../../services/api';
import type { ActivityLog } from '../../types';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await activityLogApi.getAll();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesUser = log.userName?.toLowerCase().includes(searchLower) || log.userRole?.toLowerCase().includes(searchLower);
    const matchesAction = log.action?.toLowerCase().includes(searchLower) || log.entity?.toLowerCase().includes(searchLower);
    const matchesDetails = typeof log.details === 'string' && log.details.toLowerCase().includes(searchLower);
    return matchesUser || matchesAction || matchesDetails;
  });

  return (
    <div>
      <PageHeader title="Activity Logs" description="Timestamped audit trail of all system actions" />

      <div className="mb-6 flex items-center bg-card border border-border rounded-lg px-4 py-2 w-full max-w-md shadow-sm">
        <Search className="w-5 h-5 text-muted-foreground mr-3" />
        <input
          type="text"
          placeholder="Search logs by user, role, action or details..."
          className="bg-transparent border-none outline-none w-full text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredLogs.map((log) => {
          const { date, time } = formatTimestamp(log.timestamp);
          return (
            <div
              key={log.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary flex-shrink-0">
                  {log.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-success-foreground" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {(() => {
                          try {
                            const parsed = JSON.parse(log.details);
                            if (!parsed || typeof parsed !== 'object') return log.details;
                            
                            // Specific log formats based on the system actions
                            if (parsed.role && parsed.method) {
                              return `Authentication via ${parsed.method} for role: ${parsed.role.replace('_', ' ')}`;
                            }
                            if (parsed.fieldsChanged && Array.isArray(parsed.fieldsChanged)) {
                              const nameStr = parsed.entityName ? ` (${parsed.entityName})` : '';
                              const actorName = parsed.updatedByName || log.userName;
                              const actorRole = (parsed.updatedByRole || log.userRole).replace('_', ' ');
                              return `${parsed.fieldsChanged.join(', ')} updated for this ${parsed.entity}${nameStr} by ${actorName} (${actorRole})`;
                            }
                            if (parsed.entity && parsed.action) {
                              return `${parsed.action} ${parsed.entity}`;
                            }
                            
                            // General object humanizer
                            const parts = [];
                            for (const [k, v] of Object.entries(parsed)) {
                              if (Array.isArray(v)) {
                                parts.push(`${k}: ${v.join(', ')}`);
                              } else if (typeof v === 'object' && v !== null) {
                                parts.push(`${k}: updated`);
                              } else {
                                parts.push(`${k}: ${v}`);
                              }
                            }
                            return parts.length > 0 ? parts.join(' | ') : log.details;
                          } catch (e) {
                            return log.details;
                          }
                        })()}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {(() => {
                          let actorName = log.userName;
                          let actorRole = log.userRole.replace('_', ' ');
                          try {
                            const parsed = JSON.parse(log.details);
                            if (parsed && typeof parsed === 'object') {
                              actorName = parsed.updatedByName || log.userName;
                              actorRole = (parsed.updatedByRole || log.userRole).replace('_', ' ');
                            }
                          } catch (e) {}

                          return (
                            <>
                              <span className="capitalize">{actorName}</span>
                              <span>•</span>
                              <span className="capitalize">{actorRole}</span>
                              <span>•</span>
                              <span className="capitalize">{log.action.replace(/_/g, ' ')} {log.entity}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <StatusChip status={log.status} />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{date} at {time}</span>
                    </div>
                    {log.ipAddress && (
                      <>
                        <span>•</span>
                        <span>IP: {log.ipAddress}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="font-mono bg-secondary px-2 py-0.5 rounded">{log.id}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No activity logs found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
