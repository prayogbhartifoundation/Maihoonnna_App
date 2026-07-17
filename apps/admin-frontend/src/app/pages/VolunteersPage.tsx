import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataCard } from '../components/common/DataCard';
import { StatusChip } from '../components/common/StatusChip';
import { volunteerApi, beneficiaryApi } from '../../services/api';
import type { Volunteer } from '../../types';
import { Heart, Clock, Award, Users, Trash2, Plus, X, Search, ShieldCheck } from 'lucide-react';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected entities for modals
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailedVolunteer, setDetailedVolunteer] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await volunteerApi.getAll('verified');
      setVolunteers(data);
      const bens = await beneficiaryApi.getAll();
      setBeneficiaries(bens);
    } catch (err: any) {
      setError(err.message || 'Failed to load volunteers data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowAssignModal(true);
  };

  const handleOpenDetail = async (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    try {
      const detail = await volunteerApi.getById(volunteer.id);
      setDetailedVolunteer(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch details.');
    }
  };

  const handleAssign = async (beneficiaryId: string) => {
    if (!selectedVolunteer) return;
    try {
      await volunteerApi.assignBeneficiary(selectedVolunteer.id, beneficiaryId);
      alert('Beneficiary assigned successfully.');
      loadData();
      setShowAssignModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to assign beneficiary.');
    }
  };

  const handleRemoveAssignment = async (beneficiaryId: string) => {
    if (!selectedVolunteer) return;
    if (!confirm('Are you sure you want to remove this beneficiary assignment?')) return;
    try {
      await volunteerApi.removeAssignment(selectedVolunteer.id, beneficiaryId);
      alert('Assignment removed successfully.');
      loadData();
      setShowAssignModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to remove assignment.');
    }
  };

  // Filter out beneficiaries already assigned
  const availableBeneficiaries = beneficiaries.filter(b => {
    if (!selectedVolunteer) return true;
    const assignedIds = selectedVolunteer.assignments?.map(a => a.beneficiaryId) || [];
    return !assignedIds.includes(b.id) && b.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Summary Metrics
  const totalVolunteers = volunteers.length;
  const totalPoints = volunteers.reduce((acc, v) => acc + v.totalCreditPoints, 0);
  const totalHours = volunteers.reduce((acc, v) => acc + v.totalCreditHours, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verified Saathi Volunteers"
        description="View credit balances, log history, and manage senior companion assignments."
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Volunteers</p>
            <p className="text-2xl font-bold">{totalVolunteers}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-lg text-success">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Volunteer Hours</p>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)} Hrs</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-warning/10 rounded-lg text-warning">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Credit Points</p>
            <p className="text-2xl font-bold">{totalPoints.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <p className="text-muted-foreground">Loading Sathi Network...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers.map((v) => (
            <DataCard key={v.id} title={v.name} description={v.phone}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusChip status="Verified" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-[10px] text-muted-foreground uppercase">Credits</p>
                    <p className="text-lg font-bold">{v.totalCreditPoints.toFixed(0)} pts</p>
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-[10px] text-muted-foreground uppercase">Hours</p>
                    <p className="text-lg font-bold">{v.totalCreditHours.toFixed(1)} hrs</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Assigned Beneficiaries ({v.assignments?.length || 0})
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {v.assignments && v.assignments.length > 0 ? (
                      v.assignments.map((a) => (
                        <div key={a.id} className="flex justify-between items-center text-xs p-1.5 bg-secondary rounded">
                          <span className="truncate">{a.beneficiary.name}</span>
                          <button
                            onClick={() => {
                              setSelectedVolunteer(v);
                              handleRemoveAssignment(a.beneficiaryId);
                            }}
                            className="text-destructive hover:bg-destructive/10 p-0.5 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No beneficiaries assigned.</p>
                    )}
                  </div>
                </div>

                {v.interests.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Interests & Hobbies</p>
                    <div className="flex flex-wrap gap-1">
                      {v.interests.map((interest) => (
                        <span key={interest} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => handleOpenDetail(v)}
                    className="flex-1 text-xs py-2 bg-secondary hover:bg-secondary/80 font-medium rounded-lg text-center"
                  >
                    View History
                  </button>
                  <button
                    onClick={() => handleOpenAssign(v)}
                    className="flex-1 text-xs py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-lg flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Senior
                  </button>
                </div>
              </div>
            </DataCard>
          ))}
        </div>
      )}

      {/* Modal: Assignment Manager */}
      {showAssignModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-bold text-lg">Assign Beneficiary to {selectedVolunteer.name}</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search seniors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {availableBeneficiaries.length > 0 ? (
                availableBeneficiaries.map((b) => (
                  <div key={b.id} className="flex justify-between items-center p-3 border border-border rounded-lg hover:bg-secondary/40">
                    <div>
                      <p className="font-semibold text-sm">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.city}, {b.pincode}</p>
                    </div>
                    <button
                      onClick={() => handleAssign(b.id)}
                      className="text-xs px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium"
                    >
                      Assign
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 italic">No available seniors match search.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Volunteer History Log & Credit Transactions */}
      {showDetailModal && detailedVolunteer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <div>
                <h3 className="font-bold text-lg">{detailedVolunteer.name} — Activity Logs</h3>
                <p className="text-xs text-muted-foreground">{detailedVolunteer.phone} | Verified Volunteer</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Credit Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-secondary rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Credit Hours</p>
                  <p className="text-xl font-bold">{detailedVolunteer.totalCreditHours.toFixed(1)} hrs</p>
                </div>
                <div className="p-3 bg-secondary rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Credit Points</p>
                  <p className="text-xl font-bold text-primary">{detailedVolunteer.totalCreditPoints.toFixed(0)} pts</p>
                </div>
                <div className="p-3 bg-secondary rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Goal Progress</p>
                  <p className="text-xl font-bold">
                    {((detailedVolunteer.totalCreditHours / detailedVolunteer.monthlyGoalHours) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Assignments list */}
              <div>
                <h4 className="font-bold text-sm mb-2">Current Assignments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detailedVolunteer.assignments?.length > 0 ? (
                    detailedVolunteer.assignments.map((a: any) => (
                      <div key={a.id} className="p-2 border border-border rounded-lg flex items-center justify-between bg-secondary/10">
                        <span className="text-sm font-medium">{a.beneficiary.name}</span>
                        <span className="text-[10px] text-muted-foreground">Since {new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No assignments.</p>
                  )}
                </div>
              </div>

              {/* Completed visits */}
              <div>
                <h4 className="font-bold text-sm mb-2">Visit History (Last 20)</h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary text-xs uppercase">
                      <tr>
                        <th className="p-3">Senior</th>
                        <th className="p-3">Logged Date</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detailedVolunteer.visitLogs?.length > 0 ? (
                        detailedVolunteer.visitLogs.map((log: any) => (
                          <tr key={log.id}>
                            <td className="p-3 font-medium">{log.beneficiary?.name}</td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(log.checkInTime).toLocaleDateString()}
                            </td>
                            <td className="p-3">{log.hoursEarned?.toFixed(1) || '0.0'} hrs</td>
                            <td className="p-3 text-success font-semibold">+{log.creditPointsEarned?.toFixed(0) || '0'} pts</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground italic">No completed visits recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions logs */}
              <div>
                <h4 className="font-bold text-sm mb-2">Points Ledger Transaction History</h4>
                <div className="space-y-2">
                  {detailedVolunteer.creditTransactions?.length > 0 ? (
                    detailedVolunteer.creditTransactions.map((tx: any) => (
                      <div key={tx.id} className="p-3 bg-secondary/20 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-sm">{tx.description || 'Points Transaction'}</p>
                          <p className="text-muted-foreground">{new Date(tx.createdAt).toLocaleString()} | Type: <span className="uppercase text-[10px] font-bold text-primary">{tx.type}</span></p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${tx.pointsDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {tx.pointsDelta >= 0 ? '+' : ''}{tx.pointsDelta.toFixed(0)} pts
                          </p>
                          <p className="text-[10px] text-muted-foreground">Bal: {tx.balanceAfter.toFixed(0)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-2">No point conversions found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
