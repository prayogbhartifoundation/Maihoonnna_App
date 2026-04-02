import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusChip } from '../components/common/StatusChip';
import { activityLogApi } from '../../services/api';
import type { ActivityLog } from '../../types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await activityLogApi.getAll();
    setLogs(data);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  return (
    <div>
      <PageHeader title="Activity Logs" description="Timestamped audit trail of all system actions" />

      <div className="space-y-3">
        {logs.map((log) => {
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
                      <p className="font-medium">{log.details}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="capitalize">{log.userName}</span>
                        <span>•</span>
                        <span className="capitalize">{log.userRole.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="capitalize">{log.action} {log.entity}</span>
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
      </div>
    </div>
  );
}
