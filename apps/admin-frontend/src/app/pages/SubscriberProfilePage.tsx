import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  X, User, Phone, Mail, MapPin, Package, Calendar, Loader2, Users, 
  UserCheck, ChevronRight, ArrowLeft, Edit2, TrendingUp, AlertTriangle, PackageCheck, CheckCircle2, Info
} from 'lucide-react';
import { subscriberApi } from '../../services/api';
import { StatusChip } from '../components/common/StatusChip';
import { Button } from '../components/ui/button';
import { EditSubscriberDialog } from '../components/forms/EditSubscriberDialog';
import { Badge } from '../components/ui/badge';

export default function SubscriberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [utilLoading, setUtilLoading] = useState(false);
  const [selectedBenId, setSelectedBenId] = useState<string | null>('all');

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await subscriberApi.getById(id);
      setDetails(data);
      // Also load utilization
      loadUtilization(id);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriber details');
    } finally {
      setLoading(false);
    }
  };

  const loadUtilization = async (subscriberId: string) => {
    setUtilLoading(true);
    try {
      const data = await subscriberApi.getUtilizationSummary(subscriberId);
      setUtilization(data);
    } catch (e) {
      // Silently fail
    } finally {
      setUtilLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const openBeneficiary = (ben: any) => {
    navigate(`/beneficiaries/${ben.id}`);
  };

  if (loading) {
    return (
      <div className="p-8 bg-[#F4EAE3] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#FF7A00]" />
          <p className="font-bold text-sm uppercase tracking-widest text-gray-500">Loading Subscriber Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 bg-[#F4EAE3] min-h-screen">
        <Button variant="ghost" onClick={() => navigate('/subscribers')} className="mb-6 gap-2">
          <ArrowLeft size={16} /> Back to Subscribers
        </Button>
        <div className="bg-white rounded-[32px] p-20 border border-dashed border-[#E7DED6] text-center">
          <X className="w-16 h-16 text-red-100 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">{error || 'Subscriber not found'}</h2>
          <Button onClick={() => navigate('/subscribers')} className="mt-6 bg-[#FF7A00]">Return to List</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F4EAE3] min-h-screen">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/subscribers')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Subscribers
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E7DED6]">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                  <User className="w-12 h-12 text-[#FF7A00]" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{details.name}</h1>
                <div className="mt-2">
                  <StatusChip status={details.isActive ? 'Active' : 'Inactive'} />
                </div>
                <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-[0.2em]">Subscriber ID: {details.id}</p>
              </div>

              <div className="mt-8 space-y-4 pt-8 border-t border-gray-50">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF7A00] flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Phone</p>
                    <p className="text-sm font-bold text-gray-700">{details.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                    <p className="text-sm font-bold text-gray-700 truncate">{details.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Address</p>
                    <p className="text-sm font-bold text-gray-700">{details.address || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Joined On</p>
                    <p className="text-sm font-bold text-gray-700">{details.createdAt ? new Date(details.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '--'}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full mt-8 py-3 rounded-2xl bg-[#F4EAE3] text-gray-700 font-black uppercase tracking-widest text-[10px] border border-[#E7DED6] hover:bg-[#E7DED6] transition-colors flex items-center justify-center gap-2">
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>
          </div>

          {/* Right Column: Beneficiaries & Subscriptions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recipient Selector Bar (Master Selection) */}
            {details.beneficiaries && details.beneficiaries.length > 0 && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E7DED6] space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Recipient Selector</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedBenId('all')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      selectedBenId === 'all'
                        ? 'bg-[#FF7A00] text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    👥 All Recipients
                  </button>
                  {details.beneficiaries.map((b: any) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBenId(b.id)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                        selectedBenId === b.id
                          ? 'bg-[#FF7A00] text-white shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                    >
                      👤 {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unassigned / Unactivated Plans Alert Bar */}
            {(() => {
              const unassignedSubs = (details.subscriptions || []).filter((sub: any) => !sub.beneficiaryId);
              if (unassignedSubs.length === 0) return null;
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-[32px] p-8 text-amber-800 space-y-4">
                  <div className="flex items-center gap-2.5 font-black text-xs uppercase tracking-wider text-amber-700">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Unassigned / Unactivated Care Plans ({unassignedSubs.length})</span>
                  </div>
                  <p className="text-xs text-amber-600 leading-relaxed font-semibold">
                    These packages have been purchased by the subscriber but are not yet linked to any beneficiary. Details are pending enrollment.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {unassignedSubs.map((sub: any) => (
                      <div key={sub.id} className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-amber-200 flex justify-between items-start text-xs shadow-sm">
                        <div className="space-y-1">
                          <span className="font-bold text-gray-800 text-sm block">{sub.package?.name || 'Unassigned Package'}</span>
                          <span className="text-[10px] text-gray-500 block uppercase tracking-tight font-semibold">Type: {sub.packageType}</span>
                          <span className="text-[9px] text-gray-400 block">Purchased {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 mt-0.5">Pending Details</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* CSA Enrolled & Pending Activation Alert Bar */}
            {(() => {
              const csaPendingSubs = (details.subscriptions || []).filter((sub: any) => 
                sub.beneficiaryId && sub.beneficiary?.verificationStatus === 'pending'
              );
              if (csaPendingSubs.length === 0) return null;
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-[32px] p-8 text-blue-800 space-y-4">
                  <div className="flex items-center gap-2.5 font-black text-xs uppercase tracking-wider text-blue-700">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>CSA-Enrolled Pending Activation ({csaPendingSubs.length})</span>
                  </div>
                  <p className="text-xs text-blue-600 leading-relaxed font-semibold">
                    These plans were enrolled offline by our team (CSA mode). They are waiting for the subscriber to log in and activate them.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {csaPendingSubs.map((sub: any) => (
                      <div key={sub.id} className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-blue-200 flex justify-between items-start text-xs shadow-sm">
                        <div className="space-y-1">
                          <span className="font-bold text-gray-800 text-sm block">{sub.package?.name || 'Care Plan'}</span>
                          <span className="text-[10px] text-blue-600 block uppercase tracking-tight font-semibold">Recipient: {sub.beneficiary?.name}</span>
                          <span className="text-[9px] text-gray-400 block">Enrolled {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 mt-0.5">Pending Action</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Active Subscription Block (Filtered) */}
            <div className="bg-gradient-to-br from-[#FF7A00] to-[#FF9D43] rounded-[32px] p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-80">Current Subscription</h3>
                  <Package className="w-6 h-6 opacity-40 animate-pulse" />
                </div>

                {(() => {
                  const verifiedActiveSubs = (details.subscriptions || []).filter((sub: any) => 
                    sub.beneficiaryId && sub.beneficiary?.verificationStatus === 'verified'
                  );
                  const displayedSubs = verifiedActiveSubs.filter((sub: any) => {
                    if (selectedBenId === 'all') return true;
                    return sub.beneficiaryId === selectedBenId;
                  });

                  if (displayedSubs.length > 0) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {displayedSubs.map((sub: any, i: number) => (
                          <div key={i} className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                            <p className="text-xl font-black">{sub.package?.name || 'Care Package'}</p>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{sub.package?.type || 'Standard Plan'}</p>
                            <p className="text-[10px] font-bold opacity-80 mt-2">Recipient: {sub.beneficiary?.name}</p>
                            <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                              <StatusChip status="Active" />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 flex flex-col items-center">
                      <p className="text-lg font-bold opacity-70">No verified plans found for selected filter</p>
                    </div>
                  );
                })()}
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            </div>

            {/* Beneficiaries List */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E7DED6]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-gray-800">Beneficiaries</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">People receiving care services</p>
                </div>
                <div className="bg-[#F4EAE3] px-4 py-2 rounded-2xl border border-[#E7DED6]">
                  <span className="text-sm font-black text-gray-700">{(details.beneficiaries || []).length} Total</span>
                </div>
              </div>

              {details.beneficiaries && details.beneficiaries.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {details.beneficiaries.map((b: any) => {
                    const isSelected = selectedBenId === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBenId(b.id);
                          openBeneficiary(b);
                        }}
                        className={`group w-full bg-gray-50/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-6 hover:bg-white hover:shadow-md transition-all border ${
                          isSelected ? 'border-[#FF7A00] bg-orange-50/10 shadow-sm' : 'border-transparent hover:border-orange-100'
                        } text-left`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-2xl bg-white border flex items-center justify-center text-[#FF7A00] group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors shadow-sm ${isSelected ? 'border-orange-100 bg-orange-50/50' : 'border-gray-100'}`}>
                            <User size={24} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 group-hover:text-[#FF7A00] transition-colors">{b.name}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-bold uppercase tracking-tight">
                              <span>{b.age} Years</span>
                              <span>•</span>
                              <span>{b.gender}</span>
                              <span>•</span>
                              <span className="text-blue-500">{b.relationship || 'Primary Recipient'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {b.primaryCC?.name ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100/50 text-[#FF7A00] rounded-xl border border-orange-100 font-black text-[10px] uppercase tracking-wider">
                              <UserCheck size={14} /> CC: {b.primaryCC.name}
                            </div>
                          ) : (
                            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No CC Assigned</div>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF7A00] transition-transform group-hover:translate-x-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">No beneficiaries registered</p>
                  <button className="mt-4 text-[#FF7A00] font-black text-[10px] uppercase tracking-widest">Add First Recipient</button>
                </div>
              )}
            </div>

            {/* ─────────── PACKAGE UTILIZATION SUMMARY ─────────── */}
            {(() => {
            const displayedUtil = utilization.filter((u) => {
              if (selectedBenId === 'all') return true;
              return u.beneficiaryId === selectedBenId;
            });

            if (displayedUtil.length === 0 && !utilLoading) return null;

            return (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E7DED6]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-[#FF7A00]" />
                    <h3 className="text-lg font-black text-gray-800">Package Utilization</h3>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {selectedBenId === 'all' ? 'Across all beneficiaries' : 'Selected beneficiary'}
                  </span>
                </div>

                {utilLoading ? (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <Loader2 className="animate-spin text-[#FF7A00]" size={20} />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading utilization...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedUtil.map((u) => (
                      <div
                        key={u.beneficiaryId}
                        className="p-5 rounded-2xl border border-gray-100 bg-[#FDFBF9] hover:border-orange-100 hover:bg-orange-50/20 transition-all cursor-pointer group"
                        onClick={() => navigate(`/beneficiaries/${u.beneficiaryId}`)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF7A00]">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="font-black text-gray-800 text-sm group-hover:text-[#FF7A00] transition-colors">{u.beneficiaryName}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                {u.age} yrs · {u.activePackage || 'No Package'}
                                {u.subscriptionEndDate && (
                                  <span className="ml-1 opacity-70">· expires {new Date(u.subscriptionEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {u.hasExhausted && (
                              <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                                <AlertTriangle size={9} /> Exhausted
                              </span>
                            )}
                            {!u.hasExhausted && u.hasLowBalance && (
                              <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                                <AlertTriangle size={9} /> Low
                              </span>
                            )}
                            {!u.hasExhausted && !u.hasLowBalance && u.benefits.length > 0 && (
                              <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">
                                <CheckCircle2 size={9} /> OK
                              </span>
                            )}
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-[#FF7A00] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                        {/* Mini benefit bars */}
                        {u.benefits.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {u.benefits.map((b: any) => (
                              <div key={b.benefitId}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[9px] font-black text-gray-500 uppercase truncate">{b.benefitName}</span>
                                  <span className="text-[9px] font-black text-gray-400">{b.remainingUnits}/{b.totalUnits}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${b.usagePercent}%`,
                                      backgroundColor: b.isExhausted ? '#EF4444' : b.isLowBalance ? '#F59E0B' : '#FF7A00',
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {u.benefits.length === 0 && (
                          <p className="text-[10px] text-gray-300 italic">No benefit balances configured</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          </div>
        </div>
      </div>

      <EditSubscriberDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        subscriber={details}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchDetails();
        }}
      />
    </div>
  );
}
