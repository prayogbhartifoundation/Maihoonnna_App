import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusChip } from '../components/common/StatusChip';
import { Button } from '../components/ui/button';
import { userApi } from '../../services/api';
import type { User } from '../../types';
import { Plus, Fingerprint } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await userApi.getAll();
    setUsers(data);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'master_admin': return 'bg-[#FF7A00] text-white';
      case 'operations_manager': return 'bg-blue-500 text-white';
      case 'field_manager': return 'bg-green-500 text-white';
      case 'care_companion': return 'bg-pink-500 text-white';
      case 'support_team': return 'bg-purple-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin User Management"
        description="Manage internal users and their access permissions"
        action={
          <Button className="bg-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        }
      />

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{user.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${getRoleBadgeColor(user.role)}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                  {user.biometricEnabled && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-[#DFF4E6] text-success-foreground rounded-full">
                      <Fingerprint className="w-3 h-3" />
                      Biometric
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2">{user.phone}</span>
                  </div>
                  {user.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{user.email}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{user.createdAt}</span>
                  </div>
                </div>

                {user.lastLogin && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Last login: {new Date(user.lastLogin).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <StatusChip status={user.isActive ? 'Active' : 'Inactive'} />
                <Button size="sm" variant="ghost">
                  Edit Access
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
