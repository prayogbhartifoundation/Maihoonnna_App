import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataCard } from '../components/common/DataCard';
import { volunteerApi } from '../../services/api';
import type { Volunteer } from '../../types';
import { FileText, Check, Ban, X } from 'lucide-react';

export default function VolunteerRequestsPage() {
  const [requests, setRequests] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rejection modal
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pending = await volunteerApi.getAll('pending');
      setRequests(pending);
    } catch (err: any) {
      setError(err.message || 'Failed to load volunteer applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to verify and approve this volunteer profile?')) return;
    try {
      await volunteerApi.verify(id);
      alert('Volunteer verified successfully.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to verify volunteer.');
    }
  };

  const handleOpenReject = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedVolunteer || !rejectionReason.trim()) return;
    try {
      await volunteerApi.reject(selectedVolunteer.id, rejectionReason);
      alert('Application rejected successfully.');
      setShowRejectModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject application.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saathi Volunteer Applications"
        description="Review pending volunteer onboarding requests, check interests, and verify accounts."
      />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((v) => (
            <DataCard key={v.id} title={v.name} description={v.phone}>
              <div className="space-y-4">
                {v.email && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{v.email}</span>
                  </div>
                )}

                {v.age && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Age / Gender:</span>{' '}
                    <span className="font-medium">{v.age} yrs / {v.gender || 'Not specified'}</span>
                  </div>
                )}

                {v.previousExperience && (
                  <div className="p-3 bg-secondary rounded-lg space-y-1">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Past Volunteer Experience
                    </p>
                    <p className="text-xs line-clamp-3 text-muted-foreground">{v.previousExperience}</p>
                  </div>
                )}

                {v.whyJoin && (
                  <div className="p-3 bg-secondary rounded-lg space-y-1">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Why they want to join</p>
                    <p className="text-xs line-clamp-3 text-muted-foreground">{v.whyJoin}</p>
                  </div>
                )}

                {v.interests.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Interests</p>
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
                    onClick={() => handleOpenReject(v)}
                    className="flex-1 text-xs py-2 bg-destructive/10 text-destructive hover:bg-destructive/15 font-semibold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(v.id)}
                    className="flex-1 text-xs py-2 bg-[#DFF4E6] text-success-foreground hover:bg-[#D4EEDC] font-semibold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Verify
                  </button>
                </div>
              </div>
            </DataCard>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-border rounded-xl space-y-2">
          <p className="font-bold text-muted-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground">No pending volunteer applications found.</p>
        </div>
      )}

      {/* Modal: Rejection Reason Dialog */}
      {showRejectModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-bold text-lg">Reject Onboarding Request</h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Please enter a reason for rejecting the application of <strong>{selectedVolunteer.name}</strong>:
              </p>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason (e.g. Invalid phone verification, insufficient companion parameters...)"
                className="w-full p-3 border border-border rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-destructive text-destructive-foreground disabled:opacity-50 rounded-lg text-sm font-semibold"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
